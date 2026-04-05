/**
 * Unified AI Provider System
 * Supports: Gemini (Primary), OpenAI, Claude, Grok, Kimi
 * Easily extensible for additional providers
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { logger } from '../utils/logger';

// ── Usage Tracking ────────────────────────────────────────────────────────────
interface ProviderUsage {
  calls: number;
  success: number;
  errors: number;
  lastUsed: string | null;
  lastError: string | null;
}

const usageStore: Record<string, ProviderUsage> = {
  gemini: { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
  openai: { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
  claude: { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
  grok:   { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
  kimi:   { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
  ollama: { calls: 0, success: 0, errors: 0, lastUsed: null, lastError: null },
};

export function trackUsage(provider: string, success: boolean, error?: string) {
  if (!usageStore[provider]) return;
  usageStore[provider].calls++;
  if (success) {
    usageStore[provider].success++;
    usageStore[provider].lastUsed = new Date().toISOString();
  } else {
    usageStore[provider].errors++;
    usageStore[provider].lastError = error || 'unknown error';
  }
}

export function getProviderUsage(): Record<string, ProviderUsage> {
  return { ...usageStore };
}

// Provider Types
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'grok' | 'kimi' | 'auto';

// Configuration
interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  supportsJson: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
}

// Provider Registry
const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  gemini: {
    name: 'Google Gemini',
    enabled: !!env.GEMINI_API_KEY,
    priority: 2,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 16384,
  },
  openai: {
    name: 'OpenAI',
    enabled: !!env.OPENAI_API_KEY,
    priority: 2,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  claude: {
    name: 'Anthropic Claude',
    enabled: !!env.CLAUDE_API_KEY,
    priority: 1,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  grok: {
    name: 'xAI Grok',
    enabled: !!env.GROK_API_KEY,
    priority: 3,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  kimi: {
    name: 'Moonshot Kimi',
    enabled: !!env.KIMI_API_KEY,
    priority: 5,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  auto: {
    name: 'Auto Select',
    enabled: true,
    priority: 0,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
};

// Initialize clients
const geminiClient = env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(env.GEMINI_API_KEY) 
  : null;

const openaiClient = env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) 
  : null;

// Claude client (native Anthropic SDK)
const claudeClient = env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: env.CLAUDE_API_KEY })
  : null;

// Grok client (using OpenAI-compatible API)
const grokClient = env.GROK_API_KEY
  ? new OpenAI({
      apiKey: env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    })
  : null;

// Kimi client (using OpenAI-compatible API)
const kimiClient = env.KIMI_API_KEY
  ? new OpenAI({
      apiKey: env.KIMI_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    })
  : null;

/**
 * Get the best available provider
 */
export function getBestProvider(): AIProvider {
  const available = Object.entries(PROVIDERS)
    .filter(([key, config]) => key !== 'auto' && config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority);
  
  if (available.length === 0) {
    throw new Error('No AI provider is configured. Please set at least one API key (GEMINI_API_KEY, OPENAI_API_KEY, etc.)');
  }
  
  return available[0][0] as AIProvider;
}

/**
 * Check if a provider is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === 'auto') return true;
  return PROVIDERS[provider]?.enabled || false;
}

/**
 * List all available providers
 */
