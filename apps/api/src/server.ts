import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import routes from "./routes";
import healthRoutes from "./routes/health.routes";
import { scheduler } from "./scheduler/scheduler";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: [
    "https://feelthemusic.app",
    "https://www.feelthemusic.app",
    "http://localhost:8080",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);
app.use("/api/health", healthRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "AI Animation Factory API running", version: "2.0.0" });
});

const PORT = env.API_PORT;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, "API server started");
  scheduler.start();
});
