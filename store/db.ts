import * as SQLite from 'expo-sqlite';

export type Chat = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
};

export type Message = {
  id: string;
  chat_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: number;
};

let db: SQLite.SQLiteDatabase;

export async function initDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync('vento.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function listChats(): Promise<Chat[]> {
  return db.getAllAsync<Chat>('SELECT * FROM chats ORDER BY updated_at DESC');
}

export async function createChat(id: string, title: string): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, title, now, now]
  );
}

export async function updateChatTitle(id: string, title: string): Promise<void> {
  await db.runAsync(
    'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?',
    [title, Date.now(), id]
  );
}

export async function updateChatTimestamp(id: string): Promise<void> {
  await db.runAsync(
    'UPDATE chats SET updated_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

export async function deleteChat(id: string): Promise<void> {
  await db.runAsync('DELETE FROM chats WHERE id = ?', [id]);
}

export async function listMessages(chatId: string): Promise<Message[]> {
  return db.getAllAsync<Message>(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
    [chatId]
  );
}

export async function addMessage(msg: Omit<Message, 'created_at'> & { created_at?: number }): Promise<void> {
  await db.runAsync(
    'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [msg.id, msg.chat_id, msg.role, msg.content, msg.created_at ?? Date.now()]
  );
}
