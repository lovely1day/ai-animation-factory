import type { CatalogItem, ColorCatalogItem } from "../../types/character-room.types";

// ─── EYE SHAPES (ES001–ES007) ──────────────────────────────
export const EYE_SHAPES: readonly CatalogItem[] = [
  {
    code: "ES001",
    visual: { label: { ar: "لوزي", en: "Almond" }, svg: "/icons/character/eyes/es001-almond.svg" },
    ai: { prompt: "classic almond-shaped eyes, elegant tapered outer corners, slightly pointed inner corners" },
  },
  {
    code: "ES002",
    visual: { label: { ar: "دائري", en: "Round" }, svg: "/icons/character/eyes/es002-round.svg" },
    ai: { prompt: "large round wide eyes, circular eye shape, prominent open appearance" },
  },
  {
    code: "ES003",
    visual: { label: { ar: "ضيق آسيوي", en: "Monolid" }, svg: "/icons/character/eyes/es003-monolid.svg" },
    ai: { prompt: "monolid eyes, minimal crease, smooth eyelid without fold, East Asian eye shape" },
  },
  {
    code: "ES004",
    visual: { label: { ar: "مرفوع الطرف", en: "Upturned" }, svg: "/icons/character/eyes/es004-upturned.svg" },
    ai: { prompt: "upturned outer corners, cat-eye shape, lifted upward tilt at outer edges" },
  },
  {
    code: "ES005",
    visual: { label: { ar: "منحدر الطرف", en: "Downturned" }, svg: "/icons/character/eyes/es005-downturned.svg" },
    ai: { prompt: "downturned outer corners, gentle droop at outer edges, slightly sad eye shape" },
  },
  {
    code: "ES006",
    visual: { label: { ar: "متعمق", en: "Deep-set" }, svg: "/icons/character/eyes/es006-deep-set.svg" },
    ai: { prompt: "deep-set eyes, prominent brow bone, eyes set back into skull, shadowed eye sockets" },
  },
  {
    code: "ES007",
    visual: { label: { ar: "بارز", en: "Prominent" }, svg: "/icons/character/eyes/es007-prominent.svg" },
    ai: { prompt: "protruding eyes, visible eyelid, eyes that bulge slightly forward, prominent eye appearance" },
  },
] as const;

// ─── EYE SIZES (EZ001–EZ003) ───────────────────────────────
export const EYE_SIZES: readonly CatalogItem[] = [
  {
    code: "EZ001",
    visual: { label: { ar: "صغير", en: "Small" }, svg: "/icons/character/eyes/ez001-small.svg" },
    ai: { prompt: "small eyes, compact eye size, narrow eye opening" },
  },
  {
    code: "EZ002",
    visual: { label: { ar: "متوسط", en: "Medium" }, svg: "/icons/character/eyes/ez002-medium.svg" },
    ai: { prompt: "medium-sized eyes, average eye size, balanced proportions" },
  },
  {
    code: "EZ003",
    visual: { label: { ar: "كبير", en: "Large" }, svg: "/icons/character/eyes/ez003-large.svg" },
    ai: { prompt: "large eyes, big expressive eyes, wide eye opening" },
  },
] as const;

