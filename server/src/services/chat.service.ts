import type { Chat, ChatSummary } from '../types';
import * as chatRepository from '../repositories/chat.repository';

/**
 * Chat Service
 *
 * Business logic layer for chat operations.
 * Enforces user ownership validation and authorization.
 */

/**
 * Custom error for chat-related operations
 */
export class ChatError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * Create a new chat for a user
 *
 * @param userId - User ID who will own the chat
 * @param modelId - Optional model ID (defaults to DEFAULT_MODEL_ID from env)
 * @returns Newly created chat
 */
export function createChat(userId: string, modelId?: string): Chat {
  if (!userId) {
    throw new ChatError('User ID is required', 400);
  }

  return chatRepository.createChat(userId, modelId);
}

/**
 * Get a chat by ID with ownership validation
 *
 * @param userId - User ID requesting the chat
 * @param chatId - Chat ID
 * @returns Chat if found and owned by user
 * @throws ChatError if not found or not owned by user
 */
export function getChat(userId: string, chatId: string): Chat {
  if (!userId) {
    throw new ChatError('User ID is required', 400);
  }

  if (!chatId) {
    throw new ChatError('Chat ID is required', 400);
  }

  const chat = chatRepository.getChat(chatId);

  if (!chat) {
    throw new ChatError('Chat not found', 404);
  }

  if (chat.userId !== userId) {
    throw new ChatError('Unauthorized: Chat does not belong to user', 403);
  }

  return chat;
}

/**
 * List all chats for a user (summary view without full messages)
 *
 * @param userId - User ID
 * @returns Array of chat summaries
 */
export function listChats(userId: string): ChatSummary[] {
  if (!userId) {
    throw new ChatError('User ID is required', 400);
  }

  return chatRepository.getChatSummaries(userId);
}

/**
 * Delete a chat with ownership validation
 *
 * @param userId - User ID requesting deletion
 * @param chatId - Chat ID to delete
 * @throws ChatError if not found or not owned by user
 */
export function deleteChat(userId: string, chatId: string): void {
  if (!userId) {
    throw new ChatError('User ID is required', 400);
  }

  if (!chatId) {
    throw new ChatError('Chat ID is required', 400);
  }

  const chat = chatRepository.getChat(chatId);

  if (!chat) {
    throw new ChatError('Chat not found', 404);
  }

  if (chat.userId !== userId) {
    throw new ChatError('Unauthorized: Chat does not belong to user', 403);
  }

  chatRepository.deleteChat(chatId);
}

/**
 * Update chat title with ownership validation
 *
 * @param userId - User ID requesting update
 * @param chatId - Chat ID to update
 * @param title - New title
 * @returns Updated chat
 * @throws ChatError if not found or not owned by user
 */
export function updateChatTitle(
  userId: string,
  chatId: string,
  title: string
): Chat {
  if (!userId) {
    throw new ChatError('User ID is required', 400);
  }

  if (!chatId) {
    throw new ChatError('Chat ID is required', 400);
  }

  const chat = chatRepository.getChat(chatId);

  if (!chat) {
    throw new ChatError('Chat not found', 404);
  }

  if (chat.userId !== userId) {
    throw new ChatError('Unauthorized: Chat does not belong to user', 403);
  }

  return chatRepository.updateChat(chatId, { title });
}
