import type { CatalogItem, ColorCatalogItem } from "../../types/character-room.types";

// ─── LIPSTICK STYLES (LK001–LK008) ─────────────────────────
export const LIPSTICK_STYLES: readonly CatalogItem[] = [
  {
    code: "LK001",
    visual: { label: { ar: "بدون", en: "None" }, svg: "/icons/character/makeup/lk001.svg" },
    ai: { prompt: "no lipstick, clean natural lips, bare lip texture" },
  },
  {
    code: "LK002",
    visual: { label: { ar: "لماع طبيعي", en: "Natural Gloss" }, svg: "/icons/character/makeup/lk002.svg" },
    ai: { prompt: "natural glossy lips, subtle shine, transparent lip gloss, dewy finish" },
  },
  {
    code: "LK003",
    visual: { label: { ar: "مطفي عاري", en: "Matte Nude" }, svg: "/icons/character/makeup/lk003.svg" },
    ai: { prompt: "matte nude lipstick, flat velvety finish, neutral beige tone, opaque coverage" },
  },
  {
    code: "LK004",
    visual: { label: { ar: "أحمر جريء", en: "Bold Red" }, svg: "/icons/character/makeup/lk004.svg" },
    ai: { prompt: "bold red lipstick, classic vibrant crimson, high saturation, defined lip line" },
  },
  {
    code: "LK005",
    visual: { label: { ar: "توتي غامق", en: "Dark Berry" }, svg: "/icons/character/makeup/lk005.svg" },
    ai: { prompt: "dark berry lipstick, deep plum wine shade, rich burgundy tones, intense color" },
  },
  {
    code: "LK006",
    visual: { label: { ar: "مرجاني", en: "Coral" }, svg: "/icons/character/makeup/lk006.svg" },
    ai: { prompt: "coral lipstick, warm peachy-orange pink, bright summery shade, fresh vibrant tone" },
  },
  {
    code: "LK007",
    visual: { label: { ar: "خوخي", en: "Plum" }, svg: "/icons/character/makeup/lk007.svg" },
    ai: { prompt: "plum lipstick, deep purple-mauve shade, sophisticated cool tone, rich pigmentation" },
  },
  {
    code: "LK008",
    visual: { label: { ar: "وردي لامع", en: "Glossy Pink" }, svg: "/icons/character/makeup/lk008.svg" },
    ai: { prompt: "glossy pink lipstick, shiny bubblegum pink, wet-look finish, youthful shimmer" },
  },
] as const;

