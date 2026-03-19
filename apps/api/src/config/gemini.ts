import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

// Lazy init — don't crash at startup if key is missing
let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    _client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return _client;
}

export function getGeminiModel(model?: string) {
  return getClient().getGenerativeModel({ model: model || env.GEMINI_MODEL });
}

export function isGeminiConfigured(): boolean {
  return !!env.GEMINI_API_KEY;
}

// Fallback model chain — if primary quota is hit, try next
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];

async function withFallback<T>(fn: (model: string) => Promise<T>, primaryModel?: string): Promise<T> {
  const primary = primaryModel || env.GEMINI_MODEL || 'gemini-2.0-flash';
  const chain = [primary, ...FALLBACK_MODELS.filter(m => m !== primary)];
  let lastErr: unknown;
  for (const model of chain) {
    try {
      return await fn(model);
    } catch (err: any) {
      const is429 = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED');
      if (!is429) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Call Gemini and parse JSON response */
export async function geminiJSON<T>(prompt: string, model?: string): Promise<T> {
  return withFallback(async (m) => {
    const mdl = getGeminiModel(m);
    const result = await mdl.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    return JSON.parse(result.response.text()) as T;
  }, model);
}

/** Call Gemini for plain text */
export async function geminiText(prompt: string, model?: string): Promise<string> {
  return withFallback(async (m) => {
    const mdl = getGeminiModel(m);
    const result = await mdl.generateContent(prompt);
    return result.response.text();
  }, model);
}

/** Call Gemini in JSON mode — guarantees valid JSON response */
export async function geminiTextJSON(prompt: string, model?: string): Promise<string> {
  return withFallback(async (m) => {
    const mdl = getGeminiModel(m);
    const result = await mdl.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    return result.response.text();
  }, model);
}

// Keep named export for backward compat
export const geminiClient = { isConfigured: isGeminiConfigured };
