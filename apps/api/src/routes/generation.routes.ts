import { Router } from "express";
import { safeErrorMessage } from '../middleware/error-handler';
import { comfyUIService } from "../services/comfyui.service";
import { ideaGeneratorService } from "../services/idea-generator.service";
import { scriptWriterService } from "../services/script-writer.service";
import { listAvailableProviders, getProviderUsage, isProviderAvailable } from "../config/ai-provider";
import { getOllamaStatus } from "../services/hybrid-ai.service";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

const router: Router = Router();

/**
 * Generate an episode idea using AI — NO Redis needed
 * POST /api/generation/idea
 * Body: { genre, target_audience, theme? }
 */
router.post("/idea", async (req, res) => {
  try {
    const {
      genre = "adventure",
      target_audience = "general",
      theme,
      ollamaModel = "mistral",   // mistral | llama3 | qwen2.5:7b
      cloudProvider,             // claude | gemini | grok (overrides Ollama)
      skipReview = false,
    } = req.body;

    logger.info({ genre, target_audience, ollamaModel, cloudProvider }, "Direct idea generation requested");

    let idea: any;

    if (cloudProvider) {
      // Cloud-only mode — bypass Ollama entirely
      const { generateJSON } = await import("../config/ai-provider");
      const genreHints: Record<string, string> = {
        adventure: 'exciting quest, exploration, brave heroes',
        comedy: 'funny situations, humorous characters',
        drama: 'emotional depth, character growth',
        'sci-fi': 'futuristic technology, space, AI',
        fantasy: 'magic, mythical creatures, enchanted worlds',
        educational: 'learning, curiosity, science, history',
      };
      const prompt = `You are a creative director for an animated series. Generate an original ${genre} episode concept for ${target_audience}.${theme ? ` Theme: ${theme}.` : ''}
Genre hints: ${genreHints[genre] || genre}
Return ONLY valid JSON:
{"title":"...","description":"2-3 sentence synopsis","genre":"${genre}","target_audience":"${target_audience}","theme":"core moral lesson","tags":["t1","t2","t3","t4","t5"]}`;

      const result = await generateJSON<any>(prompt, { provider: cloudProvider as any, maxTokens: 512 });
      idea = { ...result, engine: cloudProvider, reviewed: false };
    } else {
      idea = await ideaGeneratorService.generate(
        { genre, target_audience, theme },
        ollamaModel,
        skipReview,
      );
    }

    return res.json({ success: true, data: idea });
  } catch (err: any) {
    logger.error({ error: err.message }, "Direct idea generation failed");
    return res.status(500).json({ success: false, error: safeErrorMessage(err, 'Operation failed') });
  }
});

/**
 * Generate a script directly for an episode — NO Redis needed
 * POST /api/generation/script/:episodeId
 */
router.post("/script/:episodeId", async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { scene_count = 8 } = req.body;

    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, title, description, idea, genre, target_audience, theme, tags")
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return res.status(404).json({ success: false, error: "Episode not found" });
    }

    // Update status to generating
    await supabase.from("episodes").update({
      status: "generating",
      workflow_step: "script",
      workflow_status: "processing",
      workflow_progress: 10,
      updated_at: new Date().toISOString(),
    }).eq("id", episodeId);

    // Generate script directly
    const script = await scriptWriterService.write({
      episode_id: episodeId,
      idea: {
        title: episode.title,
        description: episode.idea || episode.description || "",
        genre: episode.genre || "adventure",
        target_audience: episode.target_audience || "general",
        theme: episode.theme || episode.genre || "adventure",
        tags: episode.tags || [],
      },
      scene_count,
    });

    // Delete any existing scenes first
    await supabase.from("scenes").delete().eq("episode_id", episodeId);

    // Save scenes to DB
    for (const scene of script.scenes) {
      await supabase.from("scenes").insert({
        episode_id: episodeId,
        scene_number: scene.scene_number,
        title: scene.title,
        description: scene.description,
        visual_prompt: scene.visual_prompt,
        dialogue: scene.dialogue,
        narration: scene.narration,
        duration_seconds: scene.duration_seconds || 8,
        status: "pending",
      });
    }

    // Update episode with script data
    await supabase.from("episodes").update({
      script_data: script,
      scene_count: script.scenes.length,
      workflow_step: "script",
      workflow_status: "waiting_approval",
      workflow_progress: 25,
      updated_at: new Date().toISOString(),
    }).eq("id", episodeId);

    logger.info({ episode_id: episodeId, scenes: script.scenes.length }, "Direct script generation complete");

    return res.json({ success: true, data: script });
  } catch (err: any) {
    logger.error({ error: err.message }, "Direct script generation failed");

    // Update episode status to failed
    if (req.params.episodeId) {
      await supabase.from("episodes").update({
        status: "error",
        workflow_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", req.params.episodeId);
    }

    return res.status(500).json({ success: false, error: safeErrorMessage(err, 'Operation failed') });
  }
});