// ─── LIPSTICK COLORS (LC001–LC012) ─────────────────────────
export const LIPSTICK_COLORS: readonly ColorCatalogItem[] = [
  {
    code: "LC001",
    visual: { label: { ar: "عاري بيج", en: "Nude Beige" }, svg: "/icons/character/makeup/lc001.svg", hex: "#D4A574" },
    ai: { prompt: "nude beige lip color, warm tan flesh tone, neutral brown-pink" },
  },
  {
    code: "LC002",
    visual: { label: { ar: "وردي فاتح", en: "Rose" }, svg: "/icons/character/makeup/lc002.svg", hex: "#E8B4B8" },
    ai: { prompt: "rose pink lip color, soft dusty rose, muted romantic pink" },
  },
  {
    code: "LC003",
    visual: { label: { ar: "أحمر كلاسيكي", en: "Classic Red" }, svg: "/icons/character/makeup/lc003.svg", hex: "#C41E3A" },
    ai: { prompt: "classic red lip color, true crimson scarlet, timeless bold red" },
  },
  {
    code: "LC004",
    visual: { label: { ar: "أحمر غامق", en: "Dark Red" }, svg: "/icons/character/makeup/lc004.svg", hex: "#8B0000" },
    ai: { prompt: "dark red lip color, deep maroon crimson, vampy burgundy red" },
  },
  {
    code: "LC005",
    visual: { label: { ar: "مرجاني", en: "Coral" }, svg: "/icons/character/makeup/lc005.svg", hex: "#FF7F50" },
    ai: { prompt: "coral lip color, peachy-orange pink, warm tropical salmon shade" },
  },
  {
    code: "LC006",
    visual: { label: { ar: "توتي", en: "Berry" }, svg: "/icons/character/makeup/lc006.svg", hex: "#8B3A62" },
    ai: { prompt: "berry lip color, rich raspberry purple, deep fruity pink-purple" },
  },
  {
    code: "LC007",
    visual: { label: { ar: "برقوقي", en: "Plum" }, svg: "/icons/character/makeup/lc007.svg", hex: "#660066" },
    ai: { prompt: "plum lip color, deep purple mauve, dark violet berry tone" },
  },
  {
    code: "LC008",
    visual: { label: { ar: "نبيذي", en: "Wine" }, svg: "/icons/character/makeup/lc008.svg", hex: "#590212" },
    ai: { prompt: "wine lip color, dark red wine burgundy, rich merlot shade" },
  },
  {
    code: "LC009",
    visual: { label: { ar: "وردي", en: "Pink" }, svg: "/icons/character/makeup/lc009.svg", hex: "#FFB6C1" },
    ai: { prompt: "pink lip color, soft light pink, delicate feminine pastel" },
  },
  {
    code: "LC010",
    visual: { label: { ar: "فوشيا", en: "Hot Pink" }, svg: "/icons/character/makeup/lc010.svg", hex: "#FF1493" },
    ai: { prompt: "hot pink lip color, bright neon magenta, vibrant electric pink" },
  },
  {
    code: "LC011",
    visual: { label: { ar: "برتقالي أحمر", en: "Orange-Red" }, svg: "/icons/character/makeup/lc011.svg", hex: "#FF4500" },
    ai: { prompt: "orange-red lip color, fiery vermillion, warm red-orange blend" },
  },
  {
    code: "LC012",
    visual: { label: { ar: "بني", en: "Brown" }, svg: "/icons/character/makeup/lc012.svg", hex: "#8B4513" },
    ai: { prompt: "brown lip color, rich chocolate brown, warm earthy cocoa tone" },
  },
] as const;

// ─── EYE SHADOW (EK001–EK008) ──────────────────────────────
export const EYE_SHADOW: readonly CatalogItem[] = [
  {
    code: "EK001",
    visual: { label: { ar: "بدون", en: "None" }, svg: "/icons/character/makeup/ek001.svg" },
    ai: { prompt: "no eyeshadow, clean bare eyelids, natural skin tone on eyes" },
  },
  {
    code: "EK002",
    visual: { label: { ar: "محايد", en: "Neutral" }, svg: "/icons/character/makeup/ek002.svg" },
    ai: { prompt: "neutral eyeshadow, soft beige and brown tones, subtle everyday nude eye makeup" },
  },
  {
    code: "EK003",
    visual: { label: { ar: "مدخن", en: "Smoky" }, svg: "/icons/character/makeup/ek003.svg" },
    ai: { prompt: "smoky eyeshadow, blended gray and black tones, sultry dark gradient eye makeup" },
  },
  {
    code: "EK004",
    visual: { label: { ar: "قطع محدد", en: "Cut Crease" }, svg: "/icons/character/makeup/ek004.svg" },
    ai: { prompt: "cut crease eyeshadow, defined sharp line above crease, dramatic contrast makeup look" },
  },
  {
    code: "EK005",
    visual: { label: { ar: "لامع", en: "Glitter" }, svg: "/icons/character/makeup/ek005.svg" },
    ai: { prompt: "glitter eyeshadow, sparkling shimmer particles, festive metallic glitter on eyelids" },
  },
  {
    code: "EK006",
    visual: { label: { ar: "غروب", en: "Sunset" }, svg: "/icons/character/makeup/ek006.svg" },
    ai: { prompt: "sunset eyeshadow, warm orange pink purple gradient, golden hour inspired eye makeup" },
  },
  {
    code: "EK007",
    visual: { label: { ar: "أحادي اللون", en: "Monochrome" }, svg: "/icons/character/makeup/ek007.svg" },
    ai: { prompt: "monochrome eyeshadow, single color tone all over lid, cohesive uniform eye makeup" },
  },
  {
    code: "EK008",
    visual: { label: { ar: "جرافيكي", en: "Graphic" }, svg: "/icons/character/makeup/ek008.svg" },
    ai: { prompt: "graphic eyeshadow, bold artistic lines, geometric shapes, avant-garde eye makeup design" },
  },
] as const;

