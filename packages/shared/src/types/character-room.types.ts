// ============================================================
// CHARACTER ROOM — TYPE SYSTEM
// Version: 1.0.0
// Rule: Kimi does NOT modify this file — data only
// ============================================================

// ─── PRIMITIVES ───────────────────────────────────────────────
export type Code = string;            // "FS001", "HC002", "ERA_1920"
export type DNAVersion = "v1";
export type GenderCode = "M" | "F";

// ─── BILINGUAL LABEL ──────────────────────────────────────────
export interface BiLabel {
  ar: string;
  en: string;
}

// ─── DNA SEGMENT KEYS (22 keys — مغلقة) ──────────────────────
export type DNASegmentKey =
  | "G"    // Gender            M / F
  | "FS"   // Face Shape        FS001-FS007
  | "FH"   // Forehead          FH001-FH006
  | "ES"   // Eye Shape         ES001-ES007
  | "EZ"   // Eye Size          EZ001-EZ003
  | "EC"   // Eye Color         EC001-EC025
  | "EP"   // Iris Pattern      EP001-EP005
  | "EB"   // Eyebrow Shape     EB001-EB007
  | "NS"   // Nose Shape        NS001-NS009
  | "NB"   // Nose Bridge       NB001-NB003
  | "LS"   // Lip Shape         LS001-LS008
  | "CH"   // Chin Shape        CH001-CH007
  | "JW"   // Jaw Type          JW001-JW006
  | "NK"   // Neck Type         NK001-NK006
  | "HS"   // Hair Style        HS001-HS017
  | "HL"   // Hair Length       HL001-HL008
  | "HC"   // Hair Color        HC001-HC045
  | "SK"   // Skin Tone         SK001-SK006  (Fitzpatrick I-VI)
  | "ST"   // Skin Undertone    ST001-ST004
  | "BD"   // Body Type         BD001-BD005
  | "HT"   // Height (cm)       numeric string "170"
  | "ERA"; // Era               ERA_1920 etc.

// ─── DNA OBJECT ───────────────────────────────────────────────
export interface DNAObject {
  version: DNAVersion;
  segments: Partial<Record<DNASegmentKey, Code>>;
}

// ─── STORED PROFILE (backend) ─────────────────────────────────
export interface CharacterDNAProfile {
  id: string;
  name: string;
  nameAr?: string;
  gender: GenderCode;
  dna: string;          // encoded DNA string
  createdAt: number;
  updatedAt: number;
}

// ─── VISUAL DATA (what the user sees) ─────────────────────────
export interface VisualData {
  label: BiLabel;
  svg?: string;         // path: "/icons/character/faces/fs001-oval.svg"
  hex?: string;         // for color items ONLY — display only, never in DNA
  preview?: string;     // optional preview image path
}

// ─── AI DATA (what goes to the image generator) ───────────────
export interface AIData {
  prompt: string;       // English only — e.g. "oval face shape"
}

// ─── BASE CATALOG ITEM ────────────────────────────────────────
// Kimi fills arrays of this shape
export interface CatalogItem {
  code: Code;           // "FS001"
  visual: VisualData;
  ai: AIData;
}

// ─── COLOR CATALOG ITEM ───────────────────────────────────────
// hex is required for colors (eye color, hair color, etc.)
export interface ColorCatalogItem extends CatalogItem {
  visual: VisualData & { hex: string };
}

// ─── RESOLVED OUTPUT (UI consumes this) ───────────────────────
export interface ResolvedItem {
  visual: VisualData;
  ai: AIData;
}

// ─── BODY OPTIONS (gender-specific) ───────────────────────────
export type BodyGender = "M" | "F" | "both";

export interface BodyCatalogItem extends CatalogItem {
  gender: BodyGender;
  segment: "chest" | "hip" | "butt" | "waist" | "muscle" | "abs" | "shoulder";
}

