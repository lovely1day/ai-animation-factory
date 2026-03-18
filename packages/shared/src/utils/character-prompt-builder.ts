// ============================================================
// CHARACTER PROMPT BUILDER
// Version: 1.0.0
//
// Assembles a complete image-generation prompt from a DNA string.
// Used by: image-worker, scene-prompt-service, API routes
//
// Output example:
//   "portrait of a male character, oval face shape, almond-shaped eyes,
//    dark brown eyes, jet black hair, medium length hair, light skin tone,
//    athletic body type, 1920s Roaring Twenties Art Deco era aesthetic,
//    1920s three-piece suit, wide lapels, suspenders, fedora hat,
//    cinematic lighting, highly detailed, 8k"
// ============================================================

import { decodeDNA }           from "./character-dna";
import { buildIndex, resolveEra } from "./catalogResolver";
import type { EraCode, GenderCode, Code } from "../types/character-room.types";

import {
  FACE_SHAPES, FOREHEAD_TYPES,
  EYE_SHAPES, EYE_SIZES, EYE_COLORS, IRIS_PATTERNS, EYEBROW_SHAPES,
  NOSE_SHAPES, NOSE_BRIDGES, LIP_SHAPES,
  CHIN_SHAPES, JAW_TYPES, NECK_TYPES,
  HAIR_STYLES, HAIR_LENGTHS, HAIR_COLORS,
  SKIN_TONES, SKIN_UNDERTONES,
  BODY_TYPES,
  ERA_CATALOG,
} from "../data/character/index";

// ─── PRE-BUILD INDEXES (O(1) lookup) ──────────────────────
const IDX = {
  FS:  buildIndex(FACE_SHAPES),
  FH:  buildIndex(FOREHEAD_TYPES),
  ES:  buildIndex(EYE_SHAPES),
  EZ:  buildIndex(EYE_SIZES),
  EC:  buildIndex(EYE_COLORS),
  EP:  buildIndex(IRIS_PATTERNS),
  EB:  buildIndex(EYEBROW_SHAPES),
  NS:  buildIndex(NOSE_SHAPES),
  NB:  buildIndex(NOSE_BRIDGES),
  LS:  buildIndex(LIP_SHAPES),
  CH:  buildIndex(CHIN_SHAPES),
  JW:  buildIndex(JAW_TYPES),
  NK:  buildIndex(NECK_TYPES),
  HS:  buildIndex(HAIR_STYLES),
  HL:  buildIndex(HAIR_LENGTHS),
  HC:  buildIndex(HAIR_COLORS),
  SK:  buildIndex(SKIN_TONES),
  ST:  buildIndex(SKIN_UNDERTONES),
  BD:  buildIndex(BODY_TYPES),
} as const;

// ─── QUALITY SUFFIX ────────────────────────────────────────
const QUALITY_SUFFIX =
  "cinematic lighting, photorealistic, highly detailed, sharp focus, 8k resolution";

// ─── NEGATIVE PROMPT ──────────────────────────────────────
export const CHARACTER_NEGATIVE_PROMPT =
  "blurry, deformed, extra limbs, bad anatomy, watermark, text, logo, " +
  "low quality, pixelated, cartoon, anime, sketch, painting";

// ─── MAIN BUILDER ──────────────────────────────────────────

export interface CharacterPromptResult {
  /** Full positive prompt for ComfyUI / Stable Diffusion */
  prompt: string;
  /** Negative prompt */
  negativePrompt: string;
  /** Gender resolved from DNA */
  gender: GenderCode;
  /** Era code resolved from DNA (if any) */
  era?: EraCode;
  /** Number of DNA segments that were resolved */
  resolvedCount: number;
}

/**
 * Builds a complete image-generation prompt from a DNA string.
 *
 * @param dnaString  - encoded DNA e.g. "v1|G:M|FS:FS001|EC:EC012|ERA:ERA_1920"
 * @param extraHints - optional extra context appended to the prompt
 *                     e.g. "standing in a market, looking forward"
 */
