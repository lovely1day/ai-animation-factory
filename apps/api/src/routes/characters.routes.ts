// ============================================================
// Characters API Routes
// Base: /api/characters
// Storage: Supabase (migration 005_characters.sql)
// ============================================================

import { Router, type Request, type Response } from "express";
import {
  isValidDNA,
  buildCharacterPrompt,
  decodeDNA,
} from "@ai-animation-factory/shared";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../config/supabase";
import { comfyUIService } from "../services/comfyui.service";

const router: Router = Router();

// ─── GET /api/characters ────────────────────────────────────

router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ characters: data ?? [] });
});

// ─── GET /api/characters/:id ────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json({ character: data });
});

// ─── POST /api/characters ───────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const { name, dna, project_id } = req.body as {
    name?: string;
    dna?: string;
    project_id?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!dna || !isValidDNA(dna)) {
    res.status(400).json({ error: "invalid or missing DNA string" });
    return;
  }

  // Extract derived fields from DNA for indexing
  const decoded    = decodeDNA(dna);
  const era_code   = decoded?.segments.ERA  as string | undefined ?? null;
  const gender     = decoded?.segments.G    as string | undefined ?? null;

  const { data, error } = await supabase
    .from("characters")
    .insert({
      name: name.trim(),
      dna,
      era_code,
      gender,
      ...(project_id ? { project_id } : {}),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ character: data });
});

// ─── PATCH /api/characters/:id ──────────────────────────────

router.patch("/:id", async (req: Request, res: Response) => {
  const { name, dna, preview_url } = req.body as {
    name?: string;
    dna?: string;
    preview_url?: string;
  };

  if (dna !== undefined && !isValidDNA(dna)) {
    res.status(400).json({ error: "invalid DNA string" });
    return;
  }

  // Build update object (only include provided fields)
  const updates: Record<string, unknown> = {};
  if (name !== undefined)        updates.name        = name.trim();
  if (preview_url !== undefined) updates.preview_url = preview_url;

  if (dna !== undefined) {
    updates.dna = dna;
    const decoded      = decodeDNA(dna);
    updates.era_code   = decoded?.segments.ERA as string | undefined ?? null;
    updates.gender     = decoded?.segments.G   as string | undefined ?? null;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "no fields to update" });
    return;
  }

  const { data, error } = await supabase
    .from("characters")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: error?.message ?? "Character not found" });
    return;
  }
  res.json({ character: data });
});

// ─── DELETE /api/characters/:id ─────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

// ─── POST /api/characters/preview ───────────────────────────
// DNA → ComfyUI submission. Returns prompt_id for polling.

router.post("/preview", async (req: Request, res: Response) => {
  const { dna } = req.body as { dna?: string };

  if (!dna || !isValidDNA(dna)) {
    res.status(400).json({ error: "invalid or missing DNA string" });
    return;
  }

  try {
    const comfyOnline = await comfyUIService.healthCheck();
    if (!comfyOnline) {
      res.status(503).json({ error: "ComfyUI is offline. Start ComfyUI first." });
      return;
    }

    const { prompt, negativePrompt } = buildCharacterPrompt(dna, "facing the camera, neutral expression");

    const workflow = comfyUIService.createTextToImageWorkflow(prompt, {
      width: 768, height: 1024, steps: 20, cfg: 7,
    });
    (workflow["7"] as { inputs: Record<string, unknown> }).inputs.text = negativePrompt;

    const prompt_id = await comfyUIService.submitWorkflow(workflow);
    res.json({ success: true, prompt_id });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "generation failed" });
  }
});

// ─── GET /api/characters/preview/:promptId ──────────────────
// Poll ComfyUI for status + image URL.

router.get("/preview/:promptId", async (req: Request, res: Response) => {
  try {
    const result = await comfyUIService.checkStatus(req.params.promptId);
    res.json({
      success: true,
      status:    result.status,
      image_url: result.images?.[0] ?? null,
      error:     result.error ?? null,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "status check failed" });
  }
});

// ─── POST /api/characters/auto-dress ────────────────────────
// DNA → Claude API → era-appropriate hair suggestions.
// Returns { success, suggestions: { HS?, HL?, HC? }, reason }

