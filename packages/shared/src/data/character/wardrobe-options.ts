import type { CatalogItem, ColorCatalogItem } from "../../types/character-room.types";

// ─── TOP STYLES (TS001–TS012) ──────────────────────────────
export const TOP_STYLES: readonly CatalogItem[] = [
  {
    code: "TS001",
    visual: { label: { ar: "تيشيرت", en: "T-Shirt" }, svg: "/icons/character/wardrobe/ts001.svg" },
    ai: { prompt: "casual t-shirt top, comfortable cotton crew neck, everyday basic tee" },
  },
  {
    code: "TS002",
    visual: { label: { ar: "قميص بأزرار", en: "Button-Up" }, svg: "/icons/character/wardrobe/ts002.svg" },
    ai: { prompt: "button-up shirt, collared formal blouse with buttons down front, smart casual top" },
  },
  {
    code: "TS003",
    visual: { label: { ar: "هودي", en: "Hoodie" }, svg: "/icons/character/wardrobe/ts003.svg" },
    ai: { prompt: "hooded sweatshirt hoodie, casual pullover with drawstring hood, relaxed sporty top" },
  },
  {
    code: "TS004",
    visual: { label: { ar: "جاكيت", en: "Jacket" }, svg: "/icons/character/wardrobe/ts004.svg" },
    ai: { prompt: "jacket top, zip-up or button outerwear layer, casual structured jacket" },
  },
  {
    code: "TS005",
    visual: { label: { ar: "بليزر", en: "Blazer" }, svg: "/icons/character/wardrobe/ts005.svg" },
    ai: { prompt: "blazer jacket, tailored formal suit jacket, professional structured outerwear" },
  },
  {
    code: "TS006",
    visual: { label: { ar: "قميص بلا أكمام", en: "Tank Top" }, svg: "/icons/character/wardrobe/ts006.svg" },
    ai: { prompt: "tank top sleeveless shirt, thin strap casual top, warm weather basic" },
  },
  {
    code: "TS007",
    visual: { label: { ar: "توب قصير", en: "Crop Top" }, svg: "/icons/character/wardrobe/ts007.svg" },
    ai: { prompt: "crop top short shirt, midriff-baring casual top, trendy modern style" },
  },
  {
    code: "TS008",
    visual: { label: { ar: "سترة صوفية", en: "Sweater" }, svg: "/icons/character/wardrobe/ts008.svg" },
    ai: { prompt: "knitted sweater, cozy wool pullover, warm winter knit top" },
  },
  {
    code: "TS009",
    visual: { label: { ar: "معطف", en: "Coat" }, svg: "/icons/character/wardrobe/ts009.svg" },
    ai: { prompt: "long overcoat, heavy winter outerwear, elegant formal coat" },
  },
  {
    code: "TS010",
    visual: { label: { ar: "عباءة", en: "Robe" }, svg: "/icons/character/wardrobe/ts010.svg" },
    ai: { prompt: "flowing robe garment, loose draped outerwear, traditional or loungewear style" },
  },
  {
    code: "TS011",
    visual: { label: { ar: "درع", en: "Armor" }, svg: "/icons/character/wardrobe/ts011.svg" },
    ai: { prompt: "metal armor chest plate, protective battle gear, medieval or fantasy warrior armor" },
  },
  {
    code: "TS012",
    visual: { label: { ar: "عباءة", en: "Cape" }, svg: "/icons/character/wardrobe/ts012.svg" },
    ai: { prompt: "flowing cape draped over shoulders, dramatic cloak garment, heroic or mysterious style" },
  },
] as const;

