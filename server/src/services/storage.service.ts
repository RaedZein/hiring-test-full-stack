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

// In-memory cache for KV writes (since sync reads can't access KV)
const kvCache = new Map<string, any>();

// Promise to track cache initialization
let cacheInitPromise: Promise<void> | null = null;

// Initialize cache from KV on startup
if (USE_KV) {
  cacheInitPromise = (async () => {
    try {
      // Load chats
      const keys = await kv.keys('chat:*');
      for (const key of keys) {
        const value = await kv.get(key);
        if (value) {
          kvCache.set(key, value);
        }
      }
      console.log(`[KV] Loaded ${keys.length} chats into cache`);

      // Load config
      const config = await kv.get('file:llm-config.json');
      if (config) {
        kvCache.set('file:llm-config.json', config);
        console.log('[KV] Loaded llm-config into cache');
      }
    } catch (err) {
      console.error('[KV] Failed to load cache:', err);
    }
  })();
}

/**
 * Wait for cache to be initialized (only needed when KV is enabled)
 */
export async function waitForCacheInit(): Promise<void> {
  if (cacheInitPromise) {
    await cacheInitPromise;
  }
}

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
    // Return chat IDs from cache
    return Array.from(kvCache.keys())
      .filter(k => k.startsWith('chat:'))
      .map(k => k.replace('chat:', ''));
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
  if (USE_KV) {
    const cached = kvCache.get(`chat:${chatId}`);
    return (cached as T) ?? defaultValue;
  }
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
    kvCache.set(`chat:${chatId}`, data);
    kv.set(`chat:${chatId}`, data).catch(err => console.error('KV write error:', err));
    return;
  }
  ensureChatsDir();
  fs.writeFileSync(getChatFilePath(chatId), JSON.stringify(data, null, 2), 'utf8');
}

export async function writeChatFileAndWait<T>(chatId: string, data: T): Promise<void> {
  if (USE_KV) {
    kvCache.set(`chat:${chatId}`, data);
    await kv.set(`chat:${chatId}`, data);
    return;
  }
  writeChatFile(chatId, data);
}

export async function writeChatFileAsync<T>(chatId: string, data: T): Promise<void> {
  if (USE_KV) {
    kvCache.set(`chat:${chatId}`, data);
    await kv.set(`chat:${chatId}`, data);
    return;
  }
  writeChatFile(chatId, data);
}

export function deleteChatFile(chatId: string): boolean {
  if (USE_KV) {
    kvCache.delete(`chat:${chatId}`);
    // Fire and forget async delete
    kv.del(`chat:${chatId}`).catch(err => console.error('KV delete error:', err));
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
  if (USE_KV) {
    return kvCache.has(`chat:${chatId}`);
  }
  return fs.existsSync(getChatFilePath(chatId));
}

export async function chatFileExistsAsync(chatId: string): Promise<boolean> {
  if (USE_KV) {
    return (await kv.exists(`chat:${chatId}`)) > 0;
  }
  return chatFileExists(chatId);
}
