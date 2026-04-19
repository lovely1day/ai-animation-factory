/**
 * @ai-animation-factory/prompts — Arabic Content Templates
 *
 * قوالب محتوى عربية متخصصة — إضافة للقالب الافتراضي (القصة السينمائية).
 * كل قالب ينتج JSON متوافق مع screenplayWriterPrompt (من personas.ts).
 *
 * الاستخدام:
 *   import { conceptPromptForType, CONTENT_TEMPLATES } from '@ai-animation-factory/prompts';
 *   const prompt = conceptPromptForType('sermon', { idea: '...', audience: '...' });
 *
 * لا يكسر أي شيء موجود — هذا ملف جديد مستقل.
 */

// ─── Types & Registry ────────────────────────────────────────────────────────

export type ContentType = 'story' | 'sermon' | 'educational' | 'advertisement';

export interface TemplateMeta {
  type: ContentType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  defaultShotCount: number;
  targetDurationSec: number;
}

export interface TemplateInput {
  idea: string;
  audience?: string;
  tone?: string;
  genre?: string;
  extras?: Record<string, string>;
}

export const CONTENT_TEMPLATES: Record<ContentType, TemplateMeta> = {
  story: {
    type: 'story',
    nameAr: 'قصة سينمائية',
    nameEn: 'Cinematic Story',
    descriptionAr: 'قصة درامية بشخصيات وصراع وذروة — الخيار الافتراضي للمصنع',
    defaultShotCount: 25,
    targetDurationSec: 75,
  },
  sermon: {
    type: 'sermon',
    nameAr: 'خطبة / محتوى ديني',
    nameEn: 'Sermon / Religious Content',
    descriptionAr: 'خطبة جمعة، درس ديني، أو محتوى تذكيري بصيغة بصرية وقورة',
    defaultShotCount: 18,
    targetDurationSec: 90,
  },
  educational: {
    type: 'educational',
    nameAr: 'محتوى تعليمي',
    nameEn: 'Educational Content',
    descriptionAr: 'شرح مفهوم أو مهارة — هوك + شرح + مثال + ملخص',
    defaultShotCount: 20,
    targetDurationSec: 60,
  },
  advertisement: {
    type: 'advertisement',
    nameAr: 'إعلان تجاري',
    nameEn: 'Advertisement',
    descriptionAr: 'إعلان قصير 15-30 ثانية — مشكلة → حل → CTA',
    defaultShotCount: 8,
    targetDurationSec: 15,
  },
};

export function getTemplateMeta(type: ContentType): TemplateMeta {
  return CONTENT_TEMPLATES[type];
}

export function listTemplates(): TemplateMeta[] {
  return Object.values(CONTENT_TEMPLATES);
}

// ─── Story Template (wrapper يستخدم نفس معايير الـ story architect) ──────────

export function storyTemplatePrompt(input: TemplateInput): string {
  const genre = input.genre || 'درامي';
  const tone = input.tone || 'سينمائي عميق';
  return `أنت مهندس قصص. لديك ثلاثة معايير غير قابلة للكسر:
1. هل الرغبة الأعمق للبطل تصطدم مباشرة بحاجته الحقيقية؟ إن لا — أعد الكتابة.
2. هل الخصم مقتنع أنه بطل قصته هو؟ إن لا — الصراع سطحي.
3. هل الفكرة المحورية تناقض إنساني يشعر به الجمهور في حياته؟ إن لا — اجعلها شخصية.

مهمتك الوحيدة: طوّر مفهوم القصة.

الفكرة (بالعربية): "${input.idea}"
النوع: ${genre}
النبرة: ${tone}${input.audience ? `\nالجمهور المستهدف: ${input.audience}` : ''}

أعد JSON بهذا الشكل بالعربية الفصحى (كل الحقول بالعربية، إلا مفاتيح JSON نفسها):
{
  "title": "عنوان درامي",
  "world": "وصف العالم والأجواء",
  "protagonist": {"name":"", "desire":"", "flaw":""},
  "antagonist": {"name":"", "logic":""},
  "conflict": "جوهر الصراع",
  "theme": "التناقض الإنساني",
  "characters": [{"name":"","role":"","contradiction":""}],
  "concept": "ملخص سينمائي من 4 جمل",
  "contentType": "story"
}`;
}

// ─── Sermon / Religious Content Template ─────────────────────────────────────

