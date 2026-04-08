/**
 * Idea Routes — Unified creative pipeline
 *
 * POST /api/idea/quick       → Fast idea generation (hybrid prompt)
 * POST /api/idea/story       → Story Architect (deep — personas.ts)
 * POST /api/idea/screenplay  → Story → Screenplay with scenes
 * POST /api/idea/visuals     → Visual direction for scenes
 * POST /api/idea/review      → Executive review (approve/revise)
 * POST /api/idea/full        → All 4 stages sequentially
 * GET  /api/idea/providers   → Provider status + Ollama info
 */

import { Router, Request, Response } from 'express';
import {
  storyArchitectPrompt,
  screenplayWriterPrompt,
  visualDirectorPrompt,
  executiveReviewPrompt,
  buildCompressionPrompt,
  manualCompress,
} from '@ai-animation-factory/prompts';
import {
  engineGenerateJSON,
  engineGenerateText,
  engineCouncilGenerate,
  getOllamaStatus,
  type EngineOptions,
} from '../services/ai-engine.service';
import { listAvailableProviders, getProviderUsage, isProviderAvailable } from '../config/ai-provider';
import { safeErrorMessage } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router: Router = Router();

// ── Validation ──────────────────────────────────────────────────────────────

const VALID_GENRES = ['adventure', 'comedy', 'drama', 'sci-fi', 'fantasy', 'horror', 'romance', 'thriller', 'educational', 'mystery'] as const;
const VALID_AUDIENCES = ['children', 'teens', 'adults', 'general'] as const;
const MAX_TEXT_LENGTH = 2000;

type Genre = typeof VALID_GENRES[number];
type Audience = typeof VALID_AUDIENCES[number];

function validateGenre(v: unknown): v is Genre {
  return typeof v === 'string' && VALID_GENRES.includes(v as Genre);
}
function validateAudience(v: unknown): v is Audience {
  return typeof v === 'string' && VALID_AUDIENCES.includes(v as Audience);
}
function clampText(v: unknown, max = MAX_TEXT_LENGTH): string {
  return typeof v === 'string' ? v.slice(0, max).trim() : '';
}

function parseEngineOptions(body: Record<string, unknown>): EngineOptions {
  return {
    mode: (['cloud', 'ollama', 'hybrid'].includes(body.mode as string) ? body.mode : 'hybrid') as EngineOptions['mode'],
    provider: (body.provider as EngineOptions['provider']) || 'auto',
    ollamaModel: (['mistral', 'llama3', 'qwen2.5:7b'].includes(body.ollamaModel as string) ? body.ollamaModel : 'mistral') as EngineOptions['ollamaModel'],
    skipReview: body.skipReview === true,
    temperature: typeof body.temperature === 'number' ? Math.min(Math.max(body.temperature, 0), 2) : 0.9,
    maxTokens: typeof body.maxTokens === 'number' ? Math.min(body.maxTokens, 16384) : 4096,
  };
}

// ── Genre/Audience hint maps ────────────────────────────────────────────────

const GENRE_HINTS: Record<string, string> = {
  adventure: 'exciting quest, exploration, discovery, brave heroes',
  comedy: 'funny situations, humorous characters, lighthearted mishaps',
  drama: 'emotional depth, character growth, meaningful relationships',
  'sci-fi': 'futuristic technology, space, AI, scientific concepts',
  fantasy: 'magic, mythical creatures, enchanted worlds',
  horror: 'suspense, mystery, eerie atmosphere (age-appropriate)',
  romance: 'heartwarming connections, love stories',
  thriller: 'suspense, plot twists, mystery solving',
  educational: 'learning, curiosity, science, history, culture',
  mystery: 'puzzles, clues, detective work, problem solving',
};

