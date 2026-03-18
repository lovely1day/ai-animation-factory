import type { ColorCatalogItem } from "../../types/character-room.types";

// ─── SKIN TONES (SK001–SK006) — Fitzpatrick Scale ──────────
export const SKIN_TONES: readonly ColorCatalogItem[] = [
  {
    code: "SK001",
    visual: { label: { ar: "فاتح جداً", en: "Very Light" }, svg: "/icons/character/skin/sk001.svg", hex: "#FDDBB4" },
    ai: { prompt: "very light skin tone, Fitzpatrick type I, pale ivory complexion" },
  },
  {
    code: "SK002",
    visual: { label: { ar: "فاتح", en: "Light" }, svg: "/icons/character/skin/sk002.svg", hex: "#F1C27D" },
    ai: { prompt: "light skin tone, Fitzpatrick type II, fair beige complexion" },
  },
  {
    code: "SK003",
    visual: { label: { ar: "متوسط فاتح", en: "Medium Light" }, svg: "/icons/character/skin/sk003.svg", hex: "#C68642" },
    ai: { prompt: "medium light skin tone, Fitzpatrick type III, olive tan complexion" },
  },
  {
    code: "SK004",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/skin/sk004.svg", hex: "#8D5524" },
    ai: { prompt: "medium skin tone, Fitzpatrick type IV, caramel brown complexion" },
  },
  {
    code: "SK005",
    visual: { label: { ar: "بني", en: "Brown" }, svg: "/icons/character/skin/sk005.svg", hex: "#5C3317" },
    ai: { prompt: "brown skin tone, Fitzpatrick type V, deep brown complexion" },
  },
  {
    code: "SK006",
    visual: { label: { ar: "داكن", en: "Dark" }, svg: "/icons/character/skin/sk006.svg", hex: "#2C1810" },
    ai: { prompt: "dark skin tone, Fitzpatrick type VI, rich dark ebony complexion" },
  },
] as const;

// ─── SKIN UNDERTONES (ST001–ST004) ─────────────────────────
export const SKIN_UNDERTONES: readonly ColorCatalogItem[] = [
  {
    code: "ST001",
    visual: { label: { ar: "بارد", en: "Cool" }, svg: "/icons/character/skin/st001.svg", hex: "#E8D5D5" },
    ai: { prompt: "cool pink-red skin undertone, rosy complexion base, bluish undertone" },
  },
  {
    code: "ST002",
    visual: { label: { ar: "دافئ", en: "Warm" }, svg: "/icons/character/skin/st002.svg", hex: "#F5E6C0" },
    ai: { prompt: "warm golden-yellow skin undertone, peachy golden complexion base, yellow undertone" },
  },
  {
    code: "ST003",
    visual: { label: { ar: "محايد", en: "Neutral" }, svg: "/icons/character/skin/st003.svg", hex: "#EDD5B0" },
    ai: { prompt: "neutral balanced skin undertone, neither warm nor cool, beige complexion base" },
  },
  {
    code: "ST004",
    visual: { label: { ar: "زيتوني", en: "Olive" }, svg: "/icons/character/skin/st004.svg", hex: "#C8B87A" },
    ai: { prompt: "olive greenish skin undertone, green-tinted complexion base, Mediterranean undertone" },
  },
] as const;
