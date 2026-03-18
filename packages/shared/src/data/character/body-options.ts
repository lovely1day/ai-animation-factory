import type { CatalogItem, BodyCatalogItem } from "../../types/character-room.types";

// ─── BODY TYPES (BD001–BD005) ──────────────────────────────
export const BODY_TYPES: readonly CatalogItem[] = [
  {
    code: "BD001",
    visual: { label: { ar: "نحيف", en: "Slim" }, svg: "/icons/character/body/bd001-slim.svg" },
    ai: { prompt: "slim lean body, low body fat, thin frame, slender physique" },
  },
  {
    code: "BD002",
    visual: { label: { ar: "رياضي", en: "Athletic" }, svg: "/icons/character/body/bd002-athletic.svg" },
    ai: { prompt: "athletic toned body, lean muscle definition, fit sporty physique" },
  },
  {
    code: "BD003",
    visual: { label: { ar: "متوسط", en: "Average" }, svg: "/icons/character/body/bd003-average.svg" },
    ai: { prompt: "average build, moderate proportions, standard body type, balanced physique" },
  },
  {
    code: "BD004",
    visual: { label: { ar: "ضخم رياضي", en: "Muscular" }, svg: "/icons/character/body/bd004-muscular.svg" },
    ai: { prompt: "muscular bulky body, large muscle mass, powerful strong physique, bodybuilder type" },
  },
  {
    code: "BD005",
    visual: { label: { ar: "بدين", en: "Heavy" }, svg: "/icons/character/body/bd005-heavy.svg" },
    ai: { prompt: "heavy set body, fuller rounded figure, plus size physique, substantial build" },
  },
] as const;

// ─── MALE CHEST (MC001–MC004) ──────────────────────────────
export const MALE_CHEST: readonly BodyCatalogItem[] = [
  {
    code: "MC001",
    visual: { label: { ar: "مسطح", en: "Flat" }, svg: "/icons/character/body/mc001.svg" },
    ai: { prompt: "flat chest, minimal pectoral definition, smooth chest area" },
    gender: "M",
    segment: "chest",
  },
  {
    code: "MC002",
    visual: { label: { ar: "متوسط", en: "Defined" }, svg: "/icons/character/body/mc002.svg" },
    ai: { prompt: "moderately defined chest muscles, visible pectorals, athletic chest" },
    gender: "M",
    segment: "chest",
  },
  {
    code: "MC003",
    visual: { label: { ar: "عضلي", en: "Muscular" }, svg: "/icons/character/body/mc003.svg" },
    ai: { prompt: "muscular chest, prominent pectorals, well-developed chest muscles" },
    gender: "M",
    segment: "chest",
  },
  {
    code: "MC004",
    visual: { label: { ar: "ضخم", en: "Massive" }, svg: "/icons/character/body/mc004.svg" },
    ai: { prompt: "massive chest, heavily developed pectorals, extreme chest muscle size" },
    gender: "M",
    segment: "chest",
  },
] as const;

// ─── MALE MUSCLE (MM001–MM004) ─────────────────────────────
export const MALE_MUSCLE: readonly BodyCatalogItem[] = [
  {
    code: "MM001",
    visual: { label: { ar: "لا عضلات", en: "None" }, svg: "/icons/character/body/mm001.svg" },
    ai: { prompt: "no visible muscle definition, soft body, smooth untoned physique" },
    gender: "M",
    segment: "muscle",
  },
  {
    code: "MM002",
    visual: { label: { ar: "خفيف", en: "Slight" }, svg: "/icons/character/body/mm002.svg" },
    ai: { prompt: "slight muscle tone, lean defined, subtle muscle contours, wiry physique" },
    gender: "M",
    segment: "muscle",
  },
  {
    code: "MM003",
    visual: { label: { ar: "واضح", en: "Defined" }, svg: "/icons/character/body/mm003.svg" },
    ai: { prompt: "clearly visible muscles, athletic build, defined musculature, toned physique" },
    gender: "M",
    segment: "muscle",
  },
  {
    code: "MM004",
    visual: { label: { ar: "بدي بيلدر", en: "Bodybuilder" }, svg: "/icons/character/body/mm004.svg" },
    ai: { prompt: "extreme muscle mass, bodybuilder physique, highly developed muscles, competition level" },
    gender: "M",
    segment: "muscle",
  },
] as const;