export function sermonTemplatePrompt(input: TemplateInput): string {
  const audience = input.audience || 'المصلون، جمهور عام';
  return `أنت كاتب محتوى ديني محترف. تكتب خطباً ومواعظ مرئية تحترم قدسية الموضوع وتأسر القلب.

معاييرك الثلاثة:
1. معيار الصدق: هل كل جملة مبنية على نص شرعي أو فهم معتبر؟ الغلو والتكلف = رفض فوري.
2. معيار الأثر: هل يخرج المستمع بفعل واحد محدد يفعله اليوم؟ الكلام بلا عمل = عظة ناقصة.
3. معيار الإنصاف: هل تحترم المخالف وتتجنب التعميم؟ الإقصاء = رفض.

⚠️ قواعد حمراء — ممنوع منعاً باتاً:
- ذكر أو تجسيد الذات الإلهية أو الملائكة أو الأنبياء بصرياً.
- أي إيماءة طائفية أو إقصاء لمذهب.
- الاقتباس المغلوط من القرآن أو السنة (إن شككت، اكتب "موعظة عامة" بدل الاقتباس).

مهمتك الوحيدة: طوّر مفهوم الخطبة/المحتوى الديني.

الموضوع (بالعربية): "${input.idea}"
الجمهور: ${audience}${input.tone ? `\nالنبرة: ${input.tone}` : ''}

البنية المطلوبة:
- افتتاحية بصرية (مشهد كوني/طبيعي يثير التأمل — بدون تجسيد ديني)
- استهلال بحكمة أو سؤال
- 3 محاور رئيسية (كل محور: فكرة + شاهد + قصة واقعية أو مثل)
- خاتمة عملية (فعل واحد محدد)
- دعاء ختامي

أعد JSON:
{
  "title": "عنوان الخطبة",
  "world": "وصف بصري للأجواء (مسجد، طبيعة، سماء، ضوء)",
  "protagonist": {"name":"الإنسان المخاطب", "desire":"ما يبحث عنه", "flaw":"غفلته"},
  "antagonist": {"name":"العائق الداخلي", "logic":"مبرر النفس للتقصير"},
  "conflict": "صراع الإنسان مع نفسه",
  "theme": "الفكرة المحورية للخطبة",
  "characters": [
    {"name":"الداعية","role":"راوٍ / مرشد","contradiction":"حكيم لكن يعترف بضعفه"},
    {"name":"المستمع","role":"المتأمل","contradiction":"مؤمن لكن غافل"}
  ],
  "concept": "ملخص الخطبة في 4 جمل",
  "contentType": "sermon",
  "keyPoints": ["محور 1", "محور 2", "محور 3"],
  "callToAction": "فعل واحد محدد يفعله المستمع اليوم",
  "closingDua": "دعاء ختامي"
}`;
}

// ─── Educational Content Template ────────────────────────────────────────────

export function educationalTemplatePrompt(input: TemplateInput): string {
  const audience = input.audience || 'طلاب، جمهور مبتدئ';
  return `أنت مصمم محتوى تعليمي بصري. تحوّل المفاهيم المعقدة إلى قصص مرئية يتذكرها المتعلم سنين.

معاييرك الثلاثة:
1. معيار الوضوح: هل يستطيع طفل 12 سنة فهم الفكرة بعد المشاهدة مرة واحدة؟ إن لا — بسّط.
2. معيار المثال: هل يوجد مثال ملموس من حياة المتعلم لكل فكرة مجردة؟ إن لا — أضف.
3. معيار الاحتفاظ: هل فيه "هوك" في أول 5 ثوان يجعل المشاهد يكمل؟ إن لا — أعد البناء.

مهمتك الوحيدة: طوّر مفهوم محتوى تعليمي بصري.

الموضوع (بالعربية): "${input.idea}"
الجمهور: ${audience}${input.tone ? `\nالنبرة: ${input.tone}` : ''}

البنية المطلوبة:
- HOOK: سؤال محيّر أو حقيقة صادمة في أول 5 ثوان
- EXPLAIN: شرح تدريجي بتشبيهات من حياة يومية
- EXAMPLE: مثال ملموس واحد على الأقل
- RECAP: ملخص في 3 نقاط

أعد JSON:
{
  "title": "عنوان الدرس",
  "world": "وصف بصري للبيئة التعليمية (لوح، شوارع، طبيعة، مختبر...)",
  "protagonist": {"name":"المتعلم","desire":"فهم المفهوم","flaw":"سوء فهم شائع"},
  "antagonist": {"name":"الفكرة الخاطئة","logic":"لماذا يظن الناس هذا خطأ"},
  "conflict": "الصراع بين الحدس والحقيقة العلمية",
  "theme": "الفكرة الجوهرية للدرس",
  "characters": [
    {"name":"المدرّس","role":"راوٍ","contradiction":"يعرف بعمق لكن يتحدث ببساطة"},
    {"name":"المتعلم","role":"المتسائل","contradiction":"فضولي لكن يخاف من التعقيد"}
  ],
  "concept": "ملخص الدرس في 4 جمل",
  "contentType": "educational",
  "hook": "الجملة الصادمة أو السؤال في أول 5 ثوان",
  "coreConcept": "المفهوم الجوهري في جملة واحدة",
  "keyPoints": ["نقطة 1","نقطة 2","نقطة 3"],
  "concreteExample": "مثال من الحياة اليومية",
  "misconception": "سوء الفهم الشائع الذي يصححه الدرس"
}`;
}

