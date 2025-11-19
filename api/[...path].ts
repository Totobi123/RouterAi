import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { createApiRouter } from "../server/api-routes.js";

const app = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api(?![^/])/, "") || "/";
  next();
});

app.use("/", createApiRouter());

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default serverless(app);
