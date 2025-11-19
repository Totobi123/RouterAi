import type { Express } from "express";
import { createServer, type Server } from "http";
import { createApiRouter } from "./api-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api", createApiRouter());

  const httpServer = createServer(app);
  return httpServer;
}
