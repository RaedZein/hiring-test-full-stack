import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import type {
  ChatListResponse,
  LLMStreamChunk,
  LLMProviderType,
  Message,
} from '../../types';
import * as chatService from '../../services/chat.service';
import * as chatRepository from '../../repositories/chat.repository';
import * as llmConfigService from '../../services/llm-config.service';
import { streamManager } from '../../services/stream-manager.service';
import { getLLMProvider } from '../../providers/llm';
import { BASE_SYSTEM_PROMPT } from '../../providers/llm/system-prompts';

const SSE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

function setupSSEResponse(reply: FastifyReply): void {
  reply.raw.writeHead(200, SSE_HEADERS);
}

function sendChunk(reply: FastifyReply, chunk: LLMStreamChunk): void {
  reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

interface StreamContext {
  chatId: string;
  messages: Message[];
  modelId: string;
  assistantMessageId: string;
  userMessage?: string;
  request: FastifyRequest;
  reply: FastifyReply;
}

async function executeStream(ctx: StreamContext): Promise<void> {
  const { chatId, messages, modelId, assistantMessageId, userMessage, request, reply } = ctx;

  try {
    sendChunk(reply, { type: 'connected', messageId: assistantMessageId });

    streamManager.startStream(chatId, assistantMessageId);
    streamManager.subscribe(chatId, reply.raw);

    const providerType = getProviderTypeForModel(modelId);
    const provider = getLLMProvider(providerType);

    for await (const text of provider.streamCompletion(
      messages,
      modelId,
      BASE_SYSTEM_PROMPT
    )) {
      streamManager.appendChunk(chatId, text);
    }

    const fullContent = streamManager.completeStream(chatId);

    chatRepository.addMessageWithoutSave(chatId, {
      id: assistantMessageId,
      role: 'assistant',
      content: fullContent,
    });

    const chat = await chatRepository.getChat(chatId);
    if (userMessage && chat?.title === 'New Chat') {
      const title = generateChatTitle(userMessage);
      chatRepository.updateChatWithoutSave(chatId, { title });
    }

    await chatRepository.persistChat(chatId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    request.log.error(error, 'Error in chat stream');

    const partialContent = streamManager.failStream(chatId, errorMessage);

    if (partialContent) {
      chatRepository.addMessageWithoutSave(chatId, {
        role: 'assistant',
        content: partialContent,
      });
      await chatRepository.persistChat(chatId);
    }
  }
}

function getProviderTypeForModel(modelId: string): LLMProviderType {
  const customConfig = llmConfigService.getCustomProvider();
  if (customConfig && customConfig.modelId === modelId) {
    return 'custom';
  }

  if (modelId.includes('claude')) return 'anthropic';
  if (modelId.includes('gpt')) return 'openai';
  if (modelId.includes('gemini')) return 'gemini';

  const selectedProvider = llmConfigService.getSelectedProvider();
  if (selectedProvider) {
    return selectedProvider;
  }

  throw new Error(`Cannot determine provider for model: ${modelId}. Please configure a default provider.`);
}

function generateChatTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.trim().replace(/\s+/g, ' ');

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength - 3) + '...';
}

const chats: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Reply: ChatListResponse }>('/', async (request) => {
    const userId = request.userId;
    const chats = await chatService.listChats(userId);

    return { chats };
  });

  fastify.post<{
    Body: { message: string };
  }>('/', async (request, reply) => {
    const userId = request.userId;
    const { message } = request.body;

    const selectedModelId = llmConfigService.getSelectedModelId();
    const chat = await chatService.createChat(userId, selectedModelId);

    chatRepository.addMessageWithoutSave(chat.id, {
      role: 'user',
      content: message,
    });

    await chatRepository.persistChat(chat.id);

    reply.code(201);
    return { id: chat.id };
  });

  fastify.post<{
    Params: { id: string };
    Body: { message?: string };
  }>('/:id/stream', async (request, reply) => {
    const userId = request.userId;
    const { id: chatId } = request.params;
    const { message } = request.body;

    const chat = await chatService.getChat(userId, chatId);
    const currentChat = await chatRepository.getChat(chatId);
    const currentMessages = currentChat?.messages || [];

    if (!message) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      const needsResponse = lastMessage && lastMessage.role === 'user';

      if (streamManager.hasActiveStream(chatId)) {
        setupSSEResponse(reply);
        const streamInfo = streamManager.subscribe(chatId, reply.raw);
        if (streamInfo) {
          const initChunk: LLMStreamChunk = {
            type: 'init',
            content: streamInfo.accumulated,
            messageId: streamInfo.messageId,
            chatId,
          };
          sendChunk(reply, initChunk);
        }
        return;
      }

      if (needsResponse) {
        setupSSEResponse(reply);
        const assistantMessageId = randomUUID();
        await executeStream({
          chatId,
          messages: currentMessages,
          modelId: chat.modelId,
          assistantMessageId,
          userMessage: lastMessage.content,
          request,
          reply,
        });
        return;
      }

      return { hasActiveStream: false };
    }

    chatRepository.addMessageWithoutSave(chatId, {
      role: 'user',
      content: message,
    });

    const updatedChat = await chatRepository.getChat(chatId);
    const updatedMessages = updatedChat?.messages || [];

    setupSSEResponse(reply);

    const assistantMessageId = randomUUID();
    await executeStream({
      chatId,
      messages: updatedMessages,
      modelId: chat.modelId,
      assistantMessageId,
      userMessage: message,
      request,
      reply,
    });
  });

  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const userId = request.userId;
    const { id: chatId } = request.params;

    try {
      const chat = await chatService.getChat(userId, chatId);
      const hasActiveStream = streamManager.hasActiveStream(chatId);
      return { ...chat, hasActiveStream };
    } catch (error: unknown) {
      if (error instanceof chatService.ChatError) {
        reply.code(error.statusCode);
        return { error: error.message };
      }
      throw error;
    }
  });

  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const userId = request.userId;
    const { id: chatId } = request.params;

    try {
      chatService.deleteChat(userId, chatId);
      reply.code(204);
      return;
    } catch (error: unknown) {
      if (error instanceof chatService.ChatError) {
        reply.code(error.statusCode);
        return { error: error.message };
      }
      throw error;
    }
  });
};

export default chats;
