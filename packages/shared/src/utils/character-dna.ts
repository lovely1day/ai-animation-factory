// ============================================================
// CHARACTER DNA — Encode / Decode / Validate / Mutate
// Version: 1.0.0
// Rule: Kimi does NOT modify this file — logic only
//
// DNA string format:
//   "v1|G:M|FS:FS001|ES:ES003|EC:EC012|HC:HC007|SK:SK003|ERA:ERA_1920"
//
//   • Header:  "v1"
//   • Pairs:   "KEY:VALUE" separated by "|"
//   • Keys:    DNASegmentKey (22 closed union values)
//   • Values:  Code strings (e.g. "FS001", "M", "170", "ERA_1920")
//   • Order:   canonical alphabetical by key for stable comparison
// ============================================================

import type {
  DNAObject,
  DNASegmentKey,
  DNAVersion,
  Code,
  CharacterBuilderSegments,
} from "../types/character-room.types";

import { DNA_KEY_ALIASES } from "../types/character-room.types";

// ─── CANONICAL KEY ORDER (32 keys — alphabetical) ─────────
const CANONICAL_ORDER: DNASegmentKey[] = [
  "BD", "BL", "BS", "CC", "CH", "EB", "EC", "EK", "EL", "EP", "ERA",
  "ES", "EZ", "FH", "FS", "G",  "GN", "HC",
  "HL", "HS", "HT", "JW", "LC", "LK", "LS", "NB",
  "NK", "NS", "OS", "SK", "ST", "TS",
];

const ALL_KEYS = new Set<string>(CANONICAL_ORDER);

// ─── ENCODE ────────────────────────────────────────────────
/**
 * Converts a DNAObject → compact DNA string.
 *
 * Example:
 *   encode({ version: "v1", segments: { G: "M", FS: "FS001" } })
 *   → "v1|FS:FS001|G:M"
 */
export function encodeDNA(dna: DNAObject): string {
  const pairs: string[] = [];

  for (const key of CANONICAL_ORDER) {
    const value = dna.segments[key];
    if (value !== undefined && value !== "") {
      pairs.push(`${key}:${value}`);
    }
  }

  return `${dna.version}|${pairs.join("|")}`;
}

// ─── DECODE ────────────────────────────────────────────────
/**
 * Parses a DNA string → DNAObject.
 * Returns null if the string is malformed.
 *
 * Example:
 *   decode("v1|G:M|FS:FS001")
 *   → { version: "v1", segments: { G: "M", FS: "FS001" } }
 */
export function decodeDNA(raw: string): DNAObject | null {
  if (!raw || typeof raw !== "string") return null;

  const parts = raw.split("|");
  if (parts.length < 1) return null;

  const version = parts[0] as DNAVersion;
  if (version !== "v1") return null;

  const segments: Partial<Record<DNASegmentKey, Code>> = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) continue;

    const key = part.slice(0, colonIdx);
    const value = part.slice(colonIdx + 1);

    // Resolve legacy key aliases (SU→ST, BT→BD, IP→EP)
    const resolvedKey = DNA_KEY_ALIASES[key] || key;

    if (ALL_KEYS.has(resolvedKey) && value.length > 0) {
      segments[resolvedKey as DNASegmentKey] = value;
    }
  }

  return { version, segments };
}

// ─── VALIDATE ──────────────────────────────────────────────
/**
 * Returns true if the DNA string is parseable and contains at least
 * the mandatory G (gender) segment.
 */
export function isValidDNA(raw: string): boolean {
  const dna = decodeDNA(raw);
  return dna !== null && dna.segments.G !== undefined;
}

// ─── SET SEGMENT ───────────────────────────────────────────
/**
 * Returns a new DNA string with the given segment set/updated.
 * Creates a minimal v1 DNA if the input is empty/invalid.
 */
export function setDNASegment(
  raw: string,
  key: DNASegmentKey,
  value: Code,
): string {
  const dna = decodeDNA(raw) ?? { version: "v1" as DNAVersion, segments: {} };
  return encodeDNA({
    version: dna.version,
    segments: { ...dna.segments, [key]: value },
  });
}

// ─── REMOVE SEGMENT ────────────────────────────────────────
/**
 * Returns a new DNA string with the given segment removed.
 */
export function removeDNASegment(raw: string, key: DNASegmentKey): string {
  const dna = decodeDNA(raw);
  if (!dna) return raw;

  const segments = { ...dna.segments };
  delete segments[key];

  return encodeDNA({ version: dna.version, segments });
}

// ─── GET SEGMENT ───────────────────────────────────────────
/**
 * Safely reads one segment value from a DNA string.
 * Returns undefined if not present or string is malformed.
 */
export function getDNASegment(
  raw: string,
  key: DNASegmentKey,
): Code | undefined {
  return decodeDNA(raw)?.segments[key];
}

// ─── SEGMENTS → DNA ────────────────────────────────────────
/**
 * Converts a CharacterBuilderSegments object (React hook state)
 * to a DNA string. Body-only keys (CHEST, MUSCLE, etc.) are excluded
 * because they are not stored in DNA.
 */
export function segmentsToDNA(segments: CharacterBuilderSegments): string {
  const dnaSegments: Partial<Record<DNASegmentKey, Code>> = {};

  for (const key of CANONICAL_ORDER) {
    const value = segments[key as keyof CharacterBuilderSegments];
    if (value !== undefined) {
      dnaSegments[key] = value as Code;
    }
  }

  return encodeDNA({ version: "v1", segments: dnaSegments });
}

// ─── DNA → SEGMENTS ────────────────────────────────────────
/**
 * Parses a DNA string into a CharacterBuilderSegments object
 * suitable for populating the React hook state.
 */
export function dnaToSegments(raw: string): CharacterBuilderSegments {
  const dna = decodeDNA(raw);
  if (!dna) return {};
  return { ...dna.segments } as CharacterBuilderSegments;
}

// ─── DIFF ───────────────────────────────────────────────────
/**
 * Returns the keys that differ between two DNA strings.
 * Useful for detecting what changed when the user edits a character.
 */
export function diffDNA(
  rawA: string,
  rawB: string,
): DNASegmentKey[] {
  const a = decodeDNA(rawA)?.segments ?? {};
  const b = decodeDNA(rawB)?.segments ?? {};
  const changed: DNASegmentKey[] = [];

  for (const key of CANONICAL_ORDER) {
    if (a[key] !== b[key]) changed.push(key);
  }

  return changed;
}
