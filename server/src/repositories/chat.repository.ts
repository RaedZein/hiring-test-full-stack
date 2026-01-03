import { randomUUID } from 'crypto';
import type { Chat, Message, ChatSummary } from '../types';
import {
  listChatFiles,
  readChatFile,
  writeChatFileAndWait,
  deleteChatFile,
  ensureChatsDir,
  waitForCacheInit,
} from '../services/storage.service';

/**
 * Persistent Chat Repository
 *
 * Provides CRUD operations for chats and messages.
 * Uses per-chat JSON files for storage: data/chats/{chatId}.json
 */

/**
 * In-memory chat storage
 */
const chats = new Map<string, Chat>();

/**
 * Load chats from storage on first access (lazy loading)
 */
let chatsLoaded = false;
async function ensureChatsLoaded(): Promise<void> {
  if (chatsLoaded) return;

  // Wait for KV cache to initialize
  await waitForCacheInit();

  ensureChatsDir();
  const chatIds = listChatFiles();

  for (const chatId of chatIds) {
    const chat = readChatFile<Chat | null>(chatId, null);
    if (chat) {
      chats.set(chatId, chat);
    }
  }

  chatsLoaded = true;
}

/**
 * Save a single chat to its file
 */
async function saveChat(chatId: string): Promise<void> {
  const chat = chats.get(chatId);
  if (chat) {
    await writeChatFileAndWait(chatId, chat);
  }
}

function generateId(): string {
  return randomUUID();
}

/**
 * Get default model ID from user config
 */
function getDefaultModelId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const llmConfigService = require('../services/llm-config.service');
    const selectedModelId = llmConfigService.getSelectedModelId();

    if (selectedModelId) {
      return selectedModelId;
    }
  } catch {
    // If import fails, return empty
  }

  return '';
}

/**
 * Create a new chat
 */
export async function createChat(
  userId: string,
  modelId?: string,
  title?: string
): Promise<Chat> {
  const now = new Date().toISOString();

  const finalModelId = modelId || getDefaultModelId();
  if (!finalModelId) {
    throw new Error('Model ID is required. Please select a model or configure a default.');
  }

  const chat: Chat = {
    id: generateId(),
    userId,
    title: title || 'New Chat',
    messages: [],
    modelId: finalModelId,
    createdAt: now,
    updatedAt: now,
  };

  chats.set(chat.id, chat);
  await saveChat(chat.id);
  return chat;
}

/**
 * Get a chat by ID
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  await ensureChatsLoaded();
  return chats.get(chatId) || null;
}

/**
 * List all chats for a user
 */
export async function listChats(userId: string): Promise<Chat[]> {
  await ensureChatsLoaded();
  return Array.from(chats.values())
    .filter((chat) => chat.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get chat summaries for a user (without full message history)
 */
export async function getChatSummaries(userId: string): Promise<ChatSummary[]> {
  const chats = await listChats(userId);
  return chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt,
    modelId: chat.modelId,
  }));
}

/**
 * Add a message to a chat
 */
export async function addMessage(
  chatId: string,
  message: Partial<Message> & Pick<Message, 'role' | 'content'>
): Promise<Message> {
  const chat = chats.get(chatId);
  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  const now = new Date().toISOString();
  const fullMessage: Message = {
    id: message.id || generateId(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || now,
  };

  chat.messages.push(fullMessage);
  chat.updatedAt = now;
  await saveChat(chatId);

  return fullMessage;
}

/**
 * Add a message to chat without saving to disk (for streaming)
 */
export function addMessageWithoutSave(
  chatId: string,
  message: Partial<Message> & Pick<Message, 'role' | 'content'>
): Message {
  const chat = chats.get(chatId);
  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  const now = new Date().toISOString();
  const fullMessage: Message = {
    id: message.id || generateId(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || now,
  };

  chat.messages.push(fullMessage);
  chat.updatedAt = now;

  return fullMessage;
}

/**
 * Update the last message in a chat (for streaming updates)
 */
export function updateLastMessage(chatId: string, content: string): void {
  const chat = chats.get(chatId);
  if (!chat || chat.messages.length === 0) {
    return;
  }

  const lastMessage = chat.messages[chat.messages.length - 1];
  lastMessage.content = content;
  chat.updatedAt = new Date().toISOString();
}

/**
 * Save a chat to disk (call after streaming completes)
 */
export async function persistChat(chatId: string): Promise<void> {
  await saveChat(chatId);
}

/**
 * Update a chat's properties
 */
export async function updateChat(
  chatId: string,
  updates: Partial<Omit<Chat, 'id' | 'userId' | 'createdAt'>>
): Promise<Chat> {
  const chat = chats.get(chatId);
  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  Object.assign(chat, updates);
  chat.updatedAt = new Date().toISOString();
  await saveChat(chatId);

  return chat;
}

/**
 * Update a chat's properties without saving to disk
 */
export function updateChatWithoutSave(
  chatId: string,
  updates: Partial<Omit<Chat, 'id' | 'userId' | 'createdAt'>>
): Chat {
  const chat = chats.get(chatId);
  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  Object.assign(chat, updates);
  chat.updatedAt = new Date().toISOString();

  return chat;
}

/**
 * Delete a chat
 */
export function deleteChat(chatId: string): boolean {
  const result = chats.delete(chatId);
  if (result) {
    deleteChatFile(chatId);
  }
  return result;
}

/**
 * Clear all chats (useful for testing)
 */
export function clearAllChats(): void {
  const chatIds = Array.from(chats.keys());
  chats.clear();
  for (const chatId of chatIds) {
    deleteChatFile(chatId);
  }
}
