/**
 * AI Engine — Unified provider layer for all idea/creative operations
 *
 * Combines:
 * - Cloud providers (Claude, Gemini, OpenAI, Grok, Kimi) via ai-provider.ts
 * - Local Ollama (free, offline)
 * - Hybrid mode: Ollama generates → Cloud reviews
 * - Fallback chain: preferred → next available → Ollama
 *
 * All creative routes use this single engine.
 */

import { generateJSON, generateText, getBestProvider, trackUsage, listAvailableProviders, isProviderAvailable, type AIProvider } from '../config/ai-provider';
import { extractJSON } from '@ai-animation-factory/prompts';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import axios from 'axios';

// ── Types ────────────────────────────────────────────────────────────────────

export type EngineMode = 'cloud' | 'ollama' | 'hybrid';
export type OllamaModel = 'mistral' | 'llama3' | 'qwen2.5:7b';

export interface EngineOptions {
  /** Which mode to use. Default: 'hybrid' */
  mode?: EngineMode;
  /** Preferred cloud provider. Default: auto (best available) */
  provider?: AIProvider;
  /** Ollama model for local generation. Default: 'mistral' */
  ollamaModel?: OllamaModel;
  /** Skip cloud review in hybrid mode. Default: false */
  skipReview?: boolean;
  /** Temperature for generation. Default: 0.9 */
  temperature?: number;
  /** Max tokens. Default: 4096 */
  maxTokens?: number;
}

export interface EngineResult<T> {
  data: T;
  engine: string;
  reviewed: boolean;
  durationMs: number;
}

// ── Ollama ───────────────────────────────────────────────────────────────────

const OLLAMA_BASE = env.OLLAMA_URL || 'http://localhost:11434';

async function isOllamaRunning(): Promise<boolean> {
  try {
    await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function ollamaGenerate(prompt: string, model: string): Promise<string> {
  const response = await axios.post(
    `${OLLAMA_BASE}/api/generate`,
    { model, prompt, stream: false, options: { temperature: 0.9, num_predict: 4096 } },
    { timeout: 180_000 }
  );
  return response.data.response as string;
}

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
    const recommended = models.find(m => m.includes('mistral')) || models[0] || 'mistral';
    return { running: true, models, recommended };
  } catch {
    return { running: true, models: [], recommended: 'mistral' };
  }
}

// ── Cloud JSON generation (text + robust extraction) ────────────────────────

async function cloudGenerateJSON<T>(
  prompt: string,
  options: { provider?: AIProvider; temperature?: number; maxTokens?: number } = {},
): Promise<T> {
  // Strategy: try generateJSON (uses native JSON mode where available), fallback to text + extractJSON
  try {
    return await generateJSON<T>(prompt, {
      provider: options.provider || 'auto',
      temperature: options.temperature ?? 0.9,
      maxTokens: options.maxTokens ?? 4096,
    });
  } catch (jsonErr) {
    logger.warn({ err: (jsonErr as Error).message }, 'generateJSON failed — trying text + extractJSON');
    const raw = await generateText(prompt, {
      provider: options.provider || 'auto',
      temperature: options.temperature ?? 0.9,
      maxTokens: options.maxTokens ?? 4096,
    });
    const parsed = extractJSON<T>(raw);
    if (!parsed) {
      logger.error({ rawLength: raw.length, rawStart: raw.slice(0, 300) }, 'extractJSON also failed');
      throw new Error('Failed to parse JSON from AI response');
    }
    return parsed;
  }
}

// ── Cloud review (for hybrid mode) ──────────────────────────────────────────

async function reviewWithCloud<T>(
  ollamaOutput: T,
  reviewPrompt: string,
  provider?: AIProvider,
): Promise<T> {
  try {
    const result = await cloudGenerateJSON<T>(reviewPrompt, {
      provider: provider || 'auto',
      temperature: 0.7,
      maxTokens: 2048,
    });
    return result;
  } catch (err) {
    logger.warn({ err }, 'Cloud review failed — using original output');
    return ollamaOutput;
  }
}

