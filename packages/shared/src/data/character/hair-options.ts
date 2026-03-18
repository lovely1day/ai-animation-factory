import type { CatalogItem, ColorCatalogItem } from "../../types/character-room.types";

// ─── HAIR STYLES (HS001–HS017) ─────────────────────────────
export const HAIR_STYLES: readonly CatalogItem[] = [
  {
    code: "HS001",
    visual: { label: { ar: "مستقيم ناعم", en: "Sleek Straight" }, svg: "/icons/character/hair/hs001-sleek-straight.svg" },
    ai: { prompt: "sleek straight hair, smooth flat strands, glossy polished hair texture" },
  },
  {
    code: "HS002",
    visual: { label: { ar: "متموج", en: "Wavy" }, svg: "/icons/character/hair/hs002-wavy.svg" },
    ai: { prompt: "wavy hair, gentle flowing waves, soft S-shaped curls, natural wave pattern" },
  },
  {
    code: "HS003",
    visual: { label: { ar: "مجعد", en: "Curly" }, svg: "/icons/character/hair/hs003-curly.svg" },
    ai: { prompt: "curly hair, defined spiral curls, bouncy ringlets, textured coil pattern" },
  },
  {
    code: "HS004",
    visual: { label: { ar: "أفرو", en: "Afro" }, svg: "/icons/character/hair/hs004-afro.svg" },
    ai: { prompt: "afro hair, voluminous natural coils, tight kinky curls, rounded full shape" },
  },
  {
    code: "HS005",
    visual: { label: { ar: "ضفائر", en: "Braids" }, svg: "/icons/character/hair/hs005-braids.svg" },
    ai: { prompt: "braided hair, cornrows or classic braids, woven plaited hairstyle" },
  },
  {
    code: "HS006",
    visual: { label: { ar: "بانك", en: "Mohawk" }, svg: "/icons/character/hair/hs006-mohawk.svg" },
    ai: { prompt: "mohawk undercut, shaved sides tall center strip, punk rock hairstyle" },
  },
  {
    code: "HS007",
    visual: { label: { ar: "محلوق كامل", en: "Shaved" }, svg: "/icons/character/hair/hs007-shaved.svg" },
    ai: { prompt: "fully shaved head, buzz cut, military style haircut, very short cropped hair" },
  },
  {
    code: "HS008",
    visual: { label: { ar: "نصف محلوق", en: "Undercut" }, svg: "/icons/character/hair/hs008-undercut.svg" },
    ai: { prompt: "undercut, short sides long top, disconnected haircut, modern edgy style" },
  },
  {
    code: "HS009",
    visual: { label: { ar: "انفجار", en: "Spiky" }, svg: "/icons/character/hair/hs009-spiky.svg" },
    ai: { prompt: "spiky hair, sharp protruding spikes, gelled pointed strands, textured upright style" },
  },
  {
    code: "HS010",
    visual: { label: { ar: "خصلات", en: "Layered" }, svg: "/icons/character/hair/hs010-layered.svg" },
    ai: { prompt: "layered hair, textured flowing layers, graduated haircut, dimensional hair style" },
  },
  {
    code: "HS011",
    visual: { label: { ar: "بوب", en: "Bob" }, svg: "/icons/character/hair/hs011-bob.svg" },
    ai: { prompt: "bob cut, chin-length blunt ends, classic bob hairstyle, even straight cut" },
  },
  {
    code: "HS012",
    visual: { label: { ar: "بانتيل", en: "Ponytail" }, svg: "/icons/character/hair/hs012-ponytail.svg" },
    ai: { prompt: "hair tied back in ponytail, gathered hair at nape, casual pulled back style" },
  },
  {
    code: "HS013",
    visual: { label: { ar: "ذيل الحصان", en: "High Ponytail" }, svg: "/icons/character/hair/hs013-high-ponytail.svg" },
    ai: { prompt: "high tight ponytail, sleek pulled back, crown of head gathered, sporty elegant style" },
  },
  {
    code: "HS014",
    visual: { label: { ar: "كنيون", en: "Curtains" }, svg: "/icons/character/hair/hs014-curtains.svg" },
    ai: { prompt: "curtain bangs, center-parted flowing, face-framing sections, middle part style" },
  },
  {
    code: "HS015",
    visual: { label: { ar: "دريدلوك", en: "Dreadlocks" }, svg: "/icons/character/hair/hs015-dreadlocks.svg" },
    ai: { prompt: "dreadlocks, thick rope-like locks, matted coiled hair, natural dread formation" },
  },
  {
    code: "HS016",
    visual: { label: { ar: "تموج بحري", en: "Beach Waves" }, svg: "/icons/character/hair/hs016-beach-waves.svg" },
    ai: { prompt: "beach waves, effortless tousled texture, sun-kissed wavy hair, relaxed messy waves" },
  },
  {
    code: "HS017",
    visual: { label: { ar: "صلعة", en: "Bald" }, svg: "/icons/character/hair/hs017-bald.svg" },
    ai: { prompt: "completely bald, smooth head, no hair, shaved scalp" },
  },
] as const;