// ─── BOTTOM STYLES (BS001–BS008) ───────────────────────────
export const BOTTOM_STYLES: readonly CatalogItem[] = [
  {
    code: "BS001",
    visual: { label: { ar: "جينز", en: "Jeans" }, svg: "/icons/character/wardrobe/bs001.svg" },
    ai: { prompt: "denim jeans pants, casual blue jean trousers, classic five-pocket style" },
  },
  {
    code: "BS002",
    visual: { label: { ar: "بنطلون", en: "Trousers" }, svg: "/icons/character/wardrobe/bs002.svg" },
    ai: { prompt: "formal trousers, tailored dress pants, professional straight-leg style" },
  },
  {
    code: "BS003",
    visual: { label: { ar: "شورت", en: "Shorts" }, svg: "/icons/character/wardrobe/bs003.svg" },
    ai: { prompt: "casual shorts, above-knee short pants, summer relaxed style" },
  },
  {
    code: "BS004",
    visual: { label: { ar: "تنورة", en: "Skirt" }, svg: "/icons/character/wardrobe/bs004.svg" },
    ai: { prompt: "midi skirt knee-length, feminine flowing skirt, elegant A-line silhouette" },
  },
  {
    code: "BS005",
    visual: { label: { ar: "تنورة قصيرة", en: "Mini Skirt" }, svg: "/icons/character/wardrobe/bs005.svg" },
    ai: { prompt: "mini skirt short, above-knee feminine skirt, trendy youthful style" },
  },
  {
    code: "BS006",
    visual: { label: { ar: "بنطلون رسمي", en: "Dress Pants" }, svg: "/icons/character/wardrobe/bs006.svg" },
    ai: { prompt: "elegant dress pants, formal tailored trousers, business professional style" },
  },
  {
    code: "BS007",
    visual: { label: { ar: "ليقنز", en: "Leggings" }, svg: "/icons/character/wardrobe/bs007.svg" },
    ai: { prompt: "fitted leggings, stretchy tight pants, athletic or casual slim fit" },
  },
  {
    code: "BS008",
    visual: { label: { ar: "فستان طويل", en: "Long Dress" }, svg: "/icons/character/wardrobe/bs008.svg" },
    ai: { prompt: "full length dress gown, elegant long dress covering legs, formal or casual maxi dress" },
  },
] as const;

// ─── OUTFIT STYLE (OS001–OS008) ────────────────────────────
export const OUTFIT_STYLE: readonly CatalogItem[] = [
  {
    code: "OS001",
    visual: { label: { ar: "كاجوال", en: "Casual" }, svg: "/icons/character/wardrobe/os001.svg" },
    ai: { prompt: "casual everyday outfit, relaxed comfortable clothing, simple laid-back style" },
  },
  {
    code: "OS002",
    visual: { label: { ar: "رسمي عمل", en: "Business Formal" }, svg: "/icons/character/wardrobe/os002.svg" },
    ai: { prompt: "business formal suit, professional corporate attire, executive office wear" },
  },
  {
    code: "OS003",
    visual: { label: { ar: "محارب خيالي", en: "Fantasy Warrior" }, svg: "/icons/character/wardrobe/os003.svg" },
    ai: { prompt: "fantasy warrior outfit, medieval battle gear, leather and metal armor elements" },
  },
  {
    code: "OS004",
    visual: { label: { ar: "بلاط ملكي", en: "Royal Court" }, svg: "/icons/character/wardrobe/os004.svg" },
    ai: { prompt: "royal court attire, noble aristocratic clothing, luxurious medieval or renaissance gown or tunic" },
  },
  {
    code: "OS005",
    visual: { label: { ar: "نينجا/خفي", en: "Ninja/Stealth" }, svg: "/icons/character/wardrobe/os005.svg" },
    ai: { prompt: "ninja stealth outfit, dark covert clothing, Japanese martial arts attire, hidden face wrap" },
  },
  {
    code: "OS006",
    visual: { label: { ar: "خيال علمي", en: "Sci-Fi" }, svg: "/icons/character/wardrobe/os006.svg" },
    ai: { prompt: "futuristic sci-fi outfit, advanced technology clothing, sleek metallic or neon accented suit" },
  },
  {
    code: "OS007",
    visual: { label: { ar: "ستريتوير", en: "Streetwear" }, svg: "/icons/character/wardrobe/os007.svg" },
    ai: { prompt: "urban streetwear style, trendy hip-hop fashion, oversized bold graphic modern clothing" },
  },
  {
    code: "OS008",
    visual: { label: { ar: "تقليدي/تراثي", en: "Traditional/Cultural" }, svg: "/icons/character/wardrobe/os008.svg" },
    ai: { prompt: "traditional cultural clothing, ethnic heritage attire, authentic regional costume" },
  },
] as const;