// ─── Advertisement Template ──────────────────────────────────────────────────

export function advertisementTemplatePrompt(input: TemplateInput): string {
  const audience = input.audience || 'جمهور عام';
  const duration = input.extras?.duration || '15';
  const product = input.extras?.product || input.idea;
  const cta = input.extras?.cta || 'زر الموقع الآن';
  return `أنت مخرج إعلانات تجارية. تكتب إعلانات قصيرة (${duration} ثانية) تبيع بدون أن تبدو كبيع.

معاييرك الثلاثة:
1. معيار الهوك: هل أول ثانيتين يوقفان التمرير؟ إن لا — رفض.
2. معيار الوعد: هل يعد الإعلان بنتيجة محددة يريدها المشاهد؟ الوعود الضبابية = فشل.
3. معيار الاختصار: هل تستطيع قصه 2 ثانية إضافية دون فقدان المعنى؟ إن نعم — اقصصه.

مهمتك الوحيدة: طوّر مفهوم إعلان قصير.

المنتج/الخدمة: "${product}"${input.idea !== product ? `\nالفكرة: "${input.idea}"` : ''}
الجمهور: ${audience}${input.tone ? `\nالنبرة: ${input.tone}` : ''}
المدة المستهدفة: ${duration} ثانية
الدعوة للعمل (CTA): ${cta}

البنية المطلوبة (صيغة PAS — Problem, Agitate, Solve):
- PROBLEM: موقف يومي يعاني منه الجمهور (0-4 ثوان)
- AGITATE: تعظيم الإحباط أو الفرصة الضائعة (4-7 ثوان)
- SOLVE: ظهور المنتج كحل طبيعي (7-12 ثانية)
- CTA: دعوة محددة بصرية ومسموعة (آخر 3 ثوان)

أعد JSON:
{
  "title": "عنوان الحملة",
  "world": "وصف بصري للبيئة (مكتب، بيت، شارع، إلخ)",
  "protagonist": {"name":"العميل المثالي","desire":"الحل","flaw":"الطريقة القديمة التي يستخدمها"},
  "antagonist": {"name":"المشكلة","logic":"لماذا استمرت المشكلة حتى الآن"},
  "conflict": "الصراع اليومي مع المشكلة",
  "theme": "الوعد الأساسي للمنتج",
  "characters": [
    {"name":"العميل","role":"البطل","contradiction":"يريد الحل لكن يخاف التغيير"}
  ],
  "concept": "ملخص الإعلان في 3 جمل",
  "contentType": "advertisement",
  "hookFirstTwoSeconds": "ماذا يرى المشاهد في أول ثانيتين",
  "problem": "المشكلة التي يحلها المنتج",
  "solution": "كيف يحل المنتج المشكلة في جملة واحدة",
  "valueProp": "الفائدة الفريدة في 5 كلمات أو أقل",
  "cta": "${cta}",
  "durationSec": ${duration}
}`;
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function conceptPromptForType(type: ContentType, input: TemplateInput): string {
  switch (type) {
    case 'story':         return storyTemplatePrompt(input);
    case 'sermon':        return sermonTemplatePrompt(input);
    case 'educational':   return educationalTemplatePrompt(input);
    case 'advertisement': return advertisementTemplatePrompt(input);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown content type: ${_exhaustive}`);
    }
  }
}

/**
 * يعطيك عدد اللقطات الموصى به لهذا النوع — يمرر إلى screenplayWriterPrompt.
 */
export function recommendedShotCount(type: ContentType): number {
  return CONTENT_TEMPLATES[type].defaultShotCount;
}