// ─── HAIR LENGTHS (HL001–HL008) ────────────────────────────
export const HAIR_LENGTHS: readonly CatalogItem[] = [
  {
    code: "HL001",
    visual: { label: { ar: "حليق", en: "Shaved" }, svg: "/icons/character/hair/hl001-shaved.svg" },
    ai: { prompt: "shaved or bald, no hair length, bare scalp" },
  },
  {
    code: "HL002",
    visual: { label: { ar: "قصير جداً", en: "Buzz Cut" }, svg: "/icons/character/hair/hl002-buzz-cut.svg" },
    ai: { prompt: "very short buzz cut length, cropped close to scalp, military short" },
  },
  {
    code: "HL003",
    visual: { label: { ar: "قصير", en: "Short" }, svg: "/icons/character/hair/hl003-short.svg" },
    ai: { prompt: "short hair above ears, ear-length hair, cropped above shoulder" },
  },
  {
    code: "HL004",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/hair/hl004-medium.svg" },
    ai: { prompt: "medium length chin to jaw, jaw-length hair, moderate hair length" },
  },
  {
    code: "HL005",
    visual: { label: { ar: "على الكتف", en: "Shoulder" }, svg: "/icons/character/hair/hl005-shoulder.svg" },
    ai: { prompt: "shoulder length hair, touching shoulders, classic medium-long length" },
  },
  {
    code: "HL006",
    visual: { label: { ar: "طويل", en: "Long" }, svg: "/icons/character/hair/hl006-long.svg" },
    ai: { prompt: "long hair below shoulders, mid-back length, flowing lengthy hair" },
  },
  {
    code: "HL007",
    visual: { label: { ar: "طويل جداً", en: "Very Long" }, svg: "/icons/character/hair/hl007-very-long.svg" },
    ai: { prompt: "very long hair mid-back length, extended flowing hair, dramatic length" },
  },
  {
    code: "HL008",
    visual: { label: { ar: "حتى الخصر", en: "Waist Length" }, svg: "/icons/character/hair/hl008-waist-length.svg" },
    ai: { prompt: "waist length extremely long hair, floor-length potential, maximum hair length" },
  },
] as const;

