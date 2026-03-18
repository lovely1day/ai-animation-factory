import type { CatalogItem } from "../../types/character-room.types";

// ─── CHIN SHAPES (CH001–CH007) ─────────────────────────────
export const CHIN_SHAPES: readonly CatalogItem[] = [
  {
    code: "CH001",
    visual: { label: { ar: "مدبب", en: "Pointed" }, svg: "/icons/character/chin/ch001-pointed.svg" },
    ai: { prompt: "pointed narrow chin, sharp defined tip, tapered lower face, V-shaped chin" },
  },
  {
    code: "CH002",
    visual: { label: { ar: "مستدير", en: "Round" }, svg: "/icons/character/chin/ch002-round.svg" },
    ai: { prompt: "round soft chin, gentle curved tip, circular chin shape, smooth lower face contour" },
  },
  {
    code: "CH003",
    visual: { label: { ar: "مربع", en: "Square" }, svg: "/icons/character/chin/ch003-square.svg" },
    ai: { prompt: "square chin, flat broad base, angular chin structure, defined lower jaw corners" },
  },
  {
    code: "CH004",
    visual: { label: { ar: "مشقوق", en: "Cleft" }, svg: "/icons/character/chin/ch004-cleft.svg" },
    ai: { prompt: "cleft chin, vertical dimple groove center, butt chin, indented chin tip" },
  },
  {
    code: "CH005",
    visual: { label: { ar: "بارز", en: "Prominent" }, svg: "/icons/character/chin/ch005-prominent.svg" },
    ai: { prompt: "prominent projecting chin, strong forward profile, jutting lower face, pronounced chin" },
  },
  {
    code: "CH006",
    visual: { label: { ar: "متراجع", en: "Receding" }, svg: "/icons/character/chin/ch006-receding.svg" },
    ai: { prompt: "receding weak chin, slopes backward, set back jaw, indistinct lower face profile" },
  },
  {
    code: "CH007",
    visual: { label: { ar: "عريض", en: "Wide" }, svg: "/icons/character/chin/ch007-wide.svg" },
    ai: { prompt: "wide chin, broad base, strong lower face, expansive chin width" },
  },
] as const;

// ─── JAW TYPES (JW001–JW006) ───────────────────────────────
export const JAW_TYPES: readonly CatalogItem[] = [
  {
    code: "JW001",
    visual: { label: { ar: "ناعم", en: "Soft" }, svg: "/icons/character/jaw/jw001-soft.svg" },
    ai: { prompt: "soft gentle jawline, subtle definition, rounded lower face edges, delicate jaw contour" },
  },
  {
    code: "JW002",
    visual: { label: { ar: "محدد", en: "Defined" }, svg: "/icons/character/jaw/jw002-defined.svg" },
    ai: { prompt: "well-defined sharp jawline, clear edges, distinct lower face contour, precise jaw structure" },
  },
  {
    code: "JW003",
    visual: { label: { ar: "مربع", en: "Square" }, svg: "/icons/character/jaw/jw003-square.svg" },
    ai: { prompt: "square strong jawline, angular masculine, broad lower face width, prominent jaw angles" },
  },
  {
    code: "JW004",
    visual: { label: { ar: "ضيق", en: "Narrow" }, svg: "/icons/character/jaw/jw004-narrow.svg" },
    ai: { prompt: "narrow tapered jawline, slim lower face, V-shaped jaw contour, refined narrow chin area" },
  },
  {
    code: "JW005",
    visual: { label: { ar: "واسع", en: "Wide" }, svg: "/icons/character/jaw/jw005-wide.svg" },
    ai: { prompt: "wide broad jawline, strong facial width, expansive lower face, prominent wide mandible" },
  },
  {
    code: "JW006",
    visual: { label: { ar: "بارز", en: "Chiseled" }, svg: "/icons/character/jaw/jw006-chiseled.svg" },
    ai: { prompt: "chiseled prominent jaw, very defined structure, sculpted mandible, sharp angular jaw edges" },
  },
] as const;

// ─── NECK TYPES (NK001–NK006) ──────────────────────────────
export const NECK_TYPES: readonly CatalogItem[] = [
  {
    code: "NK001",
    visual: { label: { ar: "رفيع", en: "Slim" }, svg: "/icons/character/neck/nk001-slim.svg" },
    ai: { prompt: "slim slender neck, elegant narrow profile, graceful thin neck structure, delicate throat" },
  },
  {
    code: "NK002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/neck/nk002-medium.svg" },
    ai: { prompt: "medium average neck width and length, balanced neck proportions, standard throat structure" },
  },
  {
    code: "NK003",
    visual: { label: { ar: "قصير", en: "Short" }, svg: "/icons/character/neck/nk003-short.svg" },
    ai: { prompt: "short neck, close to shoulders, compact neck length, minimal throat visible" },
  },
  {
    code: "NK004",
    visual: { label: { ar: "طويل", en: "Long" }, svg: "/icons/character/neck/nk004-long.svg" },
    ai: { prompt: "long elegant neck, elongated graceful, swan-like neck structure, extended throat" },
  },
  {
    code: "NK005",
    visual: { label: { ar: "عريض", en: "Thick" }, svg: "/icons/character/neck/nk005-thick.svg" },
    ai: { prompt: "thick wide neck, strong build, substantial neck girth, powerful throat structure" },
  },
  {
    code: "NK006",
    visual: { label: { ar: "رياضي", en: "Athletic" }, svg: "/icons/character/neck/nk006-athletic.svg" },
    ai: { prompt: "athletic muscular neck, strong defined, visible neck muscles, powerful athletic build" },
  },
] as const;
