import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

/**
 * Storage Service with Vercel KV support
 */

const USE_KV = !!process.env.KV_REST_API_URL;
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const CHATS_DIR = path.join(DATA_DIR, 'chats');

function ensureDataDir(): void {
  if (USE_KV) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore on serverless
  }
}

export function ensureChatsDir(): void {
  if (USE_KV) return;
  ensureDataDir();
  try {
    if (!fs.existsSync(CHATS_DIR)) {
      fs.mkdirSync(CHATS_DIR, { recursive: true });
    }
  } catch {
    // Ignore on serverless
  }
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

export function getChatFilePath(chatId: string): string {
  return path.join(CHATS_DIR, `${chatId}.json`);
}

export function listChatFiles(): string[] {
  if (USE_KV) {
    // Sync wrapper - will be called at startup
    return [];
  }
  ensureChatsDir();
  return fs.readdirSync(CHATS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

export async function listChatFilesAsync(): Promise<string[]> {
  if (USE_KV) {
    const keys = await kv.keys('chat:*');
    return keys.map(k => k.replace('chat:', ''));
  }
  ensureChatsDir();
  return fs.readdirSync(CHATS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  if (USE_KV) return defaultValue;
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return defaultValue;
  }
}

export async function readJsonFileAsync<T>(filename: string, defaultValue: T): Promise<T> {
  if (USE_KV) {
    const data = await kv.get<T>(`file:${filename}`);
    return data ?? defaultValue;
  }
  return readJsonFile(filename, defaultValue);
}

export function writeJsonFile<T>(filename: string, data: T): void {
  if (USE_KV) {
    kv.set(`file:${filename}`, data);
    return;
  }
  ensureDataDir();
  fs.writeFileSync(getFilePath(filename), JSON.stringify(data, null, 2), 'utf8');
}

export async function writeJsonFileAsync<T>(filename: string, data: T): Promise<void> {
  if (USE_KV) {
    await kv.set(`file:${filename}`, data);
    return;
  }
  writeJsonFile(filename, data);
}

export function deleteJsonFile(filename: string): void {
  if (USE_KV) {
    kv.del(`file:${filename}`);
    return;
  }
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function jsonFileExists(filename: string): boolean {
  if (USE_KV) return false;
  return fs.existsSync(getFilePath(filename));
}

export function readChatFile<T>(chatId: string, defaultValue: T): T {
  if (USE_KV) return defaultValue;
  ensureChatsDir();
  const filePath = getChatFilePath(chatId);
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return defaultValue;
  }
}

export async function readChatFileAsync<T>(chatId: string, defaultValue: T): Promise<T> {
  if (USE_KV) {
    const data = await kv.get<T>(`chat:${chatId}`);
    return data ?? defaultValue;
  }
  return readChatFile(chatId, defaultValue);
}

export function writeChatFile<T>(chatId: string, data: T): void {
  if (USE_KV) {
    kv.set(`chat:${chatId}`, data);
    return;
  }
  ensureChatsDir();
  fs.writeFileSync(getChatFilePath(chatId), JSON.stringify(data, null, 2), 'utf8');
}

export async function writeChatFileAsync<T>(chatId: string, data: T): Promise<void> {
  if (USE_KV) {
    await kv.set(`chat:${chatId}`, data);
    return;
  }
  writeChatFile(chatId, data);
}

export function deleteChatFile(chatId: string): boolean {
  if (USE_KV) {
    kv.del(`chat:${chatId}`);
    return true;
  }
  const filePath = getChatFilePath(chatId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function chatFileExists(chatId: string): boolean {
  if (USE_KV) return false;
  return fs.existsSync(getChatFilePath(chatId));
}

export async function chatFileExistsAsync(chatId: string): Promise<boolean> {
  if (USE_KV) {
    return (await kv.exists(`chat:${chatId}`)) > 0;
  }
  return chatFileExists(chatId);
}
