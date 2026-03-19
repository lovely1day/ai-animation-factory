import { Router, Request, Response } from "express";
import { generateImagePrompts } from "../controllers/image-prompts.controller";
import { env } from "../config/env";

const router: Router = Router();

const COMFYUI_URL = env.COMFYUI_URL || "http://localhost:8188";

// توليد برومبتات صور من السكربتات
router.post("/generate", generateImagePrompts);

// Proxy: submit workflow to ComfyUI (avoids browser CORS)
router.post("/comfyui/prompt", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: check generation status
router.get("/comfyui/history/:promptId", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${COMFYUI_URL}/history/${req.params.promptId}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: view/download generated image
router.get("/comfyui/view", async (req: Request, res: Response) => {
  try {
    const params = new URLSearchParams(req.query as Record<string, string>);
    const response = await fetch(`${COMFYUI_URL}/view?${params}`);
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