function buildReviewPrompt<T>(original: T, context: string): string {
  return `You are a creative director. Review and enhance this content while preserving the exact JSON structure.
Improve: title catchiness, description engagement, theme depth, dialogue quality.
Do NOT change the structure or add/remove fields.

Context: ${context}

Original:
${JSON.stringify(original, null, 2)}

Return enhanced JSON only. No explanation.`;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

/**
 * Generate JSON content using the unified AI engine.
 * Supports cloud, ollama, and hybrid modes with automatic fallback.
 */
export async function engineGenerateJSON<T>(
  prompt: string,
  options: EngineOptions = {},
): Promise<EngineResult<T>> {
  const {
    mode = 'hybrid',
    provider = 'auto',
    ollamaModel = 'mistral',
    skipReview = false,
    temperature = 0.9,
    maxTokens = 4096,
  } = options;

  const start = Date.now();

  // ── Cloud-only mode ──
  if (mode === 'cloud') {
    const data = await cloudGenerateJSON<T>(prompt, { provider, temperature, maxTokens });
    const usedProvider = provider === 'auto' ? getBestProvider() : provider;
    return {
      data,
      engine: usedProvider,
      reviewed: false,
      durationMs: Date.now() - start,
    };
  }

  const ollamaOk = await isOllamaRunning();

  // ── Ollama not available → fallback to cloud ──
  if (!ollamaOk) {
    logger.warn('Ollama not running — falling back to cloud');
    const data = await cloudGenerateJSON<T>(prompt, { provider, temperature, maxTokens });
    const usedProvider = provider === 'auto' ? getBestProvider() : provider;
    return {
      data,
      engine: `${usedProvider} (ollama-fallback)`,
      reviewed: false,
      durationMs: Date.now() - start,
    };
  }

  // ── Ollama generation ──
  try {
    logger.info({ model: ollamaModel, mode }, 'Engine: Ollama generating');
    const raw = await ollamaGenerate(prompt, ollamaModel);
    const parsed = extractJSON<T>(raw);

    if (!parsed) {
      throw new Error('Failed to parse JSON from Ollama response');
    }

    trackUsage('ollama', true);

    // Ollama-only mode
    if (mode === 'ollama' || skipReview) {
      return {
        data: parsed,
        engine: `ollama/${ollamaModel}`,
        reviewed: false,
        durationMs: Date.now() - start,
      };
    }

    // Hybrid mode → cloud review
    logger.info('Engine: Cloud reviewing Ollama output');
    const reviewPrompt = buildReviewPrompt(parsed, prompt.slice(0, 200));
    const reviewed = await reviewWithCloud<T>(parsed, reviewPrompt, provider);
    const usedProvider = provider === 'auto' ? getBestProvider() : provider;

    return {
      data: reviewed,
      engine: `ollama/${ollamaModel}+${usedProvider}-review`,
      reviewed: true,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    trackUsage('ollama', false, err.message);
    logger.warn({ err: err.message }, 'Ollama failed — falling back to cloud');

    const data = await cloudGenerateJSON<T>(prompt, { provider, temperature, maxTokens });
    const usedProvider = provider === 'auto' ? getBestProvider() : provider;

    return {
      data,
      engine: `${usedProvider} (ollama-error-fallback)`,
      reviewed: false,
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Generate text (non-JSON) using the unified AI engine.
 * Used for compression and freeform text stages.
 */
export async function engineGenerateText(
  prompt: string,
  options: Pick<EngineOptions, 'provider' | 'temperature' | 'maxTokens'> = {},
): Promise<{ text: string; provider: string }> {
  const { provider = 'auto', temperature = 0.7, maxTokens = 2048 } = options;
  const text = await generateText(prompt, { provider, temperature, maxTokens });
  const usedProvider = provider === 'auto' ? getBestProvider() : provider;
  return { text, provider: usedProvider };
}

// ── Creative Council Mode ─────────────────────────────────────────────────────
// All available providers generate independently → Claude judges & merges the best

interface CouncilMember {
  provider: string;
  data: Record<string, unknown>;
  durationMs: number;
}

interface CouncilResult<T> {
  data: T;
  engine: 'creative-council';
  reviewed: true;
  durationMs: number;
  council: {
    members: Array<{ provider: string; durationMs: number }>;
    judge: string;
    judgeDurationMs: number;
  };
}

const COUNCIL_JUDGE_PROMPT = `أنت المنتج التنفيذي الأعلى — حكمك نهائي. أمامك عدة نسخ من نفس العمل الإبداعي، كل نسخة من كاتب مختلف.

مهمتك:
1. اقرأ كل النسخ بعناية
2. حدد أقوى العناصر من كل نسخة:
   - أفضل عنوان (الأكثر جذباً وأصالة)
   - أعمق شخصيات (الأكثر تعقيداً وإنسانية)
   - أقوى صراع (الأكثر إلحاحاً ومصداقية)
   - أفضل حوارات (الأكثر طبيعية وعمقاً)
   - أجمل وصف بصري (الأكثر سينمائية)
3. ادمج أفضل العناصر في نسخة واحدة نهائية متماسكة
4. النسخة النهائية يجب أن تكون أفضل من أي نسخة فردية

القاعدة الذهبية: لا تختار نسخة كاملة — ابنِ تحفة من أفضل أجزاء الجميع.
إذا كانت نسخة واحدة متفوقة بوضوح في كل شيء — استخدمها كأساس وعززها بلمسات من الباقي.

أعد النتيجة كـ JSON بنفس البنية المطلوبة أصلاً. لا تضف حقول جديدة.`;

/**
 * Creative Council — All providers compete, Claude judges.
 * Ollama + Cloud providers all generate independently,
 * then Claude merges the best elements into one masterpiece.
 */
export async function engineCouncilGenerate<T>(
  prompt: string,
  options: EngineOptions = {},
): Promise<CouncilResult<T>> {
  const {
    ollamaModel = 'qwen2.5:7b',
    temperature = 0.9,
    maxTokens = 4096,
  } = options;

  const start = Date.now();
  const members: CouncilMember[] = [];

  // ── Gather all available providers ──
  const available = listAvailableProviders().filter((p: { provider: string }) => p.provider !== 'auto');
  const ollamaOk = await isOllamaRunning();

  // ── Launch all providers in parallel ──
  const tasks: Array<Promise<void>> = [];

  // Ollama (local)
  if (ollamaOk) {
    tasks.push(
      (async () => {
        const t = Date.now();
        try {
          logger.info({ model: ollamaModel }, 'Council: Ollama generating');
          const raw = await ollamaGenerate(prompt, ollamaModel);
          const parsed = extractJSON<Record<string, unknown>>(raw);
          if (parsed) {
            members.push({ provider: `ollama/${ollamaModel}`, data: parsed, durationMs: Date.now() - t });
            trackUsage('ollama', true);
          }
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Council: Ollama failed — skipping');
          trackUsage('ollama', false, err.message);
        }
      })()
    );
  }

  // Cloud providers (exclude Claude — he's the judge)
  for (const { provider } of available) {
    if (provider === 'claude') continue; // Claude judges, doesn't compete
    tasks.push(
      (async () => {
        const t = Date.now();
        try {
          logger.info({ provider }, 'Council: cloud provider generating');
          const data = await cloudGenerateJSON<Record<string, unknown>>(prompt, {
            provider,
            temperature,
            maxTokens,
          });
          members.push({ provider, data, durationMs: Date.now() - t });
        } catch (err: any) {
          logger.warn({ provider, err: err.message }, 'Council: cloud provider failed — skipping');
        }
      })()
    );
  }

  await Promise.all(tasks);

  // ── If no members succeeded, fall back to single provider ──
  if (members.length === 0) {
    logger.warn('Council: no members produced output — falling back to single provider');
    return engineGenerateJSON<T>(prompt, { ...options, mode: 'cloud' }) as unknown as CouncilResult<T>;
  }

  // ── If only one member — no need to judge ──
  if (members.length === 1) {
    logger.info({ provider: members[0].provider }, 'Council: only one member — using directly');
    return {
      data: members[0].data as T,
      engine: 'creative-council',
      reviewed: true,
      durationMs: Date.now() - start,
      council: {
        members: members.map(m => ({ provider: m.provider, durationMs: m.durationMs })),
        judge: members[0].provider,
        judgeDurationMs: 0,
      },
    };
  }

  // ── Claude judges all submissions ──
  const judgeStart = Date.now();
  const submissions = members.map((m, i) => `\n--- كاتب ${i + 1} (${m.provider}) ---\n${JSON.stringify(m.data, null, 2)}`).join('\n');

  const judgePrompt = `${COUNCIL_JUDGE_PROMPT}

${submissions}

───────────────────────────────
الطلب الأصلي الذي أنتج هذه النسخ:
${prompt.slice(0, 1500)}
───────────────────────────────

أعد النسخة النهائية المدمجة كـ JSON فقط.`;

  let finalData: T;
  try {
    // Use Claude as judge if available, otherwise best provider
    const judgeProvider = isProviderAvailable('claude') ? 'claude' : getBestProvider();
    finalData = await cloudGenerateJSON<T>(judgePrompt, {
      provider: judgeProvider,
      temperature: 0.7,
      maxTokens: Math.max(maxTokens, 8192),
    });
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Council: judge failed — using best member');
    // Pick the first cloud provider's result (usually Grok = highest priority)
    finalData = members[0].data as T;
  }

  const judgeDurationMs = Date.now() - judgeStart;

  logger.info({
    members: members.map(m => m.provider),
    totalMs: Date.now() - start,
    judgeDurationMs,
  }, 'Council: complete');

  return {
    data: finalData,
    engine: 'creative-council',
    reviewed: true,
    durationMs: Date.now() - start,
    council: {
      members: members.map(m => ({ provider: m.provider, durationMs: m.durationMs })),
      judge: isProviderAvailable('claude') ? 'claude' : getBestProvider(),
      judgeDurationMs,
    },
  };
}
