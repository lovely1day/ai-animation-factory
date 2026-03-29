/**
 * @ai-animation-factory/prompts — Formatters
 *
 * Safe JSON extraction from AI responses.
 * Models often wrap JSON in markdown blocks or prefix with text.
 * These utilities handle all known patterns.
 */

/**
 * Extract the first valid JSON object or array from an AI response string.
 * Returns null if no valid JSON found.
 */
export function extractJSON<T = unknown>(text: string): T | null {
  if (!text) return null;

  // 1. Try ```json ... ``` block
  const codeBlockJson = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (codeBlockJson?.[1]) {
    try { return JSON.parse(codeBlockJson[1].trim()) as T; } catch { /* next */ }
  }

  // 2. Try ``` ... ``` block (no language tag)
  const codeBlock = text.match(/```([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    try { return JSON.parse(codeBlock[1].trim()) as T; } catch { /* next */ }
  }

  // 3. Try outermost JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch?.[0]) {
    try { return JSON.parse(objMatch[0]) as T; } catch { /* next */ }
  }

  // 4. Try outermost JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch?.[0]) {
    try { return JSON.parse(arrMatch[0]) as T; } catch { /* next */ }
  }

  // 5. Last resort: parse the whole string
  try { return JSON.parse(text.trim()) as T; } catch { /* failed */ }

  return null;
}

/**
 * Extract JSON with a fallback value.
 * Use when you need a guaranteed result.
 */
export function extractJSONOrFallback<T>(text: string, fallback: T): T {
  return extractJSON<T>(text) ?? fallback;
}
