import type { CatalogItem } from "../../types/character-room.types";

// ─── NOSE SHAPES (NS001–NS009) ─────────────────────────────
export const NOSE_SHAPES: readonly CatalogItem[] = [
  {
    code: "NS001",
    visual: { label: { ar: "مستقيم", en: "Straight" }, svg: "/icons/character/nose/ns001-straight.svg" },
    ai: { prompt: "straight nose bridge, balanced proportions, even nasal profile" },
  },
  {
    code: "NS002",
    visual: { label: { ar: "أفطس", en: "Button" }, svg: "/icons/character/nose/ns002-button.svg" },
    ai: { prompt: "small button nose, rounded tip, soft upturned, cute petite nasal structure" },
  },
  {
    code: "NS003",
    visual: { label: { ar: "منحوت", en: "Sculpted" }, svg: "/icons/character/nose/ns003-sculpted.svg" },
    ai: { prompt: "sculpted defined nose, sharp refined edges, precisely carved nasal structure" },
  },
  {
    code: "NS004",
    visual: { label: { ar: "محدب", en: "Aquiline" }, svg: "/icons/character/nose/ns004-aquiline.svg" },
    ai: { prompt: "aquiline hook nose, convex bridge profile, prominent curved nasal shape" },
  },
  {
    code: "NS005",
    visual: { label: { ar: "دقيق", en: "Delicate" }, svg: "/icons/character/nose/ns005-delicate.svg" },
    ai: { prompt: "delicate narrow nose, refined thin structure, elegant slim nasal form" },
  },
  {
    code: "NS006",
    visual: { label: { ar: "عريض", en: "Wide" }, svg: "/icons/character/nose/ns006-wide.svg" },
    ai: { prompt: "wide broad nose, flared nostrils, expanded nasal bridge, prominent width" },
  },
  {
    code: "NS007",
    visual: { label: { ar: "مرفوع", en: "Upturned" }, svg: "/icons/character/nose/ns007-upturned.svg" },
    ai: { prompt: "upturned nose tip, slightly retrousse, elevated nasal tip, perky nose shape" },
  },
  {
    code: "NS008",
    visual: { label: { ar: "كبير", en: "Large" }, svg: "/icons/character/nose/ns008-large.svg" },
    ai: { prompt: "large prominent nose, strong bold structure, commanding nasal presence" },
  },
  {
    code: "NS009",
    visual: { label: { ar: "يوناني", en: "Greek" }, svg: "/icons/character/nose/ns009-greek.svg" },
    ai: { prompt: "Greek nose, perfectly straight continuous brow line, ideal classical proportions" },
  },
] as const;

// ─── NOSE BRIDGES (NB001–NB003) ────────────────────────────
export const NOSE_BRIDGES: readonly CatalogItem[] = [
  {
    code: "NB001",
    visual: { label: { ar: "عالي", en: "High" }, svg: "/icons/character/nose/nb001-high.svg" },
    ai: { prompt: "high prominent nose bridge, elevated nasal dorsum, defined nasal ridge" },
  },
  {
    code: "NB002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/nose/nb002-medium.svg" },
    ai: { prompt: "medium height nose bridge, average nasal dorsum, balanced nasal ridge" },
  },
  {
    code: "NB003",
    visual: { label: { ar: "منخفض", en: "Low" }, svg: "/icons/character/nose/nb003-low.svg" },
    ai: { prompt: "low flat nose bridge, shallow nasal dorsum, subtle nasal ridge" },
  },
] as const;

// ─── LIP SHAPES (LS001–LS008) ──────────────────────────────
export const LIP_SHAPES: readonly CatalogItem[] = [
  {
    code: "LS001",
    visual: { label: { ar: "رفيع", en: "Thin" }, svg: "/icons/character/lips/ls001-thin.svg" },
    ai: { prompt: "thin lips, subtle minimal volume, narrow lip line, understated mouth" },
  },
  {
    code: "LS002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/lips/ls002-medium.svg" },
    ai: { prompt: "medium lips, natural balanced volume, average lip fullness, harmonious mouth" },
  },
  {
    code: "LS003",
    visual: { label: { ar: "ممتلئ", en: "Full" }, svg: "/icons/character/lips/ls003-full.svg" },
    ai: { prompt: "full plump lips, generous volume, voluptuous mouth, prominent lip fullness" },
  },
  {
    code: "LS004",
    visual: { label: { ar: "كيوبيد", en: "Cupid's Bow" }, svg: "/icons/character/lips/ls004-cupids-bow.svg" },
    ai: { prompt: "defined cupid's bow, heart-shaped upper lip, pronounced philtrum peaks, sculpted lip contour" },
  },
  {
    code: "LS005",
    visual: { label: { ar: "مستقيم", en: "Straight" }, svg: "/icons/character/lips/ls005-straight.svg" },
    ai: { prompt: "straight even lips, flat lip line, horizontal mouth shape, minimal curve" },
  },
  {
    code: "LS006",
    visual: { label: { ar: "منحدر", en: "Asymmetric Droop" }, svg: "/icons/character/lips/ls006-asymmetric-droop.svg" },
    ai: { prompt: "slightly asymmetric lips, one side lower than other, uneven mouth corners" },
  },
  {
    code: "LS007",
    visual: { label: { ar: "مقلوب", en: "Inverted" }, svg: "/icons/character/lips/ls007-inverted.svg" },
    ai: { prompt: "inverted lips, downturned corners, sad mouth expression, lower lip curves downward" },
  },
  {
    code: "LS008",
    visual: { label: { ar: "ضخم جداً", en: "Extra Full" }, svg: "/icons/character/lips/ls008-extra-full.svg" },
    ai: { prompt: "extra full oversized lips, very pronounced volume, dramatically large mouth, prominent pout" },
  },
] as const;
