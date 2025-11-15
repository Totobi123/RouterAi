import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/chat-sessions", async (req, res) => {
    try {
      const sessions = await storage.listChatSessions();
      res.json(sessions);
    } catch (error) {
      console.error("List chat sessions error:", error);
      res.status(500).json({ error: "Failed to list chat sessions" });
    }
  });

  app.post("/api/chat-sessions", async (req, res) => {
    try {
      const validated = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(validated);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      console.error("Create chat session error:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  app.get("/api/chat-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Get chat session error:", error);
      res.status(500).json({ error: "Failed to get chat session" });
    }
  });

  app.delete("/api/chat-sessions/:id", async (req, res) => {
    try {
      await storage.deleteChatSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete chat session error:", error);
      res.status(500).json({ error: "Failed to delete chat session" });
    }
  });

  app.get("/api/chat-sessions/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesBySessionId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/chat-sessions/:id/messages", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }
      
      const validated = messages.map((msg) => 
        insertMessageSchema.parse({ ...msg, chatSessionId: req.params.id })
      );
      
      const createdMessages = await storage.createMessages(validated);
      res.json(createdMessages);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Create messages error:", error);
      res.status(500).json({ error: "Failed to create messages" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, messageId } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.MURF_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MURF_API_KEY not configured" });
      }

      const response = await fetch("https://api.murf.ai/v1/speech/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          voiceId: "Charles",
          modelVersion: "GEN2",
          format: "MP3",
          sampleRate: 44100,
          encodeAsBase64: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Murf API error:", response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          return res.status(response.status).json({
            error: errorData.error || errorData.message || "Failed to generate speech",
          });
        } catch {
          return res.status(response.status).json({
            error: errorText || "Failed to generate speech",
          });
        }
      }

      const data = await response.json();
      console.log("Murf API response keys:", Object.keys(data));
      
      if (!data.encodedAudio) {
        console.error("No encodedAudio in response:", data);
        return res.status(500).json({ error: "No audio data received from Murf API" });
      }
      
      if (messageId) {
        await storage.updateMessageAudio(messageId, data.encodedAudio);
      }
      
      res.json({ audioBase64: data.encodedAudio });
    } catch (error) {
      console.error("TTS API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Validate message format and roles
      const allowedRoles = ["user", "assistant", "system"];
      const isValidFormat = messages.every(
        (msg) => 
          msg && 
          typeof msg === "object" && 
          typeof msg.role === "string" && 
          allowedRoles.includes(msg.role) &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0
      );

      if (!isValidFormat) {
        return res.status(400).json({ error: "Invalid message format or role" });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey || apiKey === "your_openrouter_api_key_here") {
        return res.status(500).json({
          error: "OPENROUTER_API_KEY not found in environment variables. Please create a .env file with your API key."
        });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.REPLIT_DOMAINS || "http://localhost:5000",
          "X-Title": "AI Chat App",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant. Provide clear, accurate, and thoughtful responses."
            },
            ...messages  // This spreads the user's conversation
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ 
          error: errorData.error?.message || "Failed to get AI response" 
        });
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content;

      if (!aiMessage) {
        return res.status(500).json({ error: "No response from AI" });
      }

      res.json({ message: aiMessage });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
