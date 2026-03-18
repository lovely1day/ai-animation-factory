import { Router } from "express";
import { comfyUIService } from "../services/comfyui.service";
import { logger } from "../utils/logger";

const router: Router = Router();

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
    const { prompt, width = 1024, height = 1024, steps = 25 } = req.body;

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
      error: error.message || "Generation failed"
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
      error: error.message || "Status check failed"
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
