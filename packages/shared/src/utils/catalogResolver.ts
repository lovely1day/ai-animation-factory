// ============================================================
// CATALOG RESOLVER — Generic typed lookup
// Version: 1.0.0
// Rule: Kimi does NOT modify this file — logic only
//
// Pattern:
//   • Each catalog is a readonly array of CatalogItem (or subtype)
//   • resolve(catalog, code) → ResolvedItem | null
//   • resolveAll(catalog, codes) → ResolvedItem[]
//   • buildIndex(catalog) → fast O(1) lookup map
// ============================================================

import type {
  CatalogItem,
  ColorCatalogItem,
  EraCatalogItem,
  ResolvedItem,
  EraCode,
  Code,
  DNAObject,
} from "../types/character-room.types";

// ─── GENERIC RESOLVER ──────────────────────────────────────

/**
 * Finds a single item in any catalog array by its code.
 * Returns null if not found.
 *
 * Example:
 *   resolve(faceCatalog, "FS001")
 *   → { visual: { label: { ar: "...", en: "..." }, svg: "..." }, ai: { prompt: "..." } }
 */
export function resolve<T extends CatalogItem>(
  catalog: readonly T[],
  code: Code,
): ResolvedItem | null {
  const item = catalog.find((c) => c.code === code);
  if (!item) return null;
  return { visual: item.visual, ai: item.ai };
}

/**
 * Resolves multiple codes at once. Skips codes not found in catalog.
 */
export function resolveAll<T extends CatalogItem>(
  catalog: readonly T[],
  codes: Code[],
): ResolvedItem[] {
  return codes
    .map((code) => resolve(catalog, code))
    .filter((r): r is ResolvedItem => r !== null);
}

// ─── INDEX BUILDER ─────────────────────────────────────────

/**
 * Pre-computes a Map<Code, T> for O(1) lookups.
 * Use this when resolving many codes from the same catalog
 * (e.g. building a full character prompt from all DNA segments).
 *
 * Example:
 *   const idx = buildIndex(eyeColorCatalog);
 *   const item = idx.get("EC012");
 */
export function buildIndex<T extends CatalogItem>(
  catalog: readonly T[],
): Map<Code, T> {
  const map = new Map<Code, T>();
  for (const item of catalog) {
    map.set(item.code, item);
  }
  return map;
}

// ─── COLOR RESOLVER ────────────────────────────────────────

/**
 * Resolves a color catalog item and returns its hex value for display.
 * Returns null if not found or item has no hex.
 */
export function resolveHex(
  catalog: readonly ColorCatalogItem[],
  code: Code,
): string | null {
  const item = catalog.find((c) => c.code === code);
  return item?.visual.hex ?? null;
}

// ─── ERA RESOLVER ──────────────────────────────────────────

/**
 * Finds an era catalog item by EraCode.
 */
export function resolveEra(
  catalog: readonly EraCatalogItem[],
  code: EraCode,
): EraCatalogItem | null {
  return catalog.find((e) => e.code === code) ?? null;
}

/**
 * Returns the clothing prompt string for the given era + gender.
 */
export function resolveEraClothingPrompt(
  catalog: readonly EraCatalogItem[],
  code: EraCode,
  gender: "M" | "F",
): string | null {
  const era = resolveEra(catalog, code);
  if (!era) return null;
  return gender === "F" ? era.clothing.promptF : era.clothing.promptM;
}

// ─── DNA → ALL PROMPTS ─────────────────────────────────────

/**
 * Given a DNAObject and all catalogs, assembles the full AI prompt
 * string for image generation.
 *
 * catalogs param shape:
 *   {
 *     faceShape, forehead, eyeShape, eyeSize, eyeColor, irisPattern,
 *     eyebrow, noseShape, noseBridge, lipShape, chin, jaw, neck,
 *     hairStyle, hairLength, hairColor, skinTone, skinUndertone, bodyType,
 *     era
 *   }
 *
 * Each is a readonly CatalogItem[] (or ColorCatalogItem[] / EraCatalogItem[]).
 */
export interface AllCatalogs {
  faceShape:     readonly CatalogItem[];
  forehead:      readonly CatalogItem[];
  eyeShape:      readonly CatalogItem[];
  eyeSize:       readonly CatalogItem[];
  eyeColor:      readonly ColorCatalogItem[];
  irisPattern:   readonly CatalogItem[];
  eyebrow:       readonly CatalogItem[];
  noseShape:     readonly CatalogItem[];
  noseBridge:    readonly CatalogItem[];
  lipShape:      readonly CatalogItem[];
  chin:          readonly CatalogItem[];
  jaw:           readonly CatalogItem[];
  neck:          readonly CatalogItem[];
  hairStyle:     readonly CatalogItem[];
  hairLength:    readonly CatalogItem[];
  hairColor:     readonly ColorCatalogItem[];
  skinTone:      readonly CatalogItem[];
  skinUndertone: readonly CatalogItem[];
  bodyType:      readonly CatalogItem[];
  era:           readonly EraCatalogItem[];
}

/**
 * Segment key → catalog key mapping.
 */
const SEGMENT_TO_CATALOG: Partial<Record<string, keyof AllCatalogs>> = {
  FS:  "faceShape",
  FH:  "forehead",
  ES:  "eyeShape",
  EZ:  "eyeSize",
  EC:  "eyeColor",
  EP:  "irisPattern",
  EB:  "eyebrow",
  NS:  "noseShape",
  NB:  "noseBridge",
  LS:  "lipShape",
  CH:  "chin",
  JW:  "jaw",
  NK:  "neck",
  HS:  "hairStyle",
  HL:  "hairLength",
  HC:  "hairColor",
  SK:  "skinTone",
  ST:  "skinUndertone",
  BD:  "bodyType",
};

/**
 * Assembles a full AI prompt string from a DNAObject.
 * Returns an array of prompt parts (join with ", " for ComfyUI).
 */
export function resolveAllPrompts(
  dna: DNAObject,
  catalogs: AllCatalogs,
  gender: "M" | "F" = "M",
): string[] {
  const parts: string[] = [];

  // Gender prefix
  parts.push(gender === "F" ? "female character" : "male character");

  // Face + body segments
  for (const [segKey, catalogKey] of Object.entries(SEGMENT_TO_CATALOG)) {
    const code = dna.segments[segKey as keyof typeof dna.segments];
    if (!code) continue;

    const catalog = catalogs[catalogKey!] as readonly CatalogItem[];
    const item = catalog.find((c) => c.code === code);
    if (item?.ai.prompt) {
      parts.push(item.ai.prompt);
    }
  }

  // Height
  if (dna.segments.HT) {
    parts.push(`height ${dna.segments.HT}cm`);
  }

  // Era: clothing + environment
  if (dna.segments.ERA) {
    const eraItem = resolveEra(catalogs.era, dna.segments.ERA as EraCode);
    if (eraItem) {
      parts.push(eraItem.ai.prompt);
      const clothingPrompt = gender === "F"
        ? eraItem.clothing.promptF
        : eraItem.clothing.promptM;
      if (clothingPrompt) parts.push(clothingPrompt);
    }
  }

  return parts;
}
