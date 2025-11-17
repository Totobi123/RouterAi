import {
  type User,
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage,
  type Settings,
  type InsertSettings,
  users,
  chatSessions,
  messages,
  settings,
} from "@shared/schema";
import { randomUUID } from "crypto";
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
  updateMessageAudio(messageId: number, audioBase64: string): Promise<void>;
  
  getSettings(): Promise<Settings | undefined>;
  upsertSettings(settingsData: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private chatSessions = new Map<string, ChatSession>();
  private messages = new Map<number, Message>();
  private messageIdCounter = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      ...insertUser,
    };
    this.users.set(user.id, user);
    return user;
  }

  async listChatSessions(): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const chatSession: ChatSession = {
      id: randomUUID(),
      createdAt: new Date(),
      ...session,
    };
    this.chatSessions.set(chatSession.id, chatSession);
    return chatSession;
  }

  async deleteChatSession(id: string): Promise<void> {
    this.chatSessions.delete(id);
    const sessionMessages = Array.from(this.messages.entries())
      .filter(([_, msg]) => msg.chatSessionId === id);
    sessionMessages.forEach(([msgId]) => this.messages.delete(msgId));
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.chatSessionId === sessionId)
      .sort((a, b) => a.id - b.id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const msg: Message = {
      id: this.messageIdCounter++,
      ...message,
      audioBase64: message.audioBase64 ?? null,
    };
    this.messages.set(msg.id, msg);
    return msg;
  }

  async createMessages(messagesList: InsertMessage[]): Promise<Message[]> {
    if (messagesList.length === 0) return [];
    return Promise.all(messagesList.map(msg => this.createMessage(msg)));
  }

  async updateMessageAudio(messageId: number, audioBase64: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.audioBase64 = audioBase64;
      this.messages.set(messageId, message);
    }
  }

  private settings: Settings | null = null;

  async getSettings(): Promise<Settings | undefined> {
    return this.settings || undefined;
  }

  async upsertSettings(settingsData: InsertSettings): Promise<Settings> {
    if (!this.settings) {
      this.settings = {
        id: randomUUID(),
        openrouterApiKey: settingsData.openrouterApiKey || null,
        murfApiKey: settingsData.murfApiKey || null,
        updatedAt: new Date(),
      };
    } else {
      this.settings = {
        ...this.settings,
        ...settingsData,
        updatedAt: new Date(),
      };
    }
    return this.settings;
  }
}

export class DbStorage implements IStorage {
  constructor() {
    if (!db) {
      throw new Error("Database not initialized. DATABASE_URL must be set.");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(insertUser).returning();
    return user;
  }

  async listChatSessions(): Promise<ChatSession[]> {
    return db!.select().from(chatSessions).orderBy(desc(chatSessions.createdAt));
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db!.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [chatSession] = await db!.insert(chatSessions).values(session).returning();
    return chatSession;
  }

  async deleteChatSession(id: string): Promise<void> {
    await db!.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return db!.select().from(messages).where(eq(messages.chatSessionId, sessionId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db!.insert(messages).values(message).returning();
    return msg;
  }

  async createMessages(messagesList: InsertMessage[]): Promise<Message[]> {
    if (messagesList.length === 0) return [];
    return db!.insert(messages).values(messagesList).returning();
  }

  async updateMessageAudio(messageId: number, audioBase64: string): Promise<void> {
    await db!.update(messages)
      .set({ audioBase64 })
      .where(eq(messages.id, messageId));
  }

  async getSettings(): Promise<Settings | undefined> {
    const allSettings = await db!.select().from(settings);
    return allSettings[0];
  }

  async upsertSettings(settingsData: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db!.update(settings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db!.insert(settings).values(settingsData).returning();
      return created;
    }
  }
}

export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
