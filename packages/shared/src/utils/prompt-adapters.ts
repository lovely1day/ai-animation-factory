// ============================================================
// MULTI-PLATFORM PROMPT ADAPTERS
// Same Character DNA → ComfyUI / Midjourney / Gemini / DALL-E / ChatGPT / Grok / SD
// Ported from feelthemusic.app — canonical source for all projects
// ============================================================

import type { CharacterBuilderSegments } from "../types/character-room.types";
import { buildIndex, resolveEra } from "./catalogResolver";

import {
  FACE_SHAPES, FOREHEAD_TYPES,
  EYE_SHAPES, EYE_SIZES, EYE_COLORS, IRIS_PATTERNS, EYEBROW_SHAPES,
  NOSE_SHAPES, NOSE_BRIDGES, LIP_SHAPES, CHIN_SHAPES, JAW_TYPES, NECK_TYPES,
  HAIR_STYLES, HAIR_LENGTHS, HAIR_COLORS,
  SKIN_TONES, SKIN_UNDERTONES, BODY_TYPES,
  LIPSTICK_STYLES, LIPSTICK_COLORS, EYE_SHADOW, EYE_LINER, BLUSH,
  TOP_STYLES, BOTTOM_STYLES, OUTFIT_STYLE, CLOTHING_COLOR,
  ERA_CATALOG,
} from "../data/character/index";

// ── Catalog lookup ───────────────────────────────────────────
import type { CatalogItem } from "../types/character-room.types";

const SEGMENT_CATALOGS: Record<string, readonly CatalogItem[]> = {
  FS: FACE_SHAPES, FH: FOREHEAD_TYPES,
  ES: EYE_SHAPES, EZ: EYE_SIZES, EC: EYE_COLORS, EP: IRIS_PATTERNS, EB: EYEBROW_SHAPES,
  NS: NOSE_SHAPES, NB: NOSE_BRIDGES, LS: LIP_SHAPES,
  CH: CHIN_SHAPES, JW: JAW_TYPES, NK: NECK_TYPES,
  HS: HAIR_STYLES, HL: HAIR_LENGTHS, HC: HAIR_COLORS,
  SK: SKIN_TONES, ST: SKIN_UNDERTONES, BD: BODY_TYPES,
  LK: LIPSTICK_STYLES, LC: LIPSTICK_COLORS, EK: EYE_SHADOW, EL: EYE_LINER, BL: BLUSH,
  TS: TOP_STYLES, BS: BOTTOM_STYLES, OS: OUTFIT_STYLE, CC: CLOTHING_COLOR,
};

// ── Indexes (O(1) lookup) ────────────────────────────────────
const IDX = Object.fromEntries(
  Object.entries(SEGMENT_CATALOGS).map(([k, v]) => [k, buildIndex(v)])
) as Record<string, Map<string, CatalogItem>>;

// ── Helpers ──────────────────────────────────────────────────
function resolvePrompts(segments: CharacterBuilderSegments): string[] {
  const prompts: string[] = [];
  for (const [key, idx] of Object.entries(IDX)) {
    const code = segments[key as keyof CharacterBuilderSegments];
    if (!code) continue;
    const item = idx.get(code);
    if (item) prompts.push(item.ai.prompt);
  }
  return prompts;
}

function resolveEraInfo(segments: CharacterBuilderSegments) {
  const eraCode = segments.ERA;
  if (!eraCode) return null;
  return resolveEra(ERA_CATALOG, eraCode as any) ?? null;
}

function genderWord(segments: CharacterBuilderSegments, form: "short" | "long" = "long"): string {
  const g = segments.G;
  if (form === "short") return g === "F" ? "1woman" : "1man";
  return g === "F" ? "a woman" : "a man";
}

// ── Types ────────────────────────────────────────────────────
export interface PromptExport {
  comfyui:         { positive: string; negative: string };
  midjourney:      string;
  gemini:          string;
  dalle:           string;
  chatgpt:         string;
  grok:            string;
  stableDiffusion: string;
  card:            CharacterCard;
}

export interface CharacterCard {
  name:      string;
  gender:    string;
  era:       string;
  yearRange: string;
  features:  string[];
  dna:       string;
}

// ── Main Builder ─────────────────────────────────────────────

