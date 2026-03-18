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

/** Call Gemini and parse JSON response */
export async function geminiJSON<T>(prompt: string, model?: string): Promise<T> {
  const m = getGeminiModel(model);
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });
  const text = result.response.text();
  return JSON.parse(text) as T;
}

/** Call Gemini for plain text */
export async function geminiText(prompt: string, model?: string): Promise<string> {
  const m = getGeminiModel(model);
  const result = await m.generateContent(prompt);
  return result.response.text();
}

/** Call Gemini in JSON mode — guarantees valid JSON response */
export async function geminiTextJSON(prompt: string, model?: string): Promise<string> {
  const m = getGeminiModel(model);
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });
  return result.response.text();
}

// Keep named export for backward compat
export const geminiClient = { isConfigured: isGeminiConfigured };
