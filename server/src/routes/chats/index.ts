import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import type {
  ChatListResponse,
  LLMStreamChunk,
  LLMProviderType,
} from '../../types';
import * as chatService from '../../services/chat.service';
import * as chatRepository from '../../repositories/chat.repository';
import { getLLMProvider } from '../../providers/llm';

const SSE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
} as const;

function setupSSEResponse(reply: FastifyReply): void {
  reply.raw.writeHead(200, SSE_HEADERS);
}

function sendChunk(reply: FastifyReply, chunk: LLMStreamChunk): void {
  reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

function getProviderTypeForModel(modelId: string): LLMProviderType {
  if (modelId.includes('claude')) return 'anthropic';
  if (modelId.includes('gpt')) return 'openai';
  if (modelId.includes('gemini')) return 'gemini';

  const defaultProvider = (process.env.DEFAULT_LLM_PROVIDER || 'anthropic') as LLMProviderType;
  return defaultProvider;
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
    const chats = chatService.listChats(userId);

    return { chats };
  });

  fastify.post<{
    Body: { modelId?: string };
  }>('/', async (request, reply) => {
    const userId = request.userId;
    const { modelId } = request.body;

    const chat = chatService.createChat(userId, modelId);

    reply.code(201);
    return { id: chat.id };
  });

  fastify.post<{
    Params: { id: string };
    Body: { message: string; modelId?: string };
  }>('/:id/stream', async (request, reply) => {
    const userId = request.userId;
    const { id: chatId } = request.params;
    const { message, modelId: overrideModelId } = request.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return reply.code(400).send({ error: 'Message is required' });
    }

    const chat = chatService.getChat(userId, chatId);

    const finalModelId = overrideModelId || chat.modelId;
    const providerType = getProviderTypeForModel(finalModelId);
    const provider = getLLMProvider(providerType);

    chatRepository.addMessageWithoutSave(chatId, {
      role: 'user',
      content: message.trim(),
    });

    const updatedChat = chatRepository.getChat(chatId);
    const updatedMessages = updatedChat?.messages || [];

    setupSSEResponse(reply);

    const assistantMessageId = randomUUID();
    sendChunk(reply, { type: 'connected', messageId: assistantMessageId });

    let fullContent = '';

    try {
      for await (const text of provider.streamCompletion(
        updatedMessages,
        finalModelId
      )) {
        fullContent += text;
        sendChunk(reply, { type: 'text', content: text });
      }

      chatRepository.addMessageWithoutSave(chatId, {
        id: assistantMessageId,
        role: 'assistant',
        content: fullContent,
      });

      if (chat.title === 'New Chat') {
        const title = generateChatTitle(message);
        chatRepository.updateChatWithoutSave(chatId, { title });
      }

      chatRepository.persistChat(chatId);

      sendChunk(reply, { type: 'done', messageId: assistantMessageId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      request.log.error(error, 'Error in chat stream');

      if (fullContent) {
        chatRepository.addMessageWithoutSave(chatId, {
          id: assistantMessageId,
          role: 'assistant',
          content: fullContent,
        });
        chatRepository.persistChat(chatId);
      }

      sendChunk(reply, { type: 'error', error: errorMessage });
    } finally {
      reply.raw.end();
    }
  });

  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const userId = request.userId;
    const { id: chatId } = request.params;

    try {
      const chat = chatService.getChat(userId, chatId);
      return chat;
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
