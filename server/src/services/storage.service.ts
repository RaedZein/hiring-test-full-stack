import fs from 'fs';
import path from 'path';

/**
 * Generic JSON File Storage Service
 *
 * Provides persistent storage for application data using JSON files.
 * All data is stored in the `data/` directory (gitignored).
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const CHATS_DIR = path.join(DATA_DIR, 'chats');

/**
 * Ensure the data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Ensure the chats subdirectory exists
 */
export function ensureChatsDir(): void {
  ensureDataDir();
  if (!fs.existsSync(CHATS_DIR)) {
    fs.mkdirSync(CHATS_DIR, { recursive: true });
  }
}

/**
 * Get the full path for a storage file
 */
function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

/**
 * Get the full path for a chat file
 */
export function getChatFilePath(chatId: string): string {
  return path.join(CHATS_DIR, `${chatId}.json`);
}

/**
 * List all chat files in the chats directory
 */
export function listChatFiles(): string[] {
  ensureChatsDir();
  return fs.readdirSync(CHATS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Read data from a JSON file
 * Returns the default value if file doesn't exist
 */
export function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = getFilePath(filename);

  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write data to a JSON file
 */
export function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = getFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Delete a JSON file
 */
export function deleteJsonFile(filename: string): void {
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Check if a JSON file exists
 */
export function jsonFileExists(filename: string): boolean {
  return fs.existsSync(getFilePath(filename));
}

/**
 * Read a chat file by ID
 */
export function readChatFile<T>(chatId: string, defaultValue: T): T {
  ensureChatsDir();
  const filePath = getChatFilePath(chatId);

  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write a chat file by ID
 */
export function writeChatFile<T>(chatId: string, data: T): void {
  ensureChatsDir();
  const filePath = getChatFilePath(chatId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Delete a chat file by ID
 */
export function deleteChatFile(chatId: string): boolean {
  const filePath = getChatFilePath(chatId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Check if a chat file exists
 */
export function chatFileExists(chatId: string): boolean {
  return fs.existsSync(getChatFilePath(chatId));
}