export function buildCharacterPrompt(
  dnaString: string,
  extraHints?: string,
): CharacterPromptResult {
  const dna = decodeDNA(dnaString);

  if (!dna) {
    return {
      prompt: `portrait of a character, ${QUALITY_SUFFIX}`,
      negativePrompt: CHARACTER_NEGATIVE_PROMPT,
      gender: "M",
      resolvedCount: 0,
    };
  }

  const seg = dna.segments;
  const gender: GenderCode = (seg.G as GenderCode) ?? "M";
  const parts: string[] = [];
  let resolvedCount = 0;

  // ── 1. Subject ────────────────────────────────────────────
  parts.push(gender === "F" ? "portrait of a female character" : "portrait of a male character");

  // ── 2. Skin ───────────────────────────────────────────────
  if (seg.SK) {
    const item = IDX.SK.get(seg.SK);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.ST) {
    const item = IDX.ST.get(seg.ST);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 3. Face ───────────────────────────────────────────────
  if (seg.FS) {
    const item = IDX.FS.get(seg.FS);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.FH) {
    const item = IDX.FH.get(seg.FH);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 4. Eyes ───────────────────────────────────────────────
  if (seg.ES) {
    const item = IDX.ES.get(seg.ES);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.EZ) {
    const item = IDX.EZ.get(seg.EZ);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.EC) {
    const item = IDX.EC.get(seg.EC);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.EP) {
    const item = IDX.EP.get(seg.EP);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.EB) {
    const item = IDX.EB.get(seg.EB);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 5. Nose ───────────────────────────────────────────────
  if (seg.NS) {
    const item = IDX.NS.get(seg.NS);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.NB) {
    const item = IDX.NB.get(seg.NB);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 6. Lips ───────────────────────────────────────────────
  if (seg.LS) {
    const item = IDX.LS.get(seg.LS);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 7. Chin / Jaw / Neck ──────────────────────────────────
  if (seg.CH) {
    const item = IDX.CH.get(seg.CH);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.JW) {
    const item = IDX.JW.get(seg.JW);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.NK) {
    const item = IDX.NK.get(seg.NK);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 8. Hair ───────────────────────────────────────────────
  if (seg.HS) {
    const item = IDX.HS.get(seg.HS);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.HL) {
    const item = IDX.HL.get(seg.HL);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.HC) {
    const item = IDX.HC.get(seg.HC);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }

  // ── 9. Body ───────────────────────────────────────────────
  if (seg.BD) {
    const item = IDX.BD.get(seg.BD);
    if (item) { parts.push(item.ai.prompt); resolvedCount++; }
  }
  if (seg.HT) {
    parts.push(`height ${seg.HT}cm`);
    resolvedCount++;
  }

  // ── 10. Era — clothing + environment ─────────────────────
  let era: EraCode | undefined;
  if (seg.ERA) {
    era = seg.ERA as EraCode;
    const eraItem = resolveEra(ERA_CATALOG, era);
    if (eraItem) {
      parts.push(eraItem.ai.prompt);
      parts.push(gender === "F" ? eraItem.clothing.promptF : eraItem.clothing.promptM);
      parts.push(`background: ${eraItem.environment.architecture}`);
      parts.push(`${eraItem.environment.lighting}`);
      resolvedCount++;
    }
  }

  // ── 11. Extra hints ───────────────────────────────────────
  if (extraHints?.trim()) {
    parts.push(extraHints.trim());
  }

  // ── 12. Quality ───────────────────────────────────────────
  parts.push(QUALITY_SUFFIX);

  return {
    prompt: parts.join(", "),
    negativePrompt: CHARACTER_NEGATIVE_PROMPT,
    gender,
    era,
    resolvedCount,
  };
}

// ─── SCENE INJECT ──────────────────────────────────────────

/**
 * Injects a character DNA into an existing scene prompt.
 * Used by scene-prompt-service when a show has a pinned character.
 *
 * @param scenePrompt   - existing scene prompt from script worker
 * @param dnaString     - character DNA to inject
 * @param role          - "foreground" | "background" (affects weight)
 */
export function injectCharacterIntoScene(
  scenePrompt: string,
  dnaString: string,
  role: "foreground" | "background" = "foreground",
): string {
  const result = buildCharacterPrompt(dnaString);
  if (result.resolvedCount === 0) return scenePrompt;

  // Extract just the character-specific parts (without quality suffix)
  const characterParts = result.prompt
    .replace(`, ${QUALITY_SUFFIX}`, "")
    .replace(QUALITY_SUFFIX, "");

  if (role === "foreground") {
    // Character description first, then scene
    return `${characterParts}, ${scenePrompt}`;
  } else {
    // Scene first, character in background
    return `${scenePrompt}, ${characterParts} in the background`;
  }
}