// ─── ERA TYPES ────────────────────────────────────────────────
// 60 حقبة تغطي كامل تاريخ الإنسانية + ما قبله + الفنتازيا
export type EraCode =
  // ── ما قبل التاريخ ─────────────────────────────────────────
  | "ERA_CRETACEOUS"         // طباشيري — ديناصورات 145-66 مليون سنة
  | "ERA_ICE_AGE"            // العصر الجليدي 2.5 م - 11,700 سنة
  | "ERA_PREHISTORIC"        // ما قبل التاريخ — إنسان مبكر 300,000-10,000 ق.م
  | "ERA_ATLANTIS"           // أطلنطس — أسطوري
  // ── الشرق الأدنى القديم ────────────────────────────────────
  | "ERA_SUMERIAN"           // سومري 3500-2000 ق.م
  | "ERA_BABYLONIAN"         // بابلي 2000-539 ق.م
  | "ERA_ASSYRIAN"           // آشوري 900-600 ق.م
  | "ERA_PERSIAN"            // فارسي أخميني 550-330 ق.م
  // ── مصر القديمة ────────────────────────────────────────────
  | "ERA_EGYPT_OLD"          // الدولة القديمة — أهرامات 2686-2181 ق.م
  | "ERA_EGYPT_NEW"          // الدولة الحديثة — رمسيس 1550-1070 ق.م
  // ── البحر المتوسط القديم ───────────────────────────────────
  | "ERA_ANCIENT_GREEK"      // يوناني قديم 800-146 ق.م
  | "ERA_ROMAN_REPUBLIC"     // الجمهورية الرومانية 509-27 ق.م
  | "ERA_ROMAN_EMPIRE"       // الإمبراطورية الرومانية 27 ق.م - 476 م
  | "ERA_BYZANTINE"          // بيزنطي 330-1453 م
  // ── آسيا القديمة ───────────────────────────────────────────
  | "ERA_ANCIENT_CHINA"      // الصين القديمة — هان وتشين 221 ق.م - 220 م
  | "ERA_TANG_DYNASTY"       // عهد تانغ 618-907 م
  | "ERA_MING_DYNASTY"       // عهد مينغ 1368-1644 م
  | "ERA_FEUDAL_JAPAN"       // ياباني إقطاعي — سامورائي 1185-1603 م
  | "ERA_ANCIENT_INDIA"      // هند قديمة — موريا وغوبتا 322 ق.م - 550 م
  | "ERA_MONGOL"             // إمبراطورية المغول 1206-1368 م
  // ── أمريكا ما قبل كولومبوس ─────────────────────────────────
  | "ERA_MAYAN"              // مايا الكلاسيكي 250-900 م
  | "ERA_AZTEC"              // أزتيك 1300-1521 م
  | "ERA_INCA"               // إنكا 1438-1533 م
  // ── الحضارة الإسلامية ──────────────────────────────────────
  | "ERA_EARLY_ISLAM"        // صدر الإسلام 610-750 م
  | "ERA_ISLAMIC_GOLDEN"     // العصر الذهبي الإسلامي 750-1258 م
  | "ERA_OTTOMAN"            // عثماني 1299-1922 م
  | "ERA_ANDALUSIAN"         // أندلسي 711-1492 م
  // ── أوروبا العصور الوسطى ───────────────────────────────────
  | "ERA_DARK_AGES"          // العصور المظلمة 500-1000 م
  | "ERA_VIKING"             // فايكنغ 793-1066 م
  | "ERA_HIGH_MEDIEVAL"      // ذروة العصور الوسطى 1000-1300 م
  | "ERA_CRUSADES"           // الحروب الصليبية 1096-1291 م
  | "ERA_LATE_MEDIEVAL"      // أواخر العصور الوسطى 1300-1500 م
  // ── العصر الحديث المبكر ────────────────────────────────────
  | "ERA_RENAISSANCE"        // النهضة الأوروبية 1300-1600 م
  | "ERA_EXPLORATION"        // عصر الاستكشاف 1400-1600 م
  | "ERA_BAROQUE"            // باروك 1600-1750 م
  // ── العصر الحديث ───────────────────────────────────────────
  | "ERA_1700"               // القرن الثامن عشر — روكوكو
  | "ERA_1800"               // فيكتوري مبكر
  | "ERA_1850"               // فيكتوري متأخر
  | "ERA_1900"               // إدواردي
  | "ERA_1920"               // عشرينيات — آرت ديكو
  | "ERA_1930"               // ثلاثينيات
  | "ERA_1940"               // أربعينيات — الحرب العالمية
  | "ERA_1950"               // خمسينيات — عصر ذري
  | "ERA_1960"               // ستينيات
  | "ERA_1970"               // سبعينيات — ديسكو
  | "ERA_1980"               // ثمانينيات — نيون
  | "ERA_1990"               // تسعينيات — غرانج
  | "ERA_2000"               // ألفينيات — Y2K
  | "ERA_2010"               // عشرة ألفين
  | "ERA_2024"               // الحاضر
  // ── المستقبل ───────────────────────────────────────────────
  | "ERA_NEAR_FUTURE"        // المستقبل القريب 2050-2100
  | "ERA_FAR_FUTURE"         // المستقبل البعيد 2200+
  | "ERA_SPACE_AGE"          // عصر الفضاء — مستعمرات كواكب
  // ── فنتازيا ────────────────────────────────────────────────
  | "ERA_FANTASY_ANCIENT"    // فنتازيا قديمة — سحر وآلهة
  | "ERA_FANTASY_MEDIEVAL"   // فنتازيا وسيطة — تنانين وفرسان
  | "ERA_FANTASY_STEAMPUNK"  // ستيم بنك — بخار وآلات
  | "ERA_FANTASY_CYBERPUNK"  // سايبربنك — مدن مظلمة + تقنية
  | "ERA_FANTASY_POST_APOC"  // ما بعد الكارثة
  | "ERA_FANTASY_MYTHOLOGICAL"; // أساطير — أولمب / فالهالا / إنكي

export interface EraCatalogItem {
  code: EraCode;
  visual: VisualData & { thumbnail: string };
  yearRange: string;
  clothing: { promptF: string; promptM: string };
  environment: {
    architecture: string;
    streets: string;
    transport: string[];
    lighting: string;
    colorPalette: string;
  };
  ai: { prompt: string };
}

// ─── CHARACTER BUILDER STATE (React hook) ─────────────────────
export interface CharacterBuilderSegments {
  G?: GenderCode;
  FS?: Code; FH?: Code;
  ES?: Code; EZ?: Code; EC?: Code; EP?: Code; EB?: Code;
  NS?: Code; NB?: Code;
  LS?: Code;
  CH?: Code;
  JW?: Code;
  NK?: Code;
  HS?: Code; HL?: Code; HC?: Code;
  SK?: Code; ST?: Code;
  BD?: Code; HT?: string;
  ERA?: EraCode;
  // Body gender-specific (not in DNA string — resolved separately)
  CHEST?: Code;   // male
  MUSCLE?: Code;  // male
  ABS?: Code;     // male
  BREAST?: Code;  // female
  HIP?: Code;     // female
  BUTT?: Code;    // female
}

export interface CharacterBuilderState {
  id?: string;
  name: string;
  segments: CharacterBuilderSegments;
  activeTab: "face" | "eye" | "jaw" | "hair" | "skin" | "body" | "makeup" | "wardrobe" | "era";
  isDirty: boolean;
}
