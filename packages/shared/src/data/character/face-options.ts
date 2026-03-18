import type { CatalogItem } from "../../types/character-room.types";

// ─── FACE SHAPES (FS001–FS007) ─────────────────────────────
export const FACE_SHAPES: readonly CatalogItem[] = [
  {
    code: "FS001",
    visual: { label: { ar: "بيضاوي", en: "Oval" }, svg: "/icons/character/faces/fs001-oval.svg" },
    ai: { prompt: "oval face shape, balanced proportions, gently curved jawline, slightly wider forehead than chin" },
  },
  {
    code: "FS002",
    visual: { label: { ar: "مستدير", en: "Round" }, svg: "/icons/character/faces/fs002-round.svg" },
    ai: { prompt: "round face shape, soft curved edges, full cheeks, rounded jawline, equal width and length" },
  },
  {
    code: "FS003",
    visual: { label: { ar: "مربع", en: "Square" }, svg: "/icons/character/faces/fs003-square.svg" },
    ai: { prompt: "square face shape, strong angular jawline, broad forehead, sharp defined edges, equal width throughout" },
  },
  {
    code: "FS004",
    visual: { label: { ar: "قلب", en: "Heart" }, svg: "/icons/character/faces/fs004-heart.svg" },
    ai: { prompt: "heart-shaped face, wide forehead, narrow pointed chin, high cheekbones, tapered lower face" },
  },
  {
    code: "FS005",
    visual: { label: { ar: "ماسة", en: "Diamond" }, svg: "/icons/character/faces/fs005-diamond.svg" },
    ai: { prompt: "diamond face shape, narrow forehead and chin, wide prominent cheekbones, angular elegant structure" },
  },
  {
    code: "FS006",
    visual: { label: { ar: "مستطيل", en: "Rectangle" }, svg: "/icons/character/faces/fs006-rectangle.svg" },
    ai: { prompt: "rectangular face shape, longer than wide, straight jawline, broad forehead, angular structured appearance" },
  },
  {
    code: "FS007",
    visual: { label: { ar: "مثلث", en: "Triangle" }, svg: "/icons/character/faces/fs007-triangle.svg" },
    ai: { prompt: "triangle face shape, narrow forehead, wide jawline, broad chin, tapered upper face" },
  },
] as const;

// ─── FOREHEAD TYPES (FH001–FH006) ──────────────────────────
export const FOREHEAD_TYPES: readonly CatalogItem[] = [
  {
    code: "FH001",
    visual: { label: { ar: "عريض وعالٍ", en: "Wide & High" }, svg: "/icons/character/forehead/fh001-wide-high.svg" },
    ai: { prompt: "wide and high forehead, prominent upper face area, broad temples, expansive brow region" },
  },
  {
    code: "FH002",
    visual: { label: { ar: "ضيق", en: "Narrow" }, svg: "/icons/character/forehead/fh002-narrow.svg" },
    ai: { prompt: "narrow forehead, close-set temples, constricted upper face width, streamlined brow area" },
  },
  {
    code: "FH003",
    visual: { label: { ar: "مستقيم", en: "Straight" }, svg: "/icons/character/forehead/fh003-straight.svg" },
    ai: { prompt: "straight forehead, flat even hairline, level brow ridge, horizontal upper face contour" },
  },
  {
    code: "FH004",
    visual: { label: { ar: "مائل", en: "Sloped" }, svg: "/icons/character/forehead/fh004-sloped.svg" },
    ai: { prompt: "sloped forehead, angled backward from brows to hairline, receding frontal plane, inclined upper face" },
  },
  {
    code: "FH005",
    visual: { label: { ar: "بارز", en: "Prominent" }, svg: "/icons/character/forehead/fh005-prominent.svg" },
    ai: { prompt: "prominent forehead, bulging frontal bone, protruding brow area, noticeable forward projection" },
  },
  {
    code: "FH006",
    visual: { label: { ar: "مسطح", en: "Flat" }, svg: "/icons/character/forehead/fh006-flat.svg" },
    ai: { prompt: "flat forehead, minimal curvature, smooth frontal plane, understated brow projection" },
  },
] as const;
