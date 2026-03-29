/**
 * @ai-animation-factory/prompts — Compression
 *
 * Between each pipeline stage, we compress the output to ~200 words.
 * This reduces token usage and keeps later stages focused on essentials.
 *
 * buildCompressionPrompt() — pure function, returns the prompt string.
 * The actual AI call happens in the consuming app (controller).
 */

export function buildCompressionPrompt(data: unknown, stageLabel: string): string {
  const raw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return `You are a script supervisor extracting only what the next production stage needs.

STAGE OUTPUT FROM: ${stageLabel}
---
${raw.slice(0, 6000)}
---

Extract and compress to maximum 200 words. Keep:
- Character names and their core want/flaw (1 line each)
- Central conflict in one sentence
- Theme in one sentence
- Any critical plot points or scene specifics that MUST carry forward

Strip: scores, meta-commentary, formatting, redundancy, anything decorative.
Output plain text only — no JSON, no headers.`;
}

/**
 * Manual fallback compression when AI call fails.
 * Extracts key fields from structured data without AI.
 */
export function manualCompress(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return typeof data === 'string' ? data.slice(0, 800) : '';
  }

  const d = data as Record<string, unknown>;
  const KEEP = ['title', 'concept', 'theme', 'conflict', 'protagonist', 'antagonist', 'logline', 'world'];
  const slim: Record<string, unknown> = {};

  for (const k of KEEP) {
    if (d[k] !== undefined) slim[k] = d[k];
  }

  return JSON.stringify(slim);
}
