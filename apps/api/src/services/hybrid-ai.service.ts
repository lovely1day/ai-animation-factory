/**
 * Hybrid AI Service — Ollama (free) + Claude/Gemini (quality review)
 *
 * Strategy:
 *   Stage 1: Ollama (llama3/mistral) generates the content  → FREE, offline
 *   Stage 2: Claude or Gemini reviews and enhances quality → cheap (small prompts)
 *
 * Cost breakdown vs full-cloud:
 *   Full cloud (100 episodes) : ~$10-15
 *   Hybrid     (100 episodes) : ~$0.50  (review only, not generation)
 */

import axios from 'axios';
import { generateJSON, generateText, getBestProvider, trackUsage } from '../config/ai-provider';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const OLLAMA_BASE = env.OLLAMA_URL || 'http://localhost:11434';

// ── Ollama helpers ────────────────────────────────────────────────────────────

async function isOllamaRunning(): Promise<boolean> {
  try {
    await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function ollamaGenerate(prompt: string, model = 'mistral'): Promise<string> {
  const response = await axios.post(
    `${OLLAMA_BASE}/api/generate`,
    { model, prompt, stream: false },
    { timeout: 120_000 }
  );
  return response.data.response as string;
}

/** Parse JSON from Ollama output (handles markdown fences) */
function parseOllamaJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Find first { and last } to extract JSON block
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in Ollama response');

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

// ── Stage 2: Cloud reviewer ───────────────────────────────────────────────────

/**
 * Send Ollama's output to Claude/Gemini for quality enhancement.
 * Key: the review prompt is SHORT → minimal tokens → cheap.
 */
async function reviewWithCloud<T>(
  ollamaOutput: T,
  contentType: 'idea' | 'script',
  context: string
): Promise<T> {
  const reviewPrompts = {
    idea: `You are a creative director. Review this animated episode idea and enhance it.
Make the title more catchy, description more engaging, and theme more compelling.
Preserve the exact JSON structure — only improve the content quality.

Original idea:
${JSON.stringify(ollamaOutput, null, 2)}

Context: ${context}

Return the enhanced JSON only. No explanation.`,

    script: `You are a senior animation scriptwriter. Review this script and enhance quality.
Focus on: (1) richer dialogue, (2) more vivid visual_prompt details, (3) better scene flow.
Preserve exact JSON structure and scene count — only improve content.

Original script (first 2 scenes shown for context):
${JSON.stringify({ ...(ollamaOutput as any), scenes: (ollamaOutput as any).scenes?.slice(0, 2) }, null, 2)}

Full script:
${JSON.stringify(ollamaOutput, null, 2)}

Return the enhanced JSON only. No explanation.`,
  };

  try {
    const enhanced = await generateJSON<T>(reviewPrompts[contentType], {
      temperature: 0.7,
      maxTokens: contentType === 'script' ? 4096 : 1024,
    });
    logger.info({ contentType }, 'Cloud review completed');
    return enhanced;
  } catch (err) {
    // If cloud review fails → return original Ollama output (graceful degradation)
    logger.warn({ err, contentType }, 'Cloud review failed — using Ollama output as-is');
    return ollamaOutput;
  }
}

// ── Main hybrid functions ─────────────────────────────────────────────────────

export interface HybridOptions {
  /** Force a specific engine. Default: "hybrid" */
  mode?: 'hybrid' | 'ollama-only' | 'cloud-only';
  /** Ollama model to use. Default: mistral (better JSON) */
  ollamaModel?: 'mistral' | 'llama3' | 'qwen2.5:7b';
  /** Skip cloud review to save cost (use when on budget) */
  skipReview?: boolean;
}

/**
 * Generate an episode idea using hybrid pipeline.
 * Ollama generates → Cloud reviews (optional)
 */
export async function hybridGenerateIdea<T>(
  prompt: string,
  context = '',
  options: HybridOptions = {}
): Promise<{ result: T; engine: string; reviewed: boolean }> {
  const { mode = 'hybrid', ollamaModel = 'mistral', skipReview = false } = options;
  const ollamaOk = await isOllamaRunning();

  // ── Cloud-only mode (or Ollama is down) ──
  if (mode === 'cloud-only' || !ollamaOk) {
    if (!ollamaOk) logger.warn('Ollama is not running — falling back to cloud');
    const result = await generateJSON<T>(prompt);
    return { result, engine: getBestProvider(), reviewed: false };
  }

  // ── Stage 1: Ollama generation ──
  logger.info({ model: ollamaModel }, 'Hybrid Stage 1: Ollama generating idea');
  try {
    const raw = await ollamaGenerate(prompt, ollamaModel);
    const ollamaResult = parseOllamaJSON<T>(raw);
    trackUsage('ollama', true);
    logger.info('Ollama idea generation complete');

    if (mode === 'ollama-only' || skipReview) {
      return { result: ollamaResult, engine: `ollama/${ollamaModel}`, reviewed: false };
    }

    // ── Stage 2: Cloud review ──
    logger.info('Hybrid Stage 2: Cloud reviewing idea quality');
    const reviewed = await reviewWithCloud<T>(ollamaResult, 'idea', context);
    return { result: reviewed, engine: `ollama/${ollamaModel}+cloud-review`, reviewed: true };
  } catch (ollamaErr: any) {
    trackUsage('ollama', false, ollamaErr.message);
    logger.warn({ err: ollamaErr.message }, 'Ollama failed — falling back to cloud');
    const result = await generateJSON<T>(prompt);
    return { result, engine: getBestProvider(), reviewed: false };
  }
}

/**
 * Generate a full episode script using hybrid pipeline.
 * Ollama generates → Cloud reviews (optional)
 */
export async function hybridGenerateScript<T>(
  prompt: string,
  context = '',
  options: HybridOptions = {}
): Promise<{ result: T; engine: string; reviewed: boolean }> {
  const { mode = 'hybrid', ollamaModel = 'mistral', skipReview = false } = options;
  const ollamaOk = await isOllamaRunning();

  if (mode === 'cloud-only' || !ollamaOk) {
    if (!ollamaOk) logger.warn('Ollama is not running — falling back to cloud');
    const result = await generateJSON<T>(prompt);
    return { result, engine: getBestProvider(), reviewed: false };
  }

  // Stage 1: Ollama
  logger.info({ model: ollamaModel }, 'Hybrid Stage 1: Ollama generating script');
  try {
    const raw = await ollamaGenerate(prompt, ollamaModel);
    const ollamaResult = parseOllamaJSON<T>(raw);
    trackUsage('ollama', true);
    logger.info({ scenes: (ollamaResult as any).scenes?.length }, 'Ollama script generation complete');

    if (mode === 'ollama-only' || skipReview) {
      return { result: ollamaResult, engine: `ollama/${ollamaModel}`, reviewed: false };
    }

    // Stage 2: Cloud review
    logger.info('Hybrid Stage 2: Cloud reviewing script quality');
    const reviewed = await reviewWithCloud<T>(ollamaResult, 'script', context);
    return { result: reviewed, engine: `ollama/${ollamaModel}+cloud-review`, reviewed: true };
  } catch (ollamaErr: any) {
    trackUsage('ollama', false, ollamaErr.message);
    logger.warn({ err: ollamaErr.message }, 'Ollama failed — falling back to cloud');
    const result = await generateJSON<T>(prompt);
    return { result, engine: getBestProvider(), reviewed: false };
  }
}

/** Check Ollama status + available models */
export async function getOllamaStatus(): Promise<{
  running: boolean;
  models: string[];
  recommended: string;
}> {
  const running = await isOllamaRunning();
  if (!running) return { running: false, models: [], recommended: 'mistral' };

  try {
    const { data } = await axios.get(`${OLLAMA_BASE}/api/tags`);
    const models = (data.models as Array<{ name: string }> || []).map(m => m.name);
    // Prefer mistral for JSON reliability, llama3 for creativity
    const recommended = models.find(m => m.includes('mistral')) || models[0] || 'mistral';
    return { running: true, models, recommended };
  } catch {
    return { running: true, models: ['llama3', 'mistral'], recommended: 'mistral' };
  }
}