// ─── HAIR COLORS (HC001–HC045) ─────────────────────────────
export const HAIR_COLORS: readonly ColorCatalogItem[] = [
  // ─── Natural Colors (HC001–HC018) ─────────────────────────
  {
    code: "HC001",
    visual: { label: { ar: "أسود غاجي", en: "Jet Black" }, svg: "/icons/character/hair/hc001.svg", hex: "#0A0A0A" },
    ai: { prompt: "jet black hair, deep black hair color, darkest black shade" },
  },
  {
    code: "HC002",
    visual: { label: { ar: "أسود", en: "Black" }, svg: "/icons/character/hair/hc002.svg", hex: "#1A1A1A" },
    ai: { prompt: "black hair, natural black hair color, deep dark hair" },
  },
  {
    code: "HC003",
    visual: { label: { ar: "بني داكن جداً", en: "Dark Espresso" }, svg: "/icons/character/hair/hc003.svg", hex: "#2C1A0E" },
    ai: { prompt: "dark espresso hair, very dark brown hair, deep coffee brown" },
  },
  {
    code: "HC004",
    visual: { label: { ar: "بني داكن", en: "Dark Brown" }, svg: "/icons/character/hair/hc004.svg", hex: "#3B1F0A" },
    ai: { prompt: "dark brown hair, rich chocolate brown, deep brunette color" },
  },
  {
    code: "HC005",
    visual: { label: { ar: "بني", en: "Brown" }, svg: "/icons/character/hair/hc005.svg", hex: "#5C3317" },
    ai: { prompt: "brown hair, medium brown hair color, classic brunette" },
  },
  {
    code: "HC006",
    visual: { label: { ar: "بني متوسط", en: "Medium Brown" }, svg: "/icons/character/hair/hc006.svg", hex: "#7B4A2D" },
    ai: { prompt: "medium brown hair, warm brown hair color, natural mid-brown" },
  },
  {
    code: "HC007",
    visual: { label: { ar: "بني فاتح", en: "Light Brown" }, svg: "/icons/character/hair/hc007.svg", hex: "#A0623A" },
    ai: { prompt: "light brown hair, soft brown hair color, warm light brunette" },
  },
  {
    code: "HC008",
    visual: { label: { ar: "بني ذهبي", en: "Golden Brown" }, svg: "/icons/character/hair/hc008.svg", hex: "#C68A3B" },
    ai: { prompt: "golden brown hair, honey brown hair color, warm golden brunette" },
  },
  {
    code: "HC009",
    visual: { label: { ar: "كستنائي", en: "Chestnut" }, svg: "/icons/character/hair/hc009.svg", hex: "#954535" },
    ai: { prompt: "chestnut hair, reddish brown hair color, warm auburn brown" },
  },
  {
    code: "HC010",
    visual: { label: { ar: "أحمر", en: "Auburn Red" }, svg: "/icons/character/hair/hc010.svg", hex: "#8B2500" },
    ai: { prompt: "auburn red hair, natural red hair color, warm reddish brown" },
  },
  {
    code: "HC011",
    visual: { label: { ar: "أحمر نحاسي", en: "Copper Red" }, svg: "/icons/character/hair/hc011.svg", hex: "#B84A1A" },
    ai: { prompt: "copper red hair, bright copper hair color, vibrant orange-red hair" },
  },
  {
    code: "HC012",
    visual: { label: { ar: "أشقر داكن", en: "Dark Blonde" }, svg: "/icons/character/hair/hc012.svg", hex: "#C8A96E" },
    ai: { prompt: "dark blonde hair, honey blonde hair color, light brownish blonde" },
  },
  {
    code: "HC013",
    visual: { label: { ar: "أشقر", en: "Blonde" }, svg: "/icons/character/hair/hc013.svg", hex: "#E8D5A3" },
    ai: { prompt: "blonde hair, golden blonde hair color, classic blonde shade" },
  },
  {
    code: "HC014",
    visual: { label: { ar: "أشقر فاتح", en: "Light Blonde" }, svg: "/icons/character/hair/hc014.svg", hex: "#F5E6C8" },
    ai: { prompt: "light blonde hair, pale blonde hair color, platinum blonde tint" },
  },
  {
    code: "HC015",
    visual: { label: { ar: "أشقر رمادي", en: "Ash Blonde" }, svg: "/icons/character/hair/hc015.svg", hex: "#D4C5A9" },
    ai: { prompt: "ash blonde hair, cool blonde hair color, grayish blonde tone" },
  },
  {
    code: "HC016",
    visual: { label: { ar: "رمادي", en: "Gray" }, svg: "/icons/character/hair/hc016.svg", hex: "#9E9E9E" },
    ai: { prompt: "gray hair, natural gray hair color, silver-gray hair" },
  },
  {
    code: "HC017",
    visual: { label: { ar: "رمادي فضي", en: "Silver Gray" }, svg: "/icons/character/hair/hc017.svg", hex: "#C0C0C0" },
    ai: { prompt: "silver gray hair, metallic silver hair color, bright gray hair" },
  },
  {
    code: "HC018",
    visual: { label: { ar: "أبيض", en: "White" }, svg: "/icons/character/hair/hc018.svg", hex: "#F5F5F5" },
    ai: { prompt: "white hair, pure white hair color, snow white hair" },
  },
  // ─── Dyed Colors (HC019–HC030) ────────────────────────────
  {
    code: "HC019",
    visual: { label: { ar: "بلاتيني", en: "Platinum" }, svg: "/icons/character/hair/hc019.svg", hex: "#EAE8E0" },
    ai: { prompt: "platinum blonde hair, icy platinum hair color, very light almost white blonde" },
  },
  {
    code: "HC020",
    visual: { label: { ar: "شيباني", en: "Salt & Pepper" }, svg: "/icons/character/hair/hc020.svg", hex: "#808080" },
    ai: { prompt: "salt and pepper hair, mixed gray and black hair, natural aging hair color" },
  },
  {
    code: "HC021",
    visual: { label: { ar: "بولياج بني", en: "Brown Balayage" }, svg: "/icons/character/hair/hc021.svg", hex: "#8B5E3C" },
    ai: { prompt: "brown balayage hair, hand-painted brown highlights, gradient brown hair" },
  },
  {
    code: "HC022",
    visual: { label: { ar: "بولياج أشقر", en: "Blonde Balayage" }, svg: "/icons/character/hair/hc022.svg", hex: "#D4A853" },
    ai: { prompt: "blonde balayage hair, sun-kissed blonde highlights, natural gradient blonde" },
  },
  {
    code: "HC023",
    visual: { label: { ar: "أومبريه", en: "Ombre" }, svg: "/icons/character/hair/hc023.svg", hex: "#5C3317" },
    ai: { prompt: "ombre hair, gradient color fade, dark to light transition, dip-dye effect" },
  },
  {
    code: "HC024",
    visual: { label: { ar: "هايليتس ذهبية", en: "Gold Highlights" }, svg: "/icons/character/hair/hc024.svg", hex: "#DAA520" },
    ai: { prompt: "golden highlights, warm gold streaks, sun-kissed golden strands" },
  },
  {
    code: "HC025",
    visual: { label: { ar: "هايليتس فضية", en: "Silver Highlights" }, svg: "/icons/character/hair/hc025.svg", hex: "#C0C0C0" },
    ai: { prompt: "silver highlights, metallic silver streaks, cool gray shimmering strands" },
  },
  {
    code: "HC026",
    visual: { label: { ar: "رمادي دخاني", en: "Smoky Gray" }, svg: "/icons/character/hair/hc026.svg", hex: "#5A5A5A" },
    ai: { prompt: "smoky gray hair, dark charcoal hair color, mysterious smoky tone" },
  },
  {
    code: "HC027",
    visual: { label: { ar: "بني رمادي", en: "Mushroom Brown" }, svg: "/icons/character/hair/hc027.svg", hex: "#7A7068" },
    ai: { prompt: "mushroom brown hair, taupe gray-brown hair color, cool earthy tone" },
  },
  {
    code: "HC028",
    visual: { label: { ar: "بيج رملي", en: "Sandy Beige" }, svg: "/icons/character/hair/hc028.svg", hex: "#C2A97D" },
    ai: { prompt: "sandy beige hair, light beige blonde, neutral warm sandy tone" },
  },
  {
    code: "HC029",
    visual: { label: { ar: "أحمر ياقوتي", en: "Ruby Red" }, svg: "/icons/character/hair/hc029.svg", hex: "#9B1C1C" },
    ai: { prompt: "ruby red hair, deep vibrant red hair color, jewel-tone crimson" },
  },
  {
    code: "HC030",
    visual: { label: { ar: "برونزي", en: "Bronze" }, svg: "/icons/character/hair/hc030.svg", hex: "#8C6239" },
    ai: { prompt: "bronze hair, metallic bronze hair color, warm coppery brown" },
  },
  // ─── Fantasy Colors (HC031–HC045) ─────────────────────────
  {
    code: "HC031",
    visual: { label: { ar: "وردي فاتح", en: "Pastel Pink" }, svg: "/icons/character/hair/hc031.svg", hex: "#FFB6C1" },
    ai: { prompt: "pastel pink hair, soft baby pink hair color, light cotton candy pink" },
  },
  {
    code: "HC032",
    visual: { label: { ar: "وردي صارخ", en: "Hot Pink" }, svg: "/icons/character/hair/hc032.svg", hex: "#FF69B4" },
    ai: { prompt: "hot pink hair, vivid magenta pink hair color, bold bright pink" },
  },
  {
    code: "HC033",
    visual: { label: { ar: "أزرق فاتح", en: "Pastel Blue" }, svg: "/icons/character/hair/hc033.svg", hex: "#AEC6CF" },
    ai: { prompt: "pastel blue hair, soft powder blue hair color, light sky blue" },
  },
  {
    code: "HC034",
    visual: { label: { ar: "أزرق", en: "Blue" }, svg: "/icons/character/hair/hc034.svg", hex: "#1E90FF" },
    ai: { prompt: "blue hair, vibrant blue hair color, electric blue shade" },
  },
  {
    code: "HC035",
    visual: { label: { ar: "أزرق داكن", en: "Deep Blue" }, svg: "/icons/character/hair/hc035.svg", hex: "#00008B" },
    ai: { prompt: "deep blue hair, dark navy blue hair color, midnight blue shade" },
  },
  {
    code: "HC036",
    visual: { label: { ar: "بنفسجي فاتح", en: "Lavender" }, svg: "/icons/character/hair/hc036.svg", hex: "#E6E6FA" },
    ai: { prompt: "lavender hair, pastel purple hair color, soft lilac shade" },
  },
  {
    code: "HC037",
    visual: { label: { ar: "بنفسجي", en: "Purple" }, svg: "/icons/character/hair/hc037.svg", hex: "#800080" },
    ai: { prompt: "purple hair, vibrant violet hair color, rich purple shade" },
  },
  {
    code: "HC038",
    visual: { label: { ar: "بنفسجي داكن", en: "Deep Purple" }, svg: "/icons/character/hair/hc038.svg", hex: "#4B0082" },
    ai: { prompt: "deep purple hair, dark violet hair color, indigo purple shade" },
  },
  {
    code: "HC039",
    visual: { label: { ar: "أخضر", en: "Green" }, svg: "/icons/character/hair/hc039.svg", hex: "#228B22" },
    ai: { prompt: "green hair, vibrant emerald hair color, bright green shade" },
  },
  {
    code: "HC040",
    visual: { label: { ar: "أخضر زمردي", en: "Emerald" }, svg: "/icons/character/hair/hc040.svg", hex: "#50C878" },
    ai: { prompt: "emerald green hair, jewel-tone green hair color, metallic emerald shade" },
  },
  {
    code: "HC041",
    visual: { label: { ar: "فيروزي", en: "Teal" }, svg: "/icons/character/hair/hc041.svg", hex: "#008080" },
    ai: { prompt: "teal hair, blue-green hair color, tropical turquoise shade" },
  },
  {
    code: "HC042",
    visual: { label: { ar: "برتقالي", en: "Orange" }, svg: "/icons/character/hair/hc042.svg", hex: "#FF8C00" },
    ai: { prompt: "orange hair, vibrant orange hair color, bright tangerine shade" },
  },
  {
    code: "HC043",
    visual: { label: { ar: "أصفر", en: "Yellow" }, svg: "/icons/character/hair/hc043.svg", hex: "#FFD700" },
    ai: { prompt: "yellow hair, bright lemon hair color, sunny golden yellow" },
  },
  {
    code: "HC044",
    visual: { label: { ar: "أحمر قانٍ", en: "Vivid Red" }, svg: "/icons/character/hair/hc044.svg", hex: "#FF0000" },
    ai: { prompt: "vivid red hair, bright crimson hair color, intense fire engine red" },
  },
  {
    code: "HC045",
    visual: { label: { ar: "قوس قزح", en: "Rainbow" }, svg: "/icons/character/hair/hc045.svg", hex: "#FF0080" },
    ai: { prompt: "rainbow hair, multicolor gradient hair, fantasy unicorn hair colors" },
  },
] as const;