function buildAutoDressPrompt(eraCode: string, gender: string): string {
  const eraName = eraCode
    .replace("ERA_", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const isFantasy =
    eraCode.startsWith("ERA_FANTASY") ||
    ["ERA_NEAR_FUTURE", "ERA_FAR_FUTURE", "ERA_SPACE_AGE"].includes(eraCode);

  const hs = [
    "HS001:Sleek Straight", "HS002:Wavy",       "HS003:Curly",        "HS004:Afro",
    "HS005:Braids",          "HS006:Mohawk",     "HS007:Shaved",       "HS008:Undercut",
    "HS009:Spiky",           "HS010:Layered",    "HS011:Bob",          "HS012:Ponytail",
    "HS013:High Ponytail",   "HS014:Curtains",   "HS015:Dreadlocks",   "HS016:Beach Waves",
    "HS017:Bald",
  ].join(", ");

  const hl = [
    "HL001:Shaved", "HL002:Buzz Cut", "HL003:Short",   "HL004:Medium",
    "HL005:Shoulder",  "HL006:Long",  "HL007:Very Long", "HL008:Waist Length",
  ].join(", ");

  const naturalColors = [
    "HC001:Jet Black",   "HC002:Black",       "HC003:Dark Espresso", "HC004:Dark Brown",
    "HC005:Brown",       "HC006:Medium Brown","HC007:Light Brown",   "HC008:Golden Brown",
    "HC009:Chestnut",    "HC010:Auburn Red",  "HC011:Copper Red",    "HC012:Dark Blonde",
    "HC013:Blonde",      "HC014:Light Blonde","HC015:Ash Blonde",    "HC016:Gray",
    "HC017:Silver Gray", "HC018:White",
  ];
  const fantasyColors = [
    ...naturalColors,
    "HC029:Ruby Red", "HC031:Pastel Pink", "HC032:Hot Pink",
    "HC033:Pastel Blue","HC034:Blue",      "HC035:Deep Blue",
    "HC036:Lavender",  "HC037:Purple",     "HC040:Emerald",
    "HC041:Teal",      "HC042:Orange",     "HC044:Vivid Red",
  ];

  const hc = (isFantasy ? fantasyColors : naturalColors).join(", ");

  return [
    `You are a historical costume expert. For a ${gender} character in the "${eraName}" era, choose the most culturally authentic and period-appropriate hair.`,
    ``,
    `Hair styles (HS): ${hs}`,
    `Hair lengths (HL): ${hl}`,
    `Hair colors (HC): ${hc}`,
    ``,
    `Rules:`,
    `- Pick what a typical middle-class person of that era and culture would have`,
    `- For ancient/medieval eras avoid modern cuts like undercut or mohawk`,
    `- Reply ONLY with valid JSON, no markdown fences:`,
    `{"HS":"HS###","HL":"HL###","HC":"HC###","reason":"<Arabic 20-25 words explaining the choice>"}`,
  ].join("\n");
}

router.post("/auto-dress", async (req: Request, res: Response) => {
  const { dna } = req.body as { dna?: string };

  if (!dna || !isValidDNA(dna)) {
    res.status(400).json({ error: "invalid or missing DNA string" });
    return;
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Claude API key not configured (CLAUDE_API_KEY)" });
    return;
  }

  const decoded = decodeDNA(dna);
  if (!decoded) {
    res.status(400).json({ error: "failed to decode DNA" });
    return;
  }

  const eraCode    = decoded.segments.ERA as string | undefined;
  const gender     = decoded.segments.G   as string | undefined;

  if (!eraCode) {
    res.status(400).json({ error: "no ERA in DNA — select an era first" });
    return;
  }

  const genderText = gender === "F" ? "female" : "male";
  const prompt     = buildAutoDressPrompt(eraCode, genderText);

  try {
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 300,
      messages:   [{ role: "user", content: prompt }],
    });

    const text      = (message.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined)?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude returned no JSON");

    const result = JSON.parse(jsonMatch[0]) as {
      HS?: string; HL?: string; HC?: string; reason?: string;
    };

    res.json({
      success: true,
      suggestions: {
        ...(result.HS ? { HS: result.HS } : {}),
        ...(result.HL ? { HL: result.HL } : {}),
        ...(result.HC ? { HC: result.HC } : {}),
      },
      reason: result.reason ?? "",
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "auto-dress failed" });
  }
});

export default router;
