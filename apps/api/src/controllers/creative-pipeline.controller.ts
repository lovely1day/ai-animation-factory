/**
 * Creative Pipeline Controller
 * Staged Persona Pipeline — كل مرحلة خبير مختلف
 *
 * Stage 1 — Story Architect     → Claude
 * Stage 2 — Screenplay Writer   → Claude / GPT-4o
 * Stage 3 — Visual Director     → Claude / Gemini
 * Stage 4 — Executive Review    → Claude
 *
 * Failover: Claude → GPT-4o → Gemini → Ollama (local, always available)
 *
 * Prompts live in @ai-animation-factory/prompts — shared across all JL projects.
 */

import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  storyArchitectPrompt,
  screenplayWriterPrompt,
  visualDirectorPrompt,
  executiveReviewPrompt,
  buildCompressionPrompt,
  manualCompress,
  extractJSON,
} from '@ai-animation-factory/prompts';

// ─── Clients ──────────────────────────────────────────────────────────────────

const claude = env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: env.CLAUDE_API_KEY })
  : null;

const OLLAMA_URL   = env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = env.OLLAMA_MODEL || 'qwen2.5:7b';

// ─── Provider Layer ────────────────────────────────────────────────────────────

async function callClaude(prompt: string, maxTokens = 4096): Promise<string> {
  if (!claude) throw new Error('Claude not configured');

  // Prompt Caching: long prompts (>1024 tokens ≈ 4000 chars) are cached as system
  // Cache hits on retries/regenerations within 5 minutes → 90% cost reduction
  const useCache = prompt.length > 4000;

  const res = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    ...(useCache
      ? {
          system: [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' },
            },
          ] as any,
          messages: [{ role: 'user', content: 'Generate the response now.' }],
        }
      : {
          messages: [{ role: 'user', content: prompt }],
        }),
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text : '';
}

async function callOpenAI(prompt: string, maxTokens = 4096): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json() as any;
  return data.choices[0]?.message?.content || '';
}

async function callGemini(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini not configured');
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json() as any;
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

async function callOllama(prompt: string, model = OLLAMA_MODEL): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.9, num_predict: 4096 } }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { response: string };
  return data.response;
}

/** Failover chain: Claude → OpenAI → Gemini → Ollama */
async function callWithFallback(
  prompt: string,
  preferredProvider?: string
): Promise<{ text: string; provider: string }> {
  const chain: Array<{ name: string; fn: () => Promise<string> }> = [
    { name: 'claude', fn: () => callClaude(prompt) },
    { name: 'openai', fn: () => callOpenAI(prompt) },
    { name: 'gemini', fn: () => callGemini(prompt) },
    { name: 'ollama', fn: () => callOllama(prompt) },
  ];

  if (preferredProvider) {
    const idx = chain.findIndex(c => c.name === preferredProvider);
    if (idx > 0) {
      const [preferred] = chain.splice(idx, 1);
      chain.unshift(preferred);
    }
  }

  for (const { name, fn } of chain) {
    try {
      const text = await fn();
      logger.info({ provider: name }, 'creative-pipeline provider succeeded');
      return { text, provider: name };
    } catch (err: any) {
      logger.warn({ provider: name, error: err.message }, 'creative-pipeline provider failed, trying next');
    }
  }
  throw new Error('All AI providers failed');
}

// ─── Prompt Compression ────────────────────────────────────────────────────────

async function compressForNextStage(data: unknown, stageLabel: string): Promise<string> {
  const prompt = buildCompressionPrompt(data, stageLabel);
  try {
    const { text } = await callWithFallback(prompt, 'claude');
    return text.trim();
  } catch {
    return manualCompress(data);
  }
}

// ─── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/creative/stage/story
 */