// ─── CLOTHING COLOR (CC001–CC016) ──────────────────────────
export const CLOTHING_COLOR: readonly ColorCatalogItem[] = [
  {
    code: "CC001",
    visual: { label: { ar: "أسود", en: "Black" }, svg: "/icons/character/wardrobe/cc001.svg", hex: "#1A1A1A" },
    ai: { prompt: "black clothing color, deep dark shade, classic noir fabric tone" },
  },
  {
    code: "CC002",
    visual: { label: { ar: "أبيض", en: "White" }, svg: "/icons/character/wardrobe/cc002.svg", hex: "#F5F5F5" },
    ai: { prompt: "white clothing color, clean bright fabric, pure light tone" },
  },
  {
    code: "CC003",
    visual: { label: { ar: "كحلي", en: "Navy" }, svg: "/icons/character/wardrobe/cc003.svg", hex: "#1E3A5F" },
    ai: { prompt: "navy blue clothing color, deep dark blue, professional maritime tone" },
  },
  {
    code: "CC004",
    visual: { label: { ar: "رمادي", en: "Gray" }, svg: "/icons/character/wardrobe/cc004.svg", hex: "#808080" },
    ai: { prompt: "gray clothing color, neutral mid-tone, versatile silver-grey fabric" },
  },
  {
    code: "CC005",
    visual: { label: { ar: "بيج", en: "Beige" }, svg: "/icons/character/wardrobe/cc005.svg", hex: "#E8D4C4" },
    ai: { prompt: "beige clothing color, warm tan neutral, sand or cream tone" },
  },
  {
    code: "CC006",
    visual: { label: { ar: "أحمر", en: "Red" }, svg: "/icons/character/wardrobe/cc006.svg", hex: "#DC143C" },
    ai: { prompt: "red clothing color, vibrant crimson fabric, bold passionate scarlet" },
  },
  {
    code: "CC007",
    visual: { label: { ar: "عنابي", en: "Burgundy" }, svg: "/icons/character/wardrobe/cc007.svg", hex: "#800020" },
    ai: { prompt: "burgundy clothing color, deep wine red, sophisticated dark maroon" },
  },
  {
    code: "CC008",
    visual: { label: { ar: "أخضر غابة", en: "Forest Green" }, svg: "/icons/character/wardrobe/cc008.svg", hex: "#228B22" },
    ai: { prompt: "forest green clothing color, deep natural green, rich woodland tone" },
  },
  {
    code: "CC009",
    visual: { label: { ar: "أزرق ملكي", en: "Royal Blue" }, svg: "/icons/character/wardrobe/cc009.svg", hex: "#4169E1" },
    ai: { prompt: "royal blue clothing color, vivid saturated blue, elegant bright sapphire" },
  },
  {
    code: "CC010",
    visual: { label: { ar: "خردلي", en: "Mustard" }, svg: "/icons/character/wardrobe/cc010.svg", hex: "#D4A017" },
    ai: { prompt: "mustard clothing color, warm golden yellow, retro earth tone" },
  },
  {
    code: "CC011",
    visual: { label: { ar: "بني محروق", en: "Rust" }, svg: "/icons/character/wardrobe/cc011.svg", hex: "#B7410E" },
    ai: { prompt: "rust clothing color, burnt orange-brown, autumn earthy tone" },
  },
  {
    code: "CC012",
    visual: { label: { ar: "وردي", en: "Pink" }, svg: "/icons/character/wardrobe/cc012.svg", hex: "#FF69B4" },
    ai: { prompt: "pink clothing color, bright fun fabric, playful hot pink tone" },
  },
  {
    code: "CC013",
    visual: { label: { ar: "بنفسجي", en: "Purple" }, svg: "/icons/character/wardrobe/cc013.svg", hex: "#800080" },
    ai: { prompt: "purple clothing color, rich violet fabric, royal amethyst tone" },
  },
  {
    code: "CC014",
    visual: { label: { ar: "فيروزي", en: "Teal" }, svg: "/icons/character/wardrobe/cc014.svg", hex: "#008080" },
    ai: { prompt: "teal clothing color, blue-green cyan shade, ocean-inspired tone" },
  },
  {
    code: "CC015",
    visual: { label: { ar: "بني", en: "Brown" }, svg: "/icons/character/wardrobe/cc015.svg", hex: "#8B4513" },
    ai: { prompt: "brown clothing color, warm chocolate earth tone, natural leather shade" },
  },
  {
    code: "CC016",
    visual: { label: { ar: "زيتوني", en: "Olive" }, svg: "/icons/character/wardrobe/cc016.svg", hex: "#808000" },
    ai: { prompt: "olive clothing color, muted green-brown, military or natural earth tone" },
  },
] as const;