// ─── MALE ABS (MA001–MA003) ────────────────────────────────
export const MALE_ABS: readonly BodyCatalogItem[] = [
  {
    code: "MA001",
    visual: { label: { ar: "لا يظهر", en: "None" }, svg: "/icons/character/body/ma001.svg" },
    ai: { prompt: "no visible abdominal definition, smooth stomach, flat undefined abs" },
    gender: "M",
    segment: "abs",
  },
  {
    code: "MA002",
    visual: { label: { ar: "خفيف", en: "Light Six-pack" }, svg: "/icons/character/body/ma002.svg" },
    ai: { prompt: "lightly visible six-pack abs, subtle abdominal definition, beginning abs showing" },
    gender: "M",
    segment: "abs",
  },
  {
    code: "MA003",
    visual: { label: { ar: "بارز", en: "Chiseled" }, svg: "/icons/character/body/ma003.svg" },
    ai: { prompt: "chiseled prominent six-pack abs, deeply defined abdominals, washboard stomach" },
    gender: "M",
    segment: "abs",
  },
] as const;

// ─── FEMALE BREAST (FB001–FB003) ───────────────────────────
export const FEMALE_BREAST: readonly BodyCatalogItem[] = [
  {
    code: "FB001",
    visual: { label: { ar: "صغير", en: "Small" }, svg: "/icons/character/body/fb001.svg" },
    ai: { prompt: "small bust, petite chest, modest breast size, slender upper body" },
    gender: "F",
    segment: "chest",
  },
  {
    code: "FB002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/body/fb002.svg" },
    ai: { prompt: "medium bust, natural proportions, average breast size, balanced upper body" },
    gender: "F",
    segment: "chest",
  },
  {
    code: "FB003",
    visual: { label: { ar: "كبير", en: "Large" }, svg: "/icons/character/body/fb003.svg" },
    ai: { prompt: "large bust, fuller chest, generous breast size, voluptuous upper body" },
    gender: "F",
    segment: "chest",
  },
] as const;

// ─── FEMALE HIP (FH001–FH004) ──────────────────────────────
export const FEMALE_HIP: readonly BodyCatalogItem[] = [
  {
    code: "FH001",
    visual: { label: { ar: "ضيق", en: "Narrow" }, svg: "/icons/character/body/fh001.svg" },
    ai: { prompt: "narrow hips, straight figure, slim hip width, athletic lower body" },
    gender: "F",
    segment: "hip",
  },
  {
    code: "FH002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/body/fh002.svg" },
    ai: { prompt: "medium hips, balanced proportions, average hip width, natural lower body" },
    gender: "F",
    segment: "hip",
  },
  {
    code: "FH003",
    visual: { label: { ar: "واسع", en: "Wide" }, svg: "/icons/character/body/fh003.svg" },
    ai: { prompt: "wide hips, pronounced curves, pear-shaped figure, curvy lower body" },
    gender: "F",
    segment: "hip",
  },
  {
    code: "FH004",
    visual: { label: { ar: "واسع جداً", en: "Very Wide" }, svg: "/icons/character/body/fh004.svg" },
    ai: { prompt: "very wide hips, dramatic hourglass, extreme curves, voluptuous lower body" },
    gender: "F",
    segment: "hip",
  },
] as const;

// ─── FEMALE BUTT (FBT001–FBT003) ───────────────────────────
export const FEMALE_BUTT: readonly BodyCatalogItem[] = [
  {
    code: "FBT001",
    visual: { label: { ar: "مسطح", en: "Flat" }, svg: "/icons/character/body/fbt001.svg" },
    ai: { prompt: "flat minimal buttocks, small rear, understated gluteal area, slim profile" },
    gender: "F",
    segment: "butt",
  },
  {
    code: "FBT002",
    visual: { label: { ar: "مستدير", en: "Round" }, svg: "/icons/character/body/fbt002.svg" },
    ai: { prompt: "round naturally shaped buttocks, balanced gluteal area, feminine curves" },
    gender: "F",
    segment: "butt",
  },
  {
    code: "FBT003",
    visual: { label: { ar: "بارز", en: "Full" }, svg: "/icons/character/body/fbt003.svg" },
    ai: { prompt: "full prominent buttocks, curvaceous rear, voluptuous gluteal area" },
    gender: "F",
    segment: "butt",
  },
] as const;
