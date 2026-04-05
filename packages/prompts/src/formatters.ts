/**
 * @ai-animation-factory/prompts — Formatters
 *
 * Safe JSON extraction from AI responses.
 * Models often wrap JSON in markdown blocks or prefix with text.
 * These utilities handle all known patterns.
 */

/**
 * Extract the first valid JSON object or array from an AI response string.
 * Handles: markdown fences, truncated JSON, nested objects, Arabic text.
 * Returns null if no valid JSON found.
 */
export function extractJSON<T = unknown>(text: string): T | null {
  if (!text) return null;

  // 1. Try ```json ... ``` block
  const codeBlockJson = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (codeBlockJson?.[1]) {
    const parsed = tryParseOrRepair<T>(codeBlockJson[1].trim());
    if (parsed !== null) return parsed;
  }

  // 2. Try ``` ... ``` block (no language tag)
  const codeBlock = text.match(/```([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    const parsed = tryParseOrRepair<T>(codeBlock[1].trim());
    if (parsed !== null) return parsed;
  }

  // 3. Try outermost JSON object — find matching braces
  const objStr = extractBalancedBlock(text, '{', '}');
  if (objStr) {
    const parsed = tryParseOrRepair<T>(objStr);
    if (parsed !== null) return parsed;
  }

  // 4. Try outermost JSON array
  const arrStr = extractBalancedBlock(text, '[', ']');
  if (arrStr) {
    const parsed = tryParseOrRepair<T>(arrStr);
    if (parsed !== null) return parsed;
  }

  // 5. Last resort: parse the whole string
  try { return JSON.parse(text.trim()) as T; } catch { /* failed */ }

  return null;
}

/** Find a balanced block of braces/brackets, handling strings correctly */
function extractBalancedBlock(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // Truncated — try closing open braces
  return null;
}

/** Try JSON.parse, if it fails try repairing truncated JSON */
function tryParseOrRepair<T>(str: string): T | null {
  // Direct parse
  try { return JSON.parse(str) as T; } catch { /* try repair */ }

  // Repair: close unclosed brackets/braces
  let repaired = str.trim();

  // Remove trailing comma
  repaired = repaired.replace(/,\s*$/, '');

  // Count unclosed braces/brackets (outside strings)
  const closers = getUnclosedClosers(repaired);
  if (closers) {
    repaired += closers;
    try { return JSON.parse(repaired) as T; } catch { /* failed */ }
  }

  // Try truncating at last complete element
  const lastValid = repaired.lastIndexOf('}');
  if (lastValid > 0) {
    const truncated = repaired.slice(0, lastValid + 1);
    const closers2 = getUnclosedClosers(truncated);
    try { return JSON.parse(truncated + (closers2 || '')) as T; } catch { /* failed */ }
  }

  return null;
}

function getUnclosedClosers(str: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of str) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  return stack.length > 0 ? stack.reverse().join('') : null;
}

/**
 * Extract JSON with a fallback value.
 * Use when you need a guaranteed result.
 */
export function extractJSONOrFallback<T>(text: string, fallback: T): T {
  return extractJSON<T>(text) ?? fallback;
}
