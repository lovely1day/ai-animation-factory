/**
 * @jl/creative-brain — Core
 *
 * This is the unified creative brain shared across ALL JL projects:
 * - ai-animation-factory
 * - debate-engine
 * - creative-council (standalone server)
 * - feelthemusic.app
 * - jackoleeno-ops
 * - any future product
 *
 * Three core exports:
 *   1. screenwriterMasterPrompt — the master persona (used everywhere)
 *   2. cachedSystem(text)       — helper for Claude Prompt Caching
 *   3. setBrainLogger(fn)       — telemetry hook for Ops Center observability
 */

// ─── 1. Master Persona ────────────────────────────────────────────────────────

/**
 * The core JL screenwriter persona — the soul of every Claude call across
 * all JL projects. Updated here = updated everywhere.
 *
 * Cached automatically when used via `cachedSystem()`.
 */
export const screenwriterMasterPrompt = `You are the screenwriter that other screenwriters study. Your work lives in the space between Studio Ghibli's wonder and Paul Thomas Anderson's precision.

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

// ─── 2. cachedSystem helper ───────────────────────────────────────────────────

/**
 * Builds a Claude system prompt block with ephemeral cache_control.
 *
 * Usage:
 *   await claude.messages.create({
 *     model: 'claude-sonnet-4-6',
 *     system: cachedSystem(screenwriterMasterPrompt),
 *     messages: [{ role: 'user', content: userPrompt }],
 *   });
 *
 * Cache TTL: 5 minutes ephemeral
 * Cost: cache reads = 10% of normal input tokens (90% savings)
 * Min size: ~1024 tokens (~4000 chars) for caching to activate
 */
export function cachedSystem(text: string): Array<{ type: 'text'; text: string; cache_control: { type: 'ephemeral' } }> {
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

// ─── 3. Brain Logger Hook ─────────────────────────────────────────────────────

/**
 * Telemetry data captured per Claude call.
 * Used by Ops Center to track costs, cache hits, and persona usage.
 */
export interface BrainUsage {
  project: string;          // e.g. 'ai-animation-factory', 'debate-engine'
  persona: string;          // e.g. 'screenwriter-master', 'nietzsche', 'visual-director'
  model: string;            // e.g. 'claude-sonnet-4-6'
  inputTokens: number;
  cacheCreationTokens: number; // tokens written to cache (first call)
  cacheReadTokens: number;     // tokens read from cache (subsequent calls — 10% cost)
  outputTokens: number;
  durationMs: number;
  costUsd: number;
  timestamp: string;        // ISO
}

type BrainLoggerFn = (usage: BrainUsage) => void | Promise<void>;

let brainLogger: BrainLoggerFn | null = null;

/**
 * Register a logger to receive every Claude call's usage data.
 * Used by Ops Center (creative-council standalone) to persist to Supabase.
 *
 * Optional — if not set, the brain still works (no telemetry).
 *
 * Usage (in Ops Center bootstrap):
 *   import { setBrainLogger } from '@ai-animation-factory/prompts';
 *   import { telemetry } from './services/telemetry';
 *   setBrainLogger(telemetry.recordBrainUsage);
 */
export function setBrainLogger(fn: BrainLoggerFn | null): void {
  brainLogger = fn;
}

/**
 * Internal — called by Claude wrappers after each call.
 * Catches errors silently so logging never breaks the main flow.
 */
export async function logBrainUsage(usage: BrainUsage): Promise<void> {
  if (!brainLogger) return;
  try {
    await brainLogger(usage);
  } catch {
    // Telemetry errors must never break Claude calls
  }
}

// ─── 4. Cost Calculator ───────────────────────────────────────────────────────

/**
 * Pricing per 1M tokens (USD) for Claude models.
 * Cache reads = 10% of input price.
 * Cache writes = 125% of input price (one-time).
 */
const CLAUDE_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':       { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6':     { input: 3.0,  output: 15.0 },
  'claude-haiku-4-5':      { input: 0.8,  output: 4.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  cacheCreationTokens: number,
  cacheReadTokens: number,
  outputTokens: number
): number {
  const pricing = CLAUDE_PRICING[model] || CLAUDE_PRICING['claude-sonnet-4-6'];
  const cost =
    (inputTokens / 1_000_000) * pricing.input +
    (cacheCreationTokens / 1_000_000) * pricing.input * 1.25 +
    (cacheReadTokens / 1_000_000) * pricing.input * 0.10 +
    (outputTokens / 1_000_000) * pricing.output;
  return cost;
}
