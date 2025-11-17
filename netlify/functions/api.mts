import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { storage } from "../../server/storage.js";
import { insertChatSessionSchema, insertMessageSchema } from "../../shared/schema.js";
import { z } from "zod";

const app = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// API Routes
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
    
    const validated = messages.map((msg: any) => 
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
          error: "Failed to generate speech",
        });
      }
    }

    const data = await response.json();
    const audioBase64 = data.audioContent;

    if (messageId) {
      await storage.updateMessageAudio(messageId, audioBase64);
    }

    res.json({ audioBase64 });
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export const handler = serverless(app);