export function buildMultiPlatformPrompts(
  segments: CharacterBuilderSegments,
  name: string,
  dna: string
): PromptExport {
  const featurePrompts = resolvePrompts(segments);
  const era = resolveEraInfo(segments);
  const eraLabel = era?.ai.prompt ?? "";
  const eraEnv = era?.environment;

  // ── ComfyUI ──────────────────────────────────────────────
  const isMale    = segments.G !== "F";
  const genderPos = isMale ? "1man, male, masculine" : "1woman, female, feminine";
  const genderNeg = isMale
    ? "female, woman, girl, feminine, 1girl, 1woman, breasts"
    : "male, man, boy, masculine, 1man, 1boy";

  const comfyPositive = [
    "masterpiece, best quality, ultra detailed, photorealistic",
    genderPos,
    ...(eraLabel ? [eraLabel] : []),
    ...featurePrompts,
    ...(eraEnv ? [eraEnv.architecture, eraEnv.lighting] : []),
    "cinematic lighting, detailed face, sharp focus, 8k resolution",
  ].filter(Boolean).join(", ");

  const comfyNegative =
    genderNeg + ", " +
    "blurry, bad anatomy, bad hands, ugly, deformed, disfigured, low quality, " +
    "watermark, text, signature, oversaturated, extra limbs, cloned face, mutation";

  // ── Midjourney ────────────────────────────────────────────
  const mjCore = [
    eraLabel ? `${genderWord(segments)} in the ${eraLabel}` : genderWord(segments),
    ...featurePrompts.slice(0, 8),
    eraEnv?.architecture ?? "",
    "cinematic portrait, dramatic lighting, photorealistic",
  ].filter(Boolean).join(", ");

  const midjourney = `${mjCore} --ar 2:3 --style raw --v 6 --q 2`;

  // ── Gemini / Imagen ───────────────────────────────────────
  const genderNatural = segments.G === "F" ? "woman" : "man";
  const eraPhrase = eraLabel ? ` set in the ${eraLabel} (${era?.yearRange ?? ""})` : "";
  const featuresNatural = featurePrompts.slice(0, 10).join(". ") + ".";

  const gemini = [
    `A detailed, photorealistic portrait of a ${genderNatural}${eraPhrase}.`,
    featuresNatural,
    eraEnv ? `The background setting features ${eraEnv.architecture}.` : "",
    "High quality, cinematic lighting, sharp details, professional photography style.",
  ].filter(Boolean).join(" ");

  // ── DALL-E ────────────────────────────────────────────────
  const dalleFeatures = featurePrompts.slice(0, 6).join(", ");
  const dalle = [
    `Portrait of a ${genderNatural}`,
    eraLabel ? `from the ${eraLabel}` : "",
    dalleFeatures ? `with ${dalleFeatures}` : "",
    eraEnv ? `in a setting with ${eraEnv.architecture}` : "",
    "Photorealistic, high detail, cinematic lighting.",
  ].filter(Boolean).join(", ").replace(",, ", ", ");

  // ── ChatGPT (DALL-E 3 via ChatGPT) ──────────────────────
  const chatgpt = [
    `Create a highly detailed photorealistic portrait of a ${genderNatural}${eraPhrase}.`,
    `Physical appearance: ${featurePrompts.slice(0, 10).join(", ")}.`,
    eraEnv ? `Environment and setting: ${eraEnv.architecture}.` : "",
    "Style: cinematic photography, professional studio lighting, sharp focus, 8K resolution.",
    name ? `Character name: ${name}.` : "",
  ].filter(Boolean).join(" ");

  // ── Grok / Aurora ─────────────────────────────────────────
  const grok = [
    `Photorealistic portrait of a ${genderNatural}`,
    eraLabel ? `from the ${eraLabel} (${era?.yearRange ?? ""})` : "",
    featurePrompts.slice(0, 8).join(", "),
    eraEnv?.architecture ?? "",
    "cinematic lighting, ultra-detailed, professional photography",
  ].filter(Boolean).join(", ");

  // ── Stable Diffusion / SDXL ───────────────────────────────
  const stableDiffusion = [
    "score_9, score_8_up, score_7_up",
    genderWord(segments, "short"),
    ...(eraLabel ? [eraLabel] : []),
    ...featurePrompts,
    ...(eraEnv ? [eraEnv.architecture, eraEnv.lighting] : []),
    "photorealistic, masterpiece, best quality, ultra detailed",
    "cinematic lighting, RAW photo, 8k uhd, dslr, high quality",
  ].filter(Boolean).join(", ");

  // ── Character Card ────────────────────────────────────────
  const card: CharacterCard = {
    name:      name || "Unnamed Character",
    gender:    segments.G === "F" ? "Female" : "Male",
    era:       eraLabel || "—",
    yearRange: era?.yearRange ?? "—",
    features:  featurePrompts,
    dna,
  };

  return { comfyui: { positive: comfyPositive, negative: comfyNegative }, midjourney, gemini, dalle, chatgpt, grok, stableDiffusion, card };
}
