import { randomUUID } from 'crypto';
import type { Chat, Message, ChatSummary } from '../types';
import {
  listChatFiles,
  readChatFile,
  writeChatFile,
  deleteChatFile,
  ensureChatsDir,
} from '../services/storage.service';

/**
 * Persistent Chat Repository
 *
 * Provides CRUD operations for chats and messages.
 * Uses per-chat JSON files for storage: data/chats/{chatId}.json
 */

/**
 * Load chats from per-chat files into memory on startup
 */
function loadChats(): Map<string, Chat> {
  ensureChatsDir();

  const chatIds = listChatFiles();
  const chatsMap = new Map<string, Chat>();

  for (const chatId of chatIds) {
    const chat = readChatFile<Chat | null>(chatId, null);
    if (chat) {
      chatsMap.set(chatId, chat);
    }
  }

  return chatsMap;
}

/**
 * Save a single chat to its file
 */
function saveChat(chatId: string): void {
  const chat = chats.get(chatId);
  if (chat) {
    writeChatFile(chatId, chat);
  }
}

const chats = loadChats();

function generateId(): string {
  return randomUUID();
}

/**
 * Get default model ID from environment variable
 */
function getDefaultModelId(): string {
  return process.env.DEFAULT_MODEL_ID || 'claude-sonnet-4-20250514';
}

/**
 * Create a new chat
 */
export function createChat(
  userId: string,
  modelId?: string,
  title?: string
): Chat {
  const now = new Date().toISOString();

  const finalModelId = modelId || getDefaultModelId();
  if (!finalModelId) {
    throw new Error('Model ID is required. Please select a model or configure DEFAULT_MODEL_ID environment variable.');
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
  saveChat(chat.id);
  return chat;
}

/**
 * Get a chat by ID
 */
export function getChat(chatId: string): Chat | null {
  return chats.get(chatId) || null;
}

/**
 * List all chats for a user
 */
export function listChats(userId: string): Chat[] {
  return Array.from(chats.values())
    .filter((chat) => chat.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get chat summaries for a user (without full message history)
 */
export function getChatSummaries(userId: string): ChatSummary[] {
  return listChats(userId).map((chat) => ({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt,
    modelId: chat.modelId,
  }));
}

/**
 * Add a message to a chat
 */
export function addMessage(
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
  saveChat(chatId);

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
export function persistChat(chatId: string): void {
  saveChat(chatId);
}

/**
 * Update a chat's properties
 */
export function updateChat(
  chatId: string,
  updates: Partial<Omit<Chat, 'id' | 'userId' | 'createdAt'>>
): Chat {
  const chat = chats.get(chatId);
  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  Object.assign(chat, updates);
  chat.updatedAt = new Date().toISOString();
  saveChat(chatId);

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
