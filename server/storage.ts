import {
  type User,
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export const storage = new MemStorage();