export async function runStoryArchitect(req: Request, res: Response) {
  try {
    const { idea, genre = 'مغامرة', tone = 'درامي', provider } = req.body;
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const prompt = storyArchitectPrompt(idea, genre, tone);
    const { text, provider: usedProvider } = await callWithFallback(prompt, provider);

    const result = extractJSON(text) ?? { raw: text };

    logger.info({ provider: usedProvider, title: (result as any)?.title }, 'Stage 1 complete');
    return res.json({ success: true, stage: 'story_architect', provider: usedProvider, data: result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Stage 1 failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/creative/stage/screenplay
 */
export async function runScreenplayWriter(req: Request, res: Response) {
  try {
    const { story, sceneCount = 6, provider } = req.body;
    if (!story) return res.status(400).json({ error: 'story is required' });

    const prompt = screenplayWriterPrompt(story, sceneCount);
    const { text, provider: usedProvider } = await callWithFallback(prompt, provider);

    const result = extractJSON(text) ?? { raw: text };

    logger.info({ provider: usedProvider, scenes: (result as any)?.scenes?.length }, 'Stage 2 complete');
    return res.json({ success: true, stage: 'screenplay_writer', provider: usedProvider, data: result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Stage 2 failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/creative/stage/visuals
 */
export async function runVisualDirector(req: Request, res: Response) {
  try {
    const { screenplay, provider } = req.body;
    if (!screenplay) return res.status(400).json({ error: 'screenplay is required' });

    const prompt = visualDirectorPrompt(screenplay);
    const { text, provider: usedProvider } = await callWithFallback(prompt, provider || 'gemini');

    const result = extractJSON(text) ?? { raw: text };

    logger.info({ provider: usedProvider, scenes: (result as any)?.scenes?.length }, 'Stage 3 complete');
    return res.json({ success: true, stage: 'visual_director', provider: usedProvider, data: result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Stage 3 failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/creative/stage/review
 */
export async function runExecutiveReview(req: Request, res: Response) {
  try {
    const { story, screenplay, visuals } = req.body;
    if (!story || !screenplay) return res.status(400).json({ error: 'story and screenplay are required' });

    const prompt = executiveReviewPrompt(story, screenplay, visuals || {});
    const { text, provider: usedProvider } = await callWithFallback(prompt, 'claude');

    const result = extractJSON(text) ?? { raw: text };

    logger.info({ provider: usedProvider, verdict: (result as any)?.verdict }, 'Stage 4 complete');
    return res.json({ success: true, stage: 'executive_review', provider: usedProvider, data: result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Stage 4 failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/creative/full-pipeline
 * Run all 4 stages in sequence with compression between each.
 */
export async function runFullPipeline(req: Request, res: Response) {
  try {
    const { idea, genre = 'مغامرة', tone = 'درامي', sceneCount = 6, provider } = req.body;
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    logger.info({ idea: idea.slice(0, 80), genre, tone }, 'Full pipeline started');

    // ── Stage 1: Story Architect ──────────────────────────────────────────────
    const { text: storyText, provider: storyProvider } =
      await callWithFallback(storyArchitectPrompt(idea, genre, tone), provider || 'claude');
    const story = extractJSON(storyText) ?? { title: idea, concept: idea };
    logger.info({ provider: storyProvider, title: (story as any)?.title }, 'Stage 1 done');

    // ── Compress → Stage 2 ────────────────────────────────────────────────────
    const storyCompressed = await compressForNextStage(story, 'Story Architect');

    // ── Stage 2: Screenplay Writer ────────────────────────────────────────────
    const { text: screenplayText, provider: screenplayProvider } =
      await callWithFallback(screenplayWriterPrompt(storyCompressed, sceneCount), provider || 'claude');
    const screenplay = extractJSON(screenplayText) ?? { scenes: [] };
    logger.info({ provider: screenplayProvider, scenes: (screenplay as any)?.scenes?.length }, 'Stage 2 done');

    // ── Compress → Stage 3 ────────────────────────────────────────────────────
    const screenplayCompressed = await compressForNextStage(screenplay, 'Screenplay Writer');

    // ── Stage 3: Visual Director ──────────────────────────────────────────────
    const { text: visualText, provider: visualProvider } =
      await callWithFallback(visualDirectorPrompt(screenplayCompressed), 'gemini');
    const visuals = extractJSON(visualText) ?? { scenes: [] };
    logger.info({ provider: visualProvider, scenes: (visuals as any)?.scenes?.length }, 'Stage 3 done');

    // ── Compress all 3 → Stage 4 ──────────────────────────────────────────────
    const [reviewStoryIn, reviewScrIn, reviewVisIn] = await Promise.all([
      compressForNextStage(story,      'Story (for review)'),
      compressForNextStage(screenplay, 'Screenplay (for review)'),
      compressForNextStage(visuals,    'Visuals (for review)'),
    ]);

    // ── Stage 4: Executive Review ─────────────────────────────────────────────
    const { text: reviewText, provider: reviewProvider } =
      await callWithFallback(executiveReviewPrompt(reviewStoryIn, reviewScrIn, reviewVisIn), 'claude');
    const review = extractJSON(reviewText) ?? { verdict: 'REVISE' };

    logger.info({ storyProvider, screenplayProvider, visualProvider, reviewProvider, verdict: (review as any)?.verdict }, 'Full pipeline complete');

    return res.json({
      success: true,
      providers: { story: storyProvider, screenplay: screenplayProvider, visuals: visualProvider, review: reviewProvider },
      data: { story, screenplay, visuals, review },
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Full pipeline failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/creative/providers
 */
export async function getCreativeProviders(_req: Request, res: Response) {
  const providers = {
    claude: { available: !!env.CLAUDE_API_KEY, role: 'Story Architect + Executive Review' },
    openai: { available: !!env.OPENAI_API_KEY, role: 'Screenplay & Dialogue' },
    gemini: { available: !!env.GEMINI_API_KEY, role: 'Visual Direction' },
    ollama: { available: false,                role: 'Fallback — always local' },
  };

  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) providers.ollama.available = true;
  } catch { /* offline */ }

  return res.json({ success: true, providers });
}