// ─── EYE COLORS (EC001–EC025) ──────────────────────────────
export const EYE_COLORS: readonly ColorCatalogItem[] = [
  {
    code: "EC001",
    visual: { label: { ar: "بني داكن", en: "Dark Brown" }, svg: "/icons/character/eyes/ec001.svg", hex: "#3D1A08" },
    ai: { prompt: "dark brown eyes, deep chocolate brown iris, almost black brown eyes" },
  },
  {
    code: "EC002",
    visual: { label: { ar: "بني", en: "Brown" }, svg: "/icons/character/eyes/ec002.svg", hex: "#5D3A1A" },
    ai: { prompt: "brown eyes, warm medium brown iris, classic brown eye color" },
  },
  {
    code: "EC003",
    visual: { label: { ar: "بني فاتح", en: "Light Brown" }, svg: "/icons/character/eyes/ec003.svg", hex: "#8B5A2B" },
    ai: { prompt: "light brown eyes, amber-tinted brown iris, warm caramel brown eyes" },
  },
  {
    code: "EC004",
    visual: { label: { ar: "بندقي", en: "Hazel" }, svg: "/icons/character/eyes/ec004.svg", hex: "#8E7618" },
    ai: { prompt: "hazel eyes, brown-green mixed iris, multicolored hazel eye color" },
  },
  {
    code: "EC005",
    visual: { label: { ar: "عسلي", en: "Amber" }, svg: "/icons/character/eyes/ec005.svg", hex: "#B8860B" },
    ai: { prompt: "amber eyes, golden yellow iris, coppery honey-colored eyes" },
  },
  {
    code: "EC006",
    visual: { label: { ar: "أخضر زيتوني", en: "Olive Green" }, svg: "/icons/character/eyes/ec006.svg", hex: "#556B2F" },
    ai: { prompt: "olive green eyes, dark green iris with brown undertones, muted green eyes" },
  },
  {
    code: "EC007",
    visual: { label: { ar: "أخضر", en: "Green" }, svg: "/icons/character/eyes/ec007.svg", hex: "#228B22" },
    ai: { prompt: "green eyes, vibrant green iris, emerald-tinted green eyes" },
  },
  {
    code: "EC008",
    visual: { label: { ar: "أخضر زمردي", en: "Emerald" }, svg: "/icons/character/eyes/ec008.svg", hex: "#50C878" },
    ai: { prompt: "emerald green eyes, bright vivid green iris, jewel-toned green eyes" },
  },
  {
    code: "EC009",
    visual: { label: { ar: "أزرق فاتح", en: "Light Blue" }, svg: "/icons/character/eyes/ec009.svg", hex: "#87CEEB" },
    ai: { prompt: "light blue eyes, pale sky blue iris, icy blue eye color" },
  },
  {
    code: "EC010",
    visual: { label: { ar: "أزرق", en: "Blue" }, svg: "/icons/character/eyes/ec010.svg", hex: "#4169E1" },
    ai: { prompt: "blue eyes, medium blue iris, classic blue eye color" },
  },
  {
    code: "EC011",
    visual: { label: { ar: "أزرق داكن", en: "Dark Blue" }, svg: "/icons/character/eyes/ec011.svg", hex: "#00008B" },
    ai: { prompt: "dark blue eyes, deep navy blue iris, ocean blue eye color" },
  },
  {
    code: "EC012",
    visual: { label: { ar: "رمادي", en: "Gray" }, svg: "/icons/character/eyes/ec012.svg", hex: "#808080" },
    ai: { prompt: "gray eyes, neutral gray iris, silver-gray eye color" },
  },
  {
    code: "EC013",
    visual: { label: { ar: "رمادي فولاذي", en: "Steel Gray" }, svg: "/icons/character/eyes/ec013.svg", hex: "#71797E" },
    ai: { prompt: "steel gray eyes, metallic blue-gray iris, cool steel-colored eyes" },
  },
  {
    code: "EC014",
    visual: { label: { ar: "رمادي داكن", en: "Dark Gray" }, svg: "/icons/character/eyes/ec014.svg", hex: "#4A4A4A" },
    ai: { prompt: "dark gray eyes, charcoal gray iris, stormy gray eye color" },
  },
  {
    code: "EC015",
    visual: { label: { ar: "أسود", en: "Black" }, svg: "/icons/character/eyes/ec015.svg", hex: "#1A1A1A" },
    ai: { prompt: "black eyes, very dark iris, deep obsidian eye color" },
  },
  {
    code: "EC016",
    visual: { label: { ar: "عنبري", en: "Amber Brown" }, svg: "/icons/character/eyes/ec016.svg", hex: "#996515" },
    ai: { prompt: "amber brown eyes, yellow-brown copper iris, warm bronze eye color" },
  },
  {
    code: "EC017",
    visual: { label: { ar: "ذهبي", en: "Golden" }, svg: "/icons/character/eyes/ec017.svg", hex: "#DAA520" },
    ai: { prompt: "golden eyes, bright yellow-gold iris, metallic gold eye color" },
  },
  {
    code: "EC018",
    visual: { label: { ar: "بنفسجي فاتح", en: "Light Violet" }, svg: "/icons/character/eyes/ec018.svg", hex: "#E6E6FA" },
    ai: { prompt: "light violet eyes, pale lavender iris, soft purple eye color" },
  },
  {
    code: "EC019",
    visual: { label: { ar: "بنفسجي", en: "Violet" }, svg: "/icons/character/eyes/ec019.svg", hex: "#8A2BE2" },
    ai: { prompt: "violet eyes, purple iris, deep violet eye color, rare purple eyes" },
  },
  {
    code: "EC020",
    visual: { label: { ar: "وردي (ألبينو)", en: "Pink (Albino)" }, svg: "/icons/character/eyes/ec020.svg", hex: "#FFB6C1" },
    ai: { prompt: "pink eyes, albino pink iris, light red-tinted albino eye color" },
  },
  {
    code: "EC021",
    visual: { label: { ar: "أحمر (ألبينو)", en: "Red (Albino)" }, svg: "/icons/character/eyes/ec021.svg", hex: "#DC143C" },
    ai: { prompt: "red eyes, albino red iris, crimson albino eye color" },
  },
  {
    code: "EC022",
    visual: { label: { ar: "فيروزي", en: "Turquoise" }, svg: "/icons/character/eyes/ec022.svg", hex: "#40E0D0" },
    ai: { prompt: "turquoise eyes, blue-green cyan iris, tropical turquoise eye color" },
  },
  {
    code: "EC023",
    visual: { label: { ar: "بني أحمر", en: "Reddish Brown" }, svg: "/icons/character/eyes/ec023.svg", hex: "#7B3F00" },
    ai: { prompt: "reddish brown eyes, auburn brown iris, warm rust-brown eye color" },
  },
  {
    code: "EC024",
    visual: { label: { ar: "بني أصفر", en: "Yellowish Brown" }, svg: "/icons/character/eyes/ec024.svg", hex: "#9C7C38" },
    ai: { prompt: "yellowish brown eyes, golden-brown iris, tawny yellow-brown eye color" },
  },
  {
    code: "EC025",
    visual: { label: { ar: "لون خاص نادر", en: "Rare Special" }, svg: "/icons/character/eyes/ec025.svg", hex: "#FF1493" },
    ai: { prompt: "unique rare eye color, fantasy eye color, unusual striking iris color" },
  },
] as const;