// ─── EYE LINER (EL001–EL006) ───────────────────────────────
export const EYE_LINER: readonly CatalogItem[] = [
  {
    code: "EL001",
    visual: { label: { ar: "بدون", en: "None" }, svg: "/icons/character/makeup/el001.svg" },
    ai: { prompt: "no eyeliner, clean natural lash line, bare eye contour" },
  },
  {
    code: "EL002",
    visual: { label: { ar: "قلم", en: "Pencil" }, svg: "/icons/character/makeup/el002.svg" },
    ai: { prompt: "pencil eyeliner, soft smudged line along lash line, natural defined eyes" },
  },
  {
    code: "EL003",
    visual: { label: { ar: "ممدود", en: "Winged" }, svg: "/icons/character/makeup/el003.svg" },
    ai: { prompt: "winged eyeliner, classic subtle flick at outer corner, elegant lifted eye shape" },
  },
  {
    code: "EL004",
    visual: { label: { ar: "عين القطة", en: "Cat Eye" }, svg: "/icons/character/makeup/el004.svg" },
    ai: { prompt: "cat eye eyeliner, dramatic elongated wing, sharp extended flick, bold retro look" },
  },
  {
    code: "EL005",
    visual: { label: { ar: "كحل", en: "Kohl" }, svg: "/icons/character/makeup/el005.svg" },
    ai: { prompt: "kohl eyeliner, thick dark line waterline and lash line, smudged smoky definition" },
  },
  {
    code: "EL006",
    visual: { label: { ar: "جناح مزدوج", en: "Double Wing" }, svg: "/icons/character/makeup/el006.svg" },
    ai: { prompt: "double wing eyeliner, parallel flicks upper and lower lash lines, avant-garde graphic liner" },
  },
] as const;

// ─── BLUSH (BL001–BL006) ───────────────────────────────────
export const BLUSH: readonly ColorCatalogItem[] = [
  {
    code: "BL001",
    visual: { label: { ar: "بدون", en: "None" }, svg: "/icons/character/makeup/bl001.svg", hex: "#F5C6A5" },
    ai: { prompt: "no blush, natural skin tone cheeks, clean bare cheekbones" },
  },
  {
    code: "BL002",
    visual: { label: { ar: "خوخي ناعم", en: "Soft Peach" }, svg: "/icons/character/makeup/bl002.svg", hex: "#FFCBA4" },
    ai: { prompt: "soft peach blush, warm light orange-pink, subtle healthy glow on cheekbones" },
  },
  {
    code: "BL003",
    visual: { label: { ar: "وردي", en: "Rose" }, svg: "/icons/character/makeup/bl003.svg", hex: "#E89C9C" },
    ai: { prompt: "rose blush, dusty pink flush, romantic natural rosy cheeks" },
  },
  {
    code: "BL004",
    visual: { label: { ar: "مرجاني", en: "Coral" }, svg: "/icons/character/makeup/bl004.svg", hex: "#FF7F7F" },
    ai: { prompt: "coral blush, vibrant peach-pink, bright tropical cheek color" },
  },
  {
    code: "BL005",
    visual: { label: { ar: "توتي", en: "Berry" }, svg: "/icons/character/makeup/bl005.svg", hex: "#8B3A3A" },
    ai: { prompt: "berry blush, deep raspberry pink, rich flushed winter cheek tone" },
  },
  {
    code: "BL006",
    visual: { label: { ar: "برونزي", en: "Bronzer" }, svg: "/icons/character/makeup/bl006.svg", hex: "#CD853F" },
    ai: { prompt: "bronzer blush, warm golden brown, sun-kissed contoured cheekbones" },
  },
] as const;
