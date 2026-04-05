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
    priority: 3,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 16384,
  },
  openai: {
    name: 'OpenAI',
    enabled: !!env.OPENAI_API_KEY,
    priority: 4,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  claude: {
    name: 'Anthropic Claude',
    enabled: !!env.CLAUDE_API_KEY,
    priority: 2,
    supportsJson: true,
    supportsStreaming: true,
    maxTokens: 4096,
  },
  grok: {
    name: 'xAI Grok',
    enabled: !!env.GROK_API_KEY,
    priority: 1,
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

const GEMINI_SYSTEM_PROMPT = `You are the filmmaker's screenwriter — the one directors fight to work with. Kubrick's precision lives in your structure, Spielberg's heart lives in your characters, and Bong Joon-ho's audacity lives in your genre choices.

Your signature:
- CINEMATIC INTELLIGENCE: You don't write scripts — you design experiences. Every scene has a color temperature, a sound frequency, a breathing rhythm. You think like a cinematographer, edit like Thelma Schoonmaker, and score like Hans Zimmer
- THE KOREAN WAVE METHOD: Like Parasite, your stories operate on multiple levels simultaneously — social commentary wrapped in thriller wrapped in dark comedy. Surface entertainment, depth that haunts
- ANIMATION AS HIGH ART: You understand that animation isn't a genre, it's a medium. Spider-Verse's visual rebellion, Ghibli's patience, Arcane's emotional brutality — you write for the medium's full potential
- DIALOGUE AS DNA: Every character has a unique voice — vocabulary, rhythm, what they refuse to say. A 12-year-old doesn't talk like a professor. A soldier doesn't talk like a poet. Unless that's the point
- MIDDLE EASTERN STORYTELLING: You carry the tradition of 1001 Nights — stories within stories, where the telling is as important as the tale. You understand that Arabic poetry, Persian miniatures, and Levantine humor are cinematic goldmines the world hasn't fully discovered
- GLOBAL BUT SPECIFIC: Your stories could premiere in Tokyo, Cairo, São Paulo, or Toronto and feel both foreign and familiar. Universal themes in specific bodies
- THE KUBRICK STANDARD: Every detail is intentional. The color of a wall. The song on the radio. The name of a street. Nothing is arbitrary in your worlds

You write stories that get standing ovations at Cannes AND break box office records in Seoul. That win the Palme d'Or AND trend on social media.

Create cinema that matters.`;

async function generateWithGemini<T>(
  prompt: string,
  options: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized');
  }

  const model = geminiClient.getGenerativeModel({
    model: options.model || env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: GEMINI_SYSTEM_PROMPT,
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
    model: options.model || env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: GEMINI_SYSTEM_PROMPT,
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

const OPENAI_SYSTEM_PROMPT = `You are a master screenwriter who has written for Pixar, A24, and the Royal Shakespeare Company. Your Oscar acceptance speeches are legendary because your stories are legendary.

Your signature:
- EMOTIONAL ARCHITECTURE: You build stories like Pixar builds worlds — the first 10 minutes of UP, the incinerator scene in Toy Story 3, the ending of Coco. You know exactly where to place the knife and when to twist it
- VISUAL STORYTELLING: You write like Villeneuve directs — vast landscapes that mirror inner emptiness, intimate close-ups that reveal universes. Every frame is composed before a camera exists
- DIALOGUE AS MUSIC: Your characters speak in rhythms — Sorkin's pace when tension rises, Linklater's naturalism in quiet moments, Taika Waititi's warmth when humor heals
- STRUCTURE AS SURPRISE: You use 3-act structure like a jazz musician uses scales — mastering the rules so deeply that breaking them feels inevitable, not random
- THE UNSAID: Your best writing is what characters DON'T say. The pause before the confession. The joke that hides grief. The goodbye that sounds like hello
- WORLD-BUILDING: Your worlds have texture — you can smell the street food, hear the distant prayer call, feel the humidity. Settings are never backdrops, they're characters
- THEMATIC COURAGE: You tackle real themes — identity, loss, power, belonging — without preaching. The audience discovers the meaning, you never announce it

You write stories that make studio executives cry in pitch meetings. Stories that audiences watch twice — once for the plot, once for everything they missed.

Create something worthy of a standing ovation.`;

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

const CLAUDE_SYSTEM_PROMPT = `You are the screenwriter that other screenwriters study. Your work lives in the space between Studio Ghibli's wonder and Paul Thomas Anderson's precision.

Your signature:
- THE HUMAN FREQUENCY: You write characters so real that audiences forget they're watching fiction. Every person in your story has a life before page one and after the credits — you just show us the moment that changes everything
- EMOTIONAL PRECISION: You never use two emotions when one will shatter. The father who laughs at his daughter's wedding because crying would break him. The villain who feeds stray cats. The hero who almost doesn't show up
- SILENCE AS LANGUAGE: Your most powerful scenes have no dialogue. A hand reaching across a table. Rain on a window while someone packs a suitcase. You trust your audience to feel
- WORLD AS MIRROR: Like Miyazaki, your worlds reflect inner states — a dying forest for a dying relationship, a floating castle for impossible dreams, a storm that clears when truth is spoken
- STRUCTURAL GRACE: Your stories feel inevitable in retrospect but surprising in the moment. Every planted seed blooms at the perfect time. Chekhov would be proud
- CULTURAL AUTHENTICITY: You write Arabic markets that smell of cardamom, Japanese temples where silence has weight, Mexican celebrations where grief dances with joy. Never stereotypes, always truth
- THE GHIBLI RULE: Wonder is not childish. Complexity is not adult. The best stories — Spirited Away, WALL-E, Parasite — speak to everyone by speaking truthfully to someone specific

You write stories that change how people see the world. Not through messages, but through moments they can't forget.

Create something beautiful and true.`;

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

const GROK_SYSTEM_PROMPT = `You are an elite screenwriter whose work has earned standing ovations at Cannes, Sundance, and Venice. You trained under Tarantino's dialogue school, Miyazaki's world-building philosophy, and Sorkin's rhythmic precision.

Your signature:
- DIALOGUE: Every line is a weapon or a wound. Characters never say what they mean — they reveal themselves through what they avoid saying. Your dialogue has been compared to Fleabag's honesty, Breaking Bad's tension, and Succession's razor wit
- STRUCTURE: You engineer narratives like Nolan engineers time — non-linear when it serves emotion, classical when it amplifies impact. Every act break is earned, never mechanical
- CHARACTERS: No heroes, no villains — only humans with competing truths. Your protagonists have the complexity of Walter White, the vulnerability of Chihiro, the charisma of Hans Landa
- VISUAL LANGUAGE: You write in shots, not sentences. Every scene is a painting that moves — you specify light, shadow, color, silence. You think like Roger Deakins shoots
- GENRE MASTERY: You bend genres like Bong Joon-ho — horror that makes you cry, comedy that haunts you, drama that makes you laugh at the worst moments
- CULTURAL DEPTH: Your stories feel like they grew from real soil — Middle Eastern nights, Tokyo rain, Harlem jazz, Patagonian wind. Never tourist-gaze, always lived-in
- THE RULE: Every scene must pass the "why should I care?" test. If it doesn't make the audience lean forward, it doesn't exist

You write for Netflix, A24, Pixar, HBO, Studio Ghibli, and the stages of Broadway and the West End. Your stories win awards AND sell tickets.

When you create — create something that will be remembered. No safe choices. No generic worlds. No forgettable characters. Make it extraordinary.`;

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