/**
 * Get AI provider status + usage counters
 * GET /api/generation/providers
 */
router.get("/providers", async (_req, res) => {
  try {
    const available = listAvailableProviders();
    const usage = getProviderUsage();
    const ollamaStatus = await getOllamaStatus();

    const providers = [
      "gemini", "openai", "claude", "grok", "kimi"
    ].map((p) => ({
      id: p,
      enabled: isProviderAvailable(p as any),
      usage: usage[p] || { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
    }));

    return res.json({
      success: true,
      data: {
        providers,
        ollama: ollamaStatus,
        best_provider: available[0]?.provider || null,
        total_calls: Object.values(usage).reduce((s, u) => s + u.calls, 0),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: safeErrorMessage(err, 'Operation failed') });
  }
});

/**
 * Test a specific provider with a simple prompt
 * POST /api/generation/test/:provider
 */
router.post("/test/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    const { generateJSON } = await import("../config/ai-provider");

    const result = await generateJSON<{ ok: boolean; message: string }>(
      `Reply with valid JSON: {"ok": true, "message": "Provider ${provider} is working"}`,
      { provider: provider as any, maxTokens: 64 }
    );

    return res.json({ success: true, provider, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, provider: req.params.provider, error: safeErrorMessage(err, 'Operation failed') });
  }
});

// Active generations store (in production use Redis)
const activeGenerations = new Map<string, {
  prompt: string;
  status: 'pending' | 'completed' | 'failed';
  images?: string[];
  error?: string;
  createdAt: Date;
}>();

/*
Health check
*/
router.get("/health", async (req, res) => {
  const comfyHealthy = await comfyUIService.healthCheck();
  res.json({
    status: comfyHealthy ? "ok" : "degraded",
    comfyui: comfyHealthy ? "connected" : "disconnected",
    service: "generation"
  });
});

/*
Generate image via ComfyUI
POST /api/generation/comfy
*/
router.post("/comfy", async (req, res) => {
  try {
    const { prompt, negative_prompt, width = 1024, height = 1024, steps = 25 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }

    // Create workflow
    const workflow = comfyUIService.createTextToImageWorkflow(prompt, {
      width,
      height,
      steps,
      negativePrompt: negative_prompt,
    });

    // Submit to ComfyUI
    const promptId = await comfyUIService.submitWorkflow(workflow);

    // Store generation info
    activeGenerations.set(promptId, {
      prompt,
      status: 'pending',
      createdAt: new Date(),
    });

    logger.info({ prompt_id: promptId, prompt: prompt.slice(0, 100) }, "Image generation started");

    return res.json({
      success: true,
      prompt_id: promptId,
      message: "Image generation started"
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Generation failed");
    return res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/*
Check generation status
GET /api/generation/status/:promptId
*/
router.get("/status/:promptId", async (req, res) => {
  try {
    const { promptId } = req.params;

    if (!promptId) {
      return res.status(400).json({
        success: false,
        error: "Prompt ID is required"
      });
    }

    // Check ComfyUI status
    const result = await comfyUIService.checkStatus(promptId);

    // Update local store
    const generation = activeGenerations.get(promptId);
    if (generation) {
      generation.status = result.status;
      if (result.images) generation.images = result.images;
      if (result.error) generation.error = result.error;
    }

    return res.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Status check failed");
    return res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/*
Get all active generations
GET /api/generation/active
*/
router.get("/active", (req, res) => {
  const generations = Array.from(activeGenerations.entries()).map(([id, data]) => ({
    prompt_id: id,
    ...data,
    createdAt: data.createdAt.toISOString(),
  }));

  res.json({
    success: true,
    count: generations.length,
    generations: generations.slice(-10) // Last 10
  });
});

export default router;