// ─── IRIS PATTERNS (EP001–EP005) ───────────────────────────
export const IRIS_PATTERNS: readonly CatalogItem[] = [
  {
    code: "EP001",
    visual: { label: { ar: "موحد", en: "Solid" }, svg: "/icons/character/eyes/ep001-solid.svg" },
    ai: { prompt: "solid uniform iris color, even consistent eye color throughout" },
  },
  {
    code: "EP002",
    visual: { label: { ar: "نجمي", en: "Starburst" }, svg: "/icons/character/eyes/ep002-starburst.svg" },
    ai: { prompt: "starburst radial pattern iris, streaks radiating from pupil, explosive pattern" },
  },
  {
    code: "EP003",
    visual: { label: { ar: "حلقات", en: "Rings" }, svg: "/icons/character/eyes/ep003-rings.svg" },
    ai: { prompt: "concentric ring pattern iris, limbal ring visible, circular banded pattern" },
  },
  {
    code: "EP004",
    visual: { label: { ar: "نقاط", en: "Speckled" }, svg: "/icons/character/eyes/ep004-speckled.svg" },
    ai: { prompt: "speckled dotted iris pattern, flecks and spots in iris, textured irregular pattern" },
  },
  {
    code: "EP005",
    visual: { label: { ar: "تشعبي", en: "Sectoral" }, svg: "/icons/character/eyes/ep005-sectoral.svg" },
    ai: { prompt: "sectoral heterochromia pattern, pie-slice color variation in iris, partial color difference" },
  },
] as const;

// ─── EYEBROW SHAPES (EB001–EB007) ──────────────────────────
export const EYEBROW_SHAPES: readonly CatalogItem[] = [
  {
    code: "EB001",
    visual: { label: { ar: "مستقيم", en: "Straight" }, svg: "/icons/character/eyebrows/eb001-straight.svg" },
    ai: { prompt: "straight horizontal eyebrows, flat even brow line without arch" },
  },
  {
    code: "EB002",
    visual: { label: { ar: "مقوس", en: "Arched" }, svg: "/icons/character/eyebrows/eb002-arched.svg" },
    ai: { prompt: "naturally arched eyebrows, curved brow with gentle peak, elegant arch" },
  },
  {
    code: "EB003",
    visual: { label: { ar: "زاوية", en: "Angled" }, svg: "/icons/character/eyebrows/eb003-angled.svg" },
    ai: { prompt: "sharp angled peaked eyebrows, defined pointed arch, dramatic angular brows" },
  },
  {
    code: "EB004",
    visual: { label: { ar: "مرتفع", en: "High-set" }, svg: "/icons/character/eyebrows/eb004-high-set.svg" },
    ai: { prompt: "high-set raised eyebrows, positioned far above eyes, surprised alert expression" },
  },
  {
    code: "EB005",
    visual: { label: { ar: "منحدر", en: "Soft Angled" }, svg: "/icons/character/eyebrows/eb005-soft-angled.svg" },
    ai: { prompt: "softly angled eyebrows, subtle gentle arch, natural soft peak" },
  },
  {
    code: "EB006",
    visual: { label: { ar: "كثيف", en: "Thick" }, svg: "/icons/character/eyebrows/eb006-thick.svg" },
    ai: { prompt: "thick bold bushy eyebrows, full dense brow hair, prominent strong brows" },
  },
  {
    code: "EB007",
    visual: { label: { ar: "رفيع", en: "Thin" }, svg: "/icons/character/eyebrows/eb007-thin.svg" },
    ai: { prompt: "thin pencil-thin eyebrows, delicate sparse brow hair, fine defined brows" },
  },
] as const;
