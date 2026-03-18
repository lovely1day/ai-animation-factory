import { Router } from "express";
import { enhanceIdea, generateVariations, generateIdeas, generateScripts, regenerateScene } from "../controllers/ollama.controller";
import { isGeminiConfigured } from "../config/gemini";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const router: Router = Router();

// تحسين فكرة واحدة وإثرائها بالشخصيات والتفاصيل
router.post("/enhance-idea", enhanceIdea);

// توليد 3 تنويعات للفكرة المحسّنة
router.post("/generate-variations", generateVariations);

// توليد 10 أفكار/عناوين للقصص
router.post("/generate-ideas", generateIdeas);

// توليد السكربتات للأفكار المختارة
router.post("/generate-scripts", generateScripts);

// إعادة توليد مشهد واحد
router.post("/regenerate-scene", regenerateScene);

// حالة مزودي الذكاء الاصطناعي
router.get("/status", async (req, res) => {
  const status: Record<string, any> = {
    configured_provider: env.AI_PROVIDER || "auto",
    providers: {},
  };

  // Check Gemini
  status.providers.gemini = {
    configured: isGeminiConfigured(),
    model: env.GEMINI_MODEL || "gemini-2.5-flash",
  };

  // Check Ollama
  try {
    const ollamaUrl = env.OLLAMA_URL || "http://localhost:11434";
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json() as { models: any[] };
      status.providers.ollama = {
        running: true,
        url: ollamaUrl,
        models: (data.models || []).map((m: any) => m.name),
      };
    } else {
      status.providers.ollama = { running: false, url: ollamaUrl };
    }
  } catch {
    status.providers.ollama = {
      running: false,
      url: env.OLLAMA_URL || "http://localhost:11434",
      error: "Not reachable",
    };
  }

  // Determine active provider
  const ollamaRunning = status.providers.ollama.running;
  const geminiOk = status.providers.gemini.configured;
  const preferred = env.AI_PROVIDER;

  if (preferred === "ollama") {
    status.active_provider = ollamaRunning ? "ollama" : (geminiOk ? "gemini (fallback)" : "none");
  } else if (preferred === "gemini") {
    status.active_provider = geminiOk ? "gemini" : (ollamaRunning ? "ollama (fallback)" : "none");
  } else {
    // auto: Gemini first, Ollama fallback
    status.active_provider = geminiOk ? "gemini" : (ollamaRunning ? "ollama" : "none");
  }

  const allOk = status.active_provider !== "none";
  logger.debug({ status }, "AI provider status checked");

  return res.status(allOk ? 200 : 503).json({ success: allOk, ...status });
});

export default router;
