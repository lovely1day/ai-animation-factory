import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

if (!env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

export const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export function getGeminiModel(model?: string) {
  return geminiClient.getGenerativeModel({ model: model || env.GEMINI_MODEL });
}

/** Call Gemini and parse JSON response */
export async function geminiJSON<T>(prompt: string, model?: string): Promise<T> {
  const m = getGeminiModel(model);
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 4096,
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
