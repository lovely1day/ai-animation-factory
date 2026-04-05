// ============================================================
// SECURITY RULES — DO NOT BYPASS:
// - CORS: production origins only (no wildcards, no open cors())
// - CSP: enabled in production via Helmet
// - Error handler: MUST be last middleware (catches all errors)
// - localhost origins: development only
// See: JL-PROJECT-STANDARDS.md
// ============================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import routes from "./routes";
import healthRoutes from "./routes/health.routes";
import { scheduler } from "./scheduler/scheduler";
import { logger } from "./utils/logger";
import { errorHandler, notFound } from "./middleware/error-handler";

const app = express();

const isProduction = env.NODE_ENV === "production";

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.feelthemusic.app"],
    }
  } : false,
}));

const allowedOrigins = [
  "https://feelthemusic.app",
  "https://www.feelthemusic.app",
  "https://ai-animation-factory-web.vercel.app",
  ...(isProduction ? [] : ["http://localhost:8080", "http://localhost:3000"]),
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);
app.use("/api/health", healthRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "AI Animation Factory API running", version: "2.0.0" });
});

// Error handling — MUST be after all routes
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? String(env.API_PORT), 10);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, "API server started");
  scheduler.start();

  // Start BullMQ workers for production pipeline
  import('./workers/index').then(({ startAllWorkers }) => {
    startAllWorkers();
    logger.info("Production workers started (voice, music, animation, assembly, subtitle)");
  }).catch((err) => {
    logger.warn({ error: (err as Error).message }, "Workers not started — Redis may be unavailable");
  });
});