const AUDIENCE_HINTS: Record<string, string> = {
  children: 'simple vocabulary, positive messages, colorful, fun characters (ages 4-10)',
  teens: 'relatable situations, identity, friendship, adventure (ages 11-17)',
  adults: 'complex themes, mature storytelling, sophisticated humor',
  general: 'universally appealing, family-friendly',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function compressForNextStage(
  data: unknown,
  stageLabel: string,
  provider?: EngineOptions['provider'],
): Promise<string> {
  const prompt = buildCompressionPrompt(data, stageLabel);
  try {
    const { text } = await engineGenerateText(prompt, { provider });
    return text.trim();
  } catch {
    return manualCompress(data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/idea/quick
 * Fast idea generation — simple prompt, good for exploration.
 *
 * Body: { genre, target_audience, theme?, ...engineOptions }
 */
router.post('/quick', async (req: Request, res: Response) => {
  try {
    const genre = validateGenre(req.body.genre) ? req.body.genre : 'adventure';
    const audience = validateAudience(req.body.target_audience) ? req.body.target_audience : 'general';
    const theme = clampText(req.body.theme, 500);
    const engineOpts = parseEngineOptions(req.body);

    const genreHint = GENRE_HINTS[genre] || genre;
    const audienceHint = AUDIENCE_HINTS[audience] || audience;

    const prompt = `You are a creative director for an animated series. Generate an original episode concept.

Genre: ${genre} (${genreHint})
Target Audience: ${audience} (${audienceHint})
${theme ? `Theme: ${theme}` : ''}

Create a compelling, unique episode idea. Return ONLY a JSON object:
{
  "title": "Episode title (5-10 words, catchy and memorable)",
  "description": "2-3 sentence synopsis that hooks the viewer",
  "genre": "${genre}",
  "target_audience": "${audience}",
  "theme": "Core theme or moral lesson",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Be creative, original, avoid clichés. Return valid JSON only.`;

    const result = await engineGenerateJSON<{
      title: string;
      description: string;
      genre: string;
      target_audience: string;
      theme: string;
      tags: string[];
    }>(prompt, engineOpts);

    logger.info({ engine: result.engine, title: result.data.title }, 'idea/quick complete');
    return res.json({ success: true, stage: 'quick', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/quick failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Idea generation failed') });
  }
});

/**
 * POST /api/idea/story
 * Story Architect — deep story development using personas.ts criteria.
 *
 * Body: { idea, genre?, tone?, ...engineOptions }
 */
router.post('/story', async (req: Request, res: Response) => {
  try {
    const idea = clampText(req.body.idea);
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const genre = clampText(req.body.genre, 100) || 'مغامرة';
    const tone = clampText(req.body.tone, 100) || 'درامي';
    const engineOpts = parseEngineOptions(req.body);

    const prompt = storyArchitectPrompt(idea, genre, tone);
    const result = await engineGenerateJSON<{
      title: string;
      world: string;
      protagonist: { name: string; desire: string; flaw: string };
      antagonist: { name: string; logic: string };
      conflict: string;
      theme: string;
      characters: Array<{ name: string; role: string; contradiction: string }>;
      concept: string;
    }>(prompt, { ...engineOpts, maxTokens: engineOpts.maxTokens || 4096 });

    logger.info({ engine: result.engine, title: result.data.title }, 'idea/story complete');
    return res.json({ success: true, stage: 'story_architect', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/story failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Story generation failed') });
  }
});

/**
 * POST /api/idea/screenplay
 * Screenplay Writer — converts story into scenes with dialogue.
 *
 * Body: { story, sceneCount?, ...engineOptions }
 */
router.post('/screenplay', async (req: Request, res: Response) => {
  try {
    const { story, sceneCount = 6 } = req.body;
    if (!story) return res.status(400).json({ error: 'story is required' });

    const count = Math.min(Math.max(Number(sceneCount) || 8, 2), 30);
    const engineOpts = parseEngineOptions(req.body);

    const prompt = screenplayWriterPrompt(story, count);
    const result = await engineGenerateJSON<{
      logline: string;
      scenes: Array<{
        sceneNumber: number;
        location: string;
        timeOfDay: string;
        action: string;
        dialogue: string;
        subtext: string;
        imagePrompt: string;
      }>;
    }>(prompt, { ...engineOpts, maxTokens: Math.max(engineOpts.maxTokens || 0, 16384) });

    logger.info({ engine: result.engine, scenes: result.data.scenes?.length }, 'idea/screenplay complete');
    return res.json({ success: true, stage: 'screenplay_writer', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/screenplay failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Screenplay generation failed') });
  }
});

/**
 * POST /api/idea/visuals
 * Visual Director — enhances scenes with camera, lighting, color.
 *
 * Body: { screenplay, ...engineOptions }
 */
router.post('/visuals', async (req: Request, res: Response) => {
  try {
    const { screenplay } = req.body;
    if (!screenplay) return res.status(400).json({ error: 'screenplay is required' });

    const engineOpts = parseEngineOptions(req.body);

    const prompt = visualDirectorPrompt(screenplay);
    const result = await engineGenerateJSON<{
      scenes: Array<{
        sceneNumber: number;
        shotType: string;
        cameraMovement: string;
        lighting: string;
        colorPalette: string[];
        mood: string;
        enhancedImagePrompt: string;
      }>;
    }>(prompt, { ...engineOpts, provider: engineOpts.provider || 'auto' });

    logger.info({ engine: result.engine, scenes: result.data.scenes?.length }, 'idea/visuals complete');
    return res.json({ success: true, stage: 'visual_director', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/visuals failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Visual direction failed') });
  }
});

/**
 * POST /api/idea/review
 * Executive Review — quality gate with verdict.
 *
 * Body: { story, screenplay, visuals?, ...engineOptions }
 */
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { story, screenplay, visuals } = req.body;
    if (!story || !screenplay) return res.status(400).json({ error: 'story and screenplay are required' });

    const engineOpts = parseEngineOptions(req.body);

    const prompt = executiveReviewPrompt(story, screenplay, visuals || {});
    const result = await engineGenerateJSON<{
      verdict: 'GREENLIGHT' | 'PASS' | 'REVISE';
      scores: { story: number; dialogue: number; visuals: number; overall: number };
      strengths: string[];
      fatalFlaws: string[];
      fixes: string[];
      marketNote: string;
      execSummary: string;
    }>(prompt, { ...engineOpts, provider: engineOpts.provider || 'auto' });

    logger.info({ engine: result.engine, verdict: result.data.verdict }, 'idea/review complete');
    return res.json({ success: true, stage: 'executive_review', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/review failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Review failed') });
  }
});

/**
 * POST /api/idea/full
 * Full pipeline — all 4 stages with compression between each.
 *
 * Body: { idea, genre?, tone?, sceneCount?, ...engineOptions }
 */
router.post('/full', async (req: Request, res: Response) => {
  try {
    const idea = clampText(req.body.idea);
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const genre = clampText(req.body.genre, 100) || 'مغامرة';
    const tone = clampText(req.body.tone, 100) || 'درامي';
    const sceneCount = Math.min(Math.max(Number(req.body.sceneCount) || 10, 2), 16);
    const engineOpts = parseEngineOptions(req.body);

    const stages: Record<string, { engine: string; durationMs: number }> = {};
    const start = Date.now();

    logger.info({ idea: idea.slice(0, 80), genre, tone }, 'Full pipeline started');

    // ── Stage 1: Story Architect ─────────────────────────────────────────
    const storyResult = await engineGenerateJSON<Record<string, unknown>>(
      storyArchitectPrompt(idea, genre, tone),
      engineOpts,
    );
    stages.story = { engine: storyResult.engine, durationMs: storyResult.durationMs };
    logger.info({ engine: storyResult.engine, title: (storyResult.data as any)?.title }, 'Stage 1 done');

    // ── Compress → Stage 2 ───────────────────────────────────────────────
    const storyCompressed = await compressForNextStage(storyResult.data, 'Story Architect', engineOpts.provider);

    // ── Stage 2: Screenplay Writer ───────────────────────────────────────
    const screenplayResult = await engineGenerateJSON<Record<string, unknown>>(
      screenplayWriterPrompt(storyCompressed, sceneCount),
      engineOpts,
    );
    stages.screenplay = { engine: screenplayResult.engine, durationMs: screenplayResult.durationMs };
    logger.info({ engine: screenplayResult.engine, scenes: (screenplayResult.data as any)?.scenes?.length }, 'Stage 2 done');

    // ── Compress → Stage 3 ───────────────────────────────────────────────
    const screenplayCompressed = await compressForNextStage(screenplayResult.data, 'Screenplay Writer', engineOpts.provider);

    // ── Stage 3: Visual Director ─────────────────────────────────────────
    const visualsResult = await engineGenerateJSON<Record<string, unknown>>(
      visualDirectorPrompt(screenplayCompressed),
      engineOpts,
    );
    stages.visuals = { engine: visualsResult.engine, durationMs: visualsResult.durationMs };
    logger.info({ engine: visualsResult.engine, scenes: (visualsResult.data as any)?.scenes?.length }, 'Stage 3 done');

    // ── Compress all 3 → Stage 4 ─────────────────────────────────────────
    const [reviewStory, reviewScreenplay, reviewVisuals] = await Promise.all([
      compressForNextStage(storyResult.data, 'Story (for review)', engineOpts.provider),
      compressForNextStage(screenplayResult.data, 'Screenplay (for review)', engineOpts.provider),
      compressForNextStage(visualsResult.data, 'Visuals (for review)', engineOpts.provider),
    ]);

    // ── Stage 4: Executive Review ────────────────────────────────────────
    const reviewResult = await engineGenerateJSON<Record<string, unknown>>(
      executiveReviewPrompt(reviewStory, reviewScreenplay, reviewVisuals),
      engineOpts,
    );
    stages.review = { engine: reviewResult.engine, durationMs: reviewResult.durationMs };
    logger.info({ engine: reviewResult.engine, verdict: (reviewResult.data as any)?.verdict }, 'Stage 4 done');

    const totalMs = Date.now() - start;
    logger.info({ totalMs, stages }, 'Full pipeline complete');

    return res.json({
      success: true,
      stage: 'full_pipeline',
      totalDurationMs: totalMs,
      stages,
      data: {
        story: storyResult.data,
        screenplay: screenplayResult.data,
        visuals: visualsResult.data,
        review: reviewResult.data,
      },
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Full pipeline failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Pipeline failed') });
  }
});

/**
 * GET /api/idea/providers
 * Provider status + Ollama info + usage stats.
 */
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const available = listAvailableProviders();
    const usage = getProviderUsage();
    const ollamaStatus = await getOllamaStatus();

    const providers = ['gemini', 'openai', 'claude', 'grok'].map(p => ({
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
    return res.status(500).json({ error: safeErrorMessage(err, 'Failed to get providers') });
  }
});

/**
 * POST /api/idea/council
 * Creative Council — all providers generate in parallel, Claude judges.
 * Ollama + Grok + Gemini + OpenAI compete → Claude merges the best.
 *
 * Body: { genre, target_audience, theme?, ...engineOptions }
 */
router.post('/council', async (req: Request, res: Response) => {
  try {
    const genre = validateGenre(req.body.genre) ? req.body.genre : 'adventure';
    const audience = validateAudience(req.body.target_audience) ? req.body.target_audience : 'general';
    const theme = clampText(req.body.theme, 500);
    const engineOpts = parseEngineOptions(req.body);

    const genreHint = GENRE_HINTS[genre] || genre;
    const audienceHint = AUDIENCE_HINTS[audience] || audience;

    const prompt = `You are a creative director for an animated series. Generate an original episode concept.

Genre: ${genre} (${genreHint})
Target Audience: ${audience} (${audienceHint})
${theme ? `Theme: ${theme}` : ''}

Create a compelling, unique episode idea. Return ONLY a JSON object:
{
  "title": "Episode title (5-10 words, catchy and memorable)",
  "description": "2-3 sentence synopsis that hooks the viewer",
  "genre": "${genre}",
  "target_audience": "${audience}",
  "theme": "Core theme or moral lesson",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Be creative, original, avoid clichés. Return valid JSON only.`;

    const result = await engineCouncilGenerate<{
      title: string;
      description: string;
      genre: string;
      target_audience: string;
      theme: string;
      tags: string[];
    }>(prompt, engineOpts);

    logger.info({
      members: result.council.members.map(m => m.provider),
      judge: result.council.judge,
      totalMs: result.durationMs,
    }, 'idea/council complete');

    return res.json({ success: true, stage: 'council', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/council failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Council generation failed') });
  }
});

/**
 * POST /api/idea/council/story
 * Creative Council for Story Architect — deep story by committee.
 *
 * Body: { idea, genre?, tone?, ...engineOptions }
 */
router.post('/council/story', async (req: Request, res: Response) => {
  try {
    const idea = clampText(req.body.idea);
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const genre = clampText(req.body.genre, 100) || 'مغامرة';
    const tone = clampText(req.body.tone, 100) || 'درامي';
    const engineOpts = parseEngineOptions(req.body);

    const prompt = storyArchitectPrompt(idea, genre, tone);
    const result = await engineCouncilGenerate<{
      title: string;
      world: string;
      protagonist: { name: string; desire: string; flaw: string };
      antagonist: { name: string; logic: string };
      conflict: string;
      theme: string;
      characters: Array<{ name: string; role: string; contradiction: string }>;
      concept: string;
    }>(prompt, { ...engineOpts, maxTokens: engineOpts.maxTokens || 4096 });

    logger.info({
      members: result.council.members.map(m => m.provider),
      judge: result.council.judge,
      title: result.data.title,
    }, 'idea/council/story complete');

    return res.json({ success: true, stage: 'council_story', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/council/story failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Council story failed') });
  }
});

/**
 * POST /api/idea/council/screenplay
 * Creative Council for Screenplay — all writers compete, Claude merges.
 *
 * Body: { story, sceneCount?, ...engineOptions }
 */
router.post('/council/screenplay', async (req: Request, res: Response) => {
  try {
    const { story, sceneCount = 6 } = req.body;
    if (!story) return res.status(400).json({ error: 'story is required' });

    const count = Math.min(Math.max(Number(sceneCount) || 8, 2), 30);
    const engineOpts = parseEngineOptions(req.body);

    const prompt = screenplayWriterPrompt(story, count);
    const result = await engineCouncilGenerate<{
      logline: string;
      scenes: Array<{
        sceneNumber: number;
        location: string;
        timeOfDay: string;
        action: string;
        dialogue: string;
        subtext: string;
        imagePrompt: string;
      }>;
    }>(prompt, { ...engineOpts, maxTokens: Math.max(engineOpts.maxTokens || 0, 16384) });

    logger.info({
      members: result.council.members.map(m => m.provider),
      judge: result.council.judge,
      scenes: result.data.scenes?.length,
    }, 'idea/council/screenplay complete');

    return res.json({ success: true, stage: 'council_screenplay', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/council/screenplay failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Council screenplay failed') });
  }
});

/**
 * POST /api/idea/council/visuals
 * Creative Council for Visual Direction — all directors compete, Claude merges.
 *
 * Body: { screenplay, ...engineOptions }
 */
router.post('/council/visuals', async (req: Request, res: Response) => {
  try {
    const { screenplay } = req.body;
    if (!screenplay) return res.status(400).json({ error: 'screenplay is required' });

    const engineOpts = parseEngineOptions(req.body);

    const prompt = visualDirectorPrompt(screenplay);
    const result = await engineCouncilGenerate<{
      scenes: Array<{
        sceneNumber: number;
        shotType: string;
        cameraMovement: string;
        lighting: string;
        colorPalette: string[];
        mood: string;
        enhancedImagePrompt: string;
      }>;
    }>(prompt, engineOpts);

    logger.info({
      members: result.council.members.map(m => m.provider),
      judge: result.council.judge,
      scenes: result.data.scenes?.length,
    }, 'idea/council/visuals complete');

    return res.json({ success: true, stage: 'council_visuals', ...result });
  } catch (err: any) {
    logger.error({ error: err.message }, 'idea/council/visuals failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Council visuals failed') });
  }
});

/**
 * POST /api/idea/council/full
 * Full Creative Council Pipeline — every stage uses council mode.
 * All providers compete at each stage → Claude judges → next stage.
 *
 * Body: { idea, genre?, tone?, sceneCount?, ...engineOptions }
 */
router.post('/council/full', async (req: Request, res: Response) => {
  try {
    const idea = clampText(req.body.idea);
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const genre = clampText(req.body.genre, 100) || 'مغامرة';
    const tone = clampText(req.body.tone, 100) || 'درامي';
    const sceneCount = Math.min(Math.max(Number(req.body.sceneCount) || 8, 2), 16);
    const engineOpts = parseEngineOptions(req.body);

    const stages: Record<string, { members: string[]; judge: string; durationMs: number }> = {};
    const start = Date.now();

    logger.info({ idea: idea.slice(0, 80), genre, tone }, 'Council Full Pipeline started');

    // ── Stage 1: Story Architect (Council) ───────────────────────────────
    const storyResult = await engineCouncilGenerate<Record<string, unknown>>(
      storyArchitectPrompt(idea, genre, tone),
      engineOpts,
    );
    stages.story = {
      members: storyResult.council.members.map(m => m.provider),
      judge: storyResult.council.judge,
      durationMs: storyResult.durationMs,
    };
    logger.info({ members: stages.story.members, title: (storyResult.data as any)?.title }, 'Council Stage 1 done');

    // ── Compress → Stage 2 ───────────────────────────────────────────────
    const storyCompressed = await compressForNextStage(storyResult.data, 'Story Architect', engineOpts.provider);

    // ── Stage 2: Screenplay Writer (Council) ─────────────────────────────
    const screenplayResult = await engineCouncilGenerate<Record<string, unknown>>(
      screenplayWriterPrompt(storyCompressed, sceneCount),
      { ...engineOpts, maxTokens: Math.max(engineOpts.maxTokens || 0, 16384) },
    );
    stages.screenplay = {
      members: screenplayResult.council.members.map(m => m.provider),
      judge: screenplayResult.council.judge,
      durationMs: screenplayResult.durationMs,
    };
    logger.info({ members: stages.screenplay.members, scenes: (screenplayResult.data as any)?.scenes?.length }, 'Council Stage 2 done');

    // ── Compress → Stage 3 ───────────────────────────────────────────────
    const screenplayCompressed = await compressForNextStage(screenplayResult.data, 'Screenplay Writer', engineOpts.provider);

    // ── Stage 3: Visual Director (Council) ───────────────────────────────
    const visualsResult = await engineCouncilGenerate<Record<string, unknown>>(
      visualDirectorPrompt(screenplayCompressed),
      engineOpts,
    );
    stages.visuals = {
      members: visualsResult.council.members.map(m => m.provider),
      judge: visualsResult.council.judge,
      durationMs: visualsResult.durationMs,
    };
    logger.info({ members: stages.visuals.members, scenes: (visualsResult.data as any)?.scenes?.length }, 'Council Stage 3 done');

    // ── Stage 4: Executive Review (single — Claude judges the council's work) ──
    const [reviewStory, reviewScreenplay, reviewVisuals] = await Promise.all([
      compressForNextStage(storyResult.data, 'Story (for review)', engineOpts.provider),
      compressForNextStage(screenplayResult.data, 'Screenplay (for review)', engineOpts.provider),
      compressForNextStage(visualsResult.data, 'Visuals (for review)', engineOpts.provider),
    ]);

    const reviewResult = await engineGenerateJSON<Record<string, unknown>>(
      executiveReviewPrompt(reviewStory, reviewScreenplay, reviewVisuals),
      { ...engineOpts, mode: 'cloud', provider: 'claude' },
    );
    stages.review = {
      members: ['claude'],
      judge: 'claude',
      durationMs: reviewResult.durationMs,
    };
    logger.info({ verdict: (reviewResult.data as any)?.verdict }, 'Council Stage 4 (review) done');

    const totalMs = Date.now() - start;
    logger.info({ totalMs, stages }, 'Council Full Pipeline complete');

    return res.json({
      success: true,
      stage: 'council_full_pipeline',
      totalDurationMs: totalMs,
      stages,
      data: {
        story: storyResult.data,
        screenplay: screenplayResult.data,
        visuals: visualsResult.data,
        review: reviewResult.data,
      },
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Council Full Pipeline failed');
    return res.status(500).json({ error: safeErrorMessage(err, 'Council pipeline failed') });
  }
});

export default router;