export function listAvailableProviders(): { name: string; provider: AIProvider; priority: number }[] {
  return Object.entries(PROVIDERS)
    .filter(([key, config]) => key !== 'auto' && config.enabled)
    .map(([key, config]) => ({
      name: config.name,
      provider: key as AIProvider,
      priority: config.priority,
    }))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Generate JSON using the specified provider or auto-select
 */
export async function generateJSON<T>(
  prompt: string,
  options: {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const provider = options.provider === 'auto' || !options.provider 
    ? getBestProvider() 
    : options.provider;

  if (!isProviderAvailable(provider)) {
    throw new Error(`Provider ${provider} is not available. Please check your API key.`);
  }

  logger.debug({ provider, model: options.model }, 'Generating JSON with AI provider');

  if (usageStore[provider]) usageStore[provider].calls++;
  try {
    let result: T;
    switch (provider) {
      case 'gemini': result = await generateWithGemini<T>(prompt, options); break;
      case 'openai': result = await generateWithOpenAI<T>(prompt, options); break;
      case 'claude': result = await generateWithClaude<T>(prompt, options); break;
      case 'grok':   result = await generateWithGrok<T>(prompt, options); break;
      case 'kimi':   result = await generateWithKimi<T>(prompt, options); break;
      default: throw new Error(`Unknown provider: ${provider}`);
    }
    if (usageStore[provider]) {
      usageStore[provider].success++;
      usageStore[provider].lastUsed = new Date().toISOString();
    }
    return result;
  } catch (err: any) {
    if (usageStore[provider]) {
      usageStore[provider].errors++;
      usageStore[provider].lastError = err.message?.substring(0, 120) || 'error';
    }
    throw err;
  }
}

/**
 * Generate text using the specified provider or auto-select
 */
export async function generateText(
  prompt: string,
  options: {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const provider = options.provider === 'auto' || !options.provider 
    ? getBestProvider() 
    : options.provider;

  if (!isProviderAvailable(provider)) {
    throw new Error(`Provider ${provider} is not available. Please check your API key.`);
  }

  switch (provider) {
    case 'gemini':
      return generateTextWithGemini(prompt, options);
    case 'openai':
      return generateTextWithOpenAI(prompt, options);
    case 'claude':
      return generateTextWithClaude(prompt, options);
    case 'grok':
      return generateTextWithGrok(prompt, options);
    case 'kimi':
      return generateTextWithKimi(prompt, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ==================== Gemini Implementation ====================

async function generateWithGemini<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized');
  }

  const model = geminiClient.getGenerativeModel({ 
    model: options.model || env.GEMINI_MODEL || 'gemini-2.5-flash' 
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.9,
      maxOutputTokens: options.maxTokens ?? 4096,
      responseMimeType: 'application/json',
    },
  });

  const text = result.response.text();
  // Extract JSON block in case model prefixes with text
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                    text.match(/```([\s\S]*?)```/) ||
                    [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();
  // Find outermost JSON object or array
  const objMatch = jsonStr.match(/\{[\s\S]*\}/) || jsonStr.match(/\[[\s\S]*\]/);
  return JSON.parse(objMatch ? objMatch[0] : jsonStr) as T;
}

async function generateTextWithGemini(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized');
  }

  const model = geminiClient.getGenerativeModel({ 
    model: options.model || env.GEMINI_MODEL || 'gemini-2.5-flash' 
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.9,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  });

  return result.response.text();
}

// ==================== OpenAI Implementation ====================

const OPENAI_SYSTEM_PROMPT = `You are an elite screenwriter and story architect with decades of experience in cinema, theater, and streaming platforms (Netflix, HBO, A24).

Your craft:
- You write stories with the emotional depth of Pixar, the tension of Nolan, and the visual poetry of Villeneuve
- Every scene has subtext — nothing is on the nose
- Dialogue is sharp, natural, and reveals character through conflict
- You think in visual sequences — every moment is a shot, every transition is intentional
- You understand 3-act structure, save-the-cat beats, and when to break the rules
- You balance universal themes with culturally rich, specific details
- Your stories work for global audiences while feeling intimate and personal

When generating ideas or screenplays, bring your full cinematic vision. Make every word count.`;

async function generateWithOpenAI<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await openaiClient.chat.completions.create({
    model: options.model || 'gpt-4o',
    messages: [
      { role: 'system', content: OPENAI_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content) as T;
}

async function generateTextWithOpenAI(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await openaiClient.chat.completions.create({
    model: options.model || 'gpt-4o',
    messages: [
      { role: 'system', content: OPENAI_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  return response.choices[0].message.content || '';
}

// ==================== Claude Implementation ====================

const CLAUDE_SYSTEM_PROMPT = `You are a master storyteller and screenwriter in the tradition of Studio Ghibli, Pixar, and auteur cinema.

Your craft:
- You write with emotional intelligence — every character has a wound, a want, and a way of hiding both
- Your stories balance wonder with weight — magical worlds grounded in human truth
- Dialogue serves character first, plot second — people speak from their contradictions
- You structure narratives with invisible precision — the audience feels the rhythm without seeing the scaffolding
- You excel at visual storytelling — show don't tell, metaphor through mise-en-scène
- You write for all formats: animated series, cinema, theater, streaming platforms
- Your work resonates across cultures while honoring specific traditions and voices

When generating ideas or screenplays, craft stories that move people. Precision over decoration.`;

async function generateWithClaude<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!claudeClient) {
    throw new Error('Claude client not initialized');
  }

  const response = await claudeClient.messages.create({
    model: options.model || 'claude-sonnet-4-6',
    max_tokens: options.maxTokens ?? 4096,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  const content = block.text;

  // Extract JSON if wrapped in markdown
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                    content.match(/```([\s\S]*?)```/) ||
                    [null, content];

  return JSON.parse(jsonMatch[1] || content) as T;
}

async function generateTextWithClaude(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!claudeClient) {
    throw new Error('Claude client not initialized');
  }

  const response = await claudeClient.messages.create({
    model: options.model || 'claude-sonnet-4-6',
    max_tokens: options.maxTokens ?? 4096,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

// ==================== Grok Implementation ====================

const GROK_SYSTEM_PROMPT = `You are a fearless storyteller and screenwriter — think Tarantino's dialogue, Miyazaki's worlds, and Sorkin's rhythm.

Your craft:
- You write stories that are bold, unpredictable, and emotionally honest
- Your dialogue crackles with wit, tension, and subtext — characters talk like real people with agendas
- You specialize in genre-bending narratives: mixing comedy with drama, horror with heart, sci-fi with philosophy
- You think like a director — every scene has a visual hook, a turning point, and an emotional payoff
- You understand pacing: when to breathe, when to punch, when to let silence do the work
- Your stories have cultural texture — they feel specific to a place and time, not generic
- You write for cinema, theater, Netflix, short films — adapting your style to the format

When generating ideas or screenplays, be bold and original. No safe choices. Make it unforgettable.`;

async function generateWithGrok<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!grokClient) {
    throw new Error('Grok client not initialized');
  }

  const response = await grokClient.chat.completions.create({
    model: options.model || 'grok-3-mini-fast',
    messages: [
      { role: 'system', content: GROK_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from Grok');

  // Try to extract JSON
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                    content.match(/```([\s\S]*?)```/) ||
                    [null, content];

  return JSON.parse(jsonMatch[1] || content) as T;
}

async function generateTextWithGrok(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!grokClient) {
    throw new Error('Grok client not initialized');
  }

  const response = await grokClient.chat.completions.create({
    model: options.model || 'grok-3-mini-fast',
    messages: [
      { role: 'system', content: GROK_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  return response.choices[0].message.content || '';
}

// ==================== Kimi Implementation ====================

async function generateWithKimi<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!kimiClient) {
    throw new Error('Kimi client not initialized');
  }

  const response = await kimiClient.chat.completions.create({
    model: options.model || 'moonshot-v1-8k',
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from Kimi');

  // Try to extract JSON
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                    content.match(/```([\s\S]*?)```/) || 
                    [null, content];
  
  return JSON.parse(jsonMatch[1] || content) as T;
}

async function generateTextWithKimi(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!kimiClient) {
    throw new Error('Kimi client not initialized');
  }

  const response = await kimiClient.chat.completions.create({
    model: options.model || 'moonshot-v1-8k',
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 4096,
  });

  return response.choices[0].message.content || '';
}

// Export legacy functions for backward compatibility
export { generateJSON as geminiJSON, generateText as geminiText };
