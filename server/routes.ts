import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
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
      if (!apiKey) {
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
          messages: messages
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
