import {
  type User,
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage,
  users,
  chatSessions,
  messages,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  listChatSessions(): Promise<ChatSession[]>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  deleteChatSession(id: string): Promise<void>;
  
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  createMessages(messagesList: InsertMessage[]): Promise<Message[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async listChatSessions(): Promise<ChatSession[]> {
    return db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.createdAt));
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const result = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));
    return result[0];
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await db.insert(chatSessions).values(session).returning();
    return result[0];
  }

  async deleteChatSession(id: string): Promise<void> {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.chatSessionId, sessionId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async createMessages(messagesList: InsertMessage[]): Promise<Message[]> {
    if (messagesList.length === 0) return [];
    return db.insert(messages).values(messagesList).returning();
  }
}

export const storage = new DbStorage();
