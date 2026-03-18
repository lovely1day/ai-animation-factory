import { Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { geminiText, geminiTextJSON, isGeminiConfigured } from "../config/gemini";
import { kimiText, kimiTextJSON, isKimiConfigured } from "../config/kimi";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const OLLAMA_URL = env.OLLAMA_URL || "http://localhost:11434";
const ARABIC_MODEL = env.OLLAMA_MODEL || "mistral";

// ==================== LIBRARY LOADER ====================

function loadLibrary(): Record<string, string> {
  const libraryRoot = join(process.cwd(), "..", "..", "library");
  const files: Record<string, string> = {};
  const paths: [string, string][] = [
    ["story_structure",  "storytelling/story_structure.txt"],
    ["shots",            "cinematography/shots.txt"],
    ["camera_movements", "cinematography/camera_movements.txt"],
    ["lighting_styles",  "cinematography/lighting_styles.txt"],
    ["prompt_examples",  "prompt_engineering/prompt_examples.txt"],
  ];
  for (const [key, rel] of paths) {
    try {
      files[key] = readFileSync(join(libraryRoot, rel), "utf-8").trim();
    } catch {
      files[key] = "";
    }
  }
  return files;
}

let _library: Record<string, string> | null = null;
function getLibrary() {
  if (!_library) _library = loadLibrary();
  return _library;
}

// ==================== AI LAYER ====================
// Strategy: Ollama generates ALWAYS → Gemini reviews & improves if available

async function ollamaGenerate(
  prompt: string,
  model = ARABIC_MODEL,
  jsonMode = false,
): Promise<string> {
  const body: Record<string, any> = {
    model,
    prompt,
    stream: false,
    options: {
      num_predict: -1,   // unlimited — never truncate
      num_ctx: 4096,
      temperature: 0.7,
    },
  };
  if (jsonMode) body.format = "json"; // forces valid JSON output
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  const data = await response.json() as { response: string };
  logger.debug({ chars: data.response?.length, model, jsonMode }, "Ollama raw response received");
  return data.response;
}

/**
 * Generate with Ollama (json mode), then optionally review/improve with Gemini.
 */
type ProviderMode = "ollama" | "gemini" | "ollama+gemini" | "kimi";

async function ollamaFirstGeminiReview(
  ollamaPrompt: string,
  geminiReviewPrompt: (ollamaOutput: string) => string,
  model?: string,
  jsonMode = true,
  mode: ProviderMode = "ollama+gemini",
): Promise<{ text: string; provider: string }> {

  // === Gemini-only mode ===
  if (mode === "gemini") {
    if (!isGeminiConfigured()) throw new Error("Gemini is not configured");
    logger.info("Using Gemini directly (gemini mode)");
    const text = jsonMode ? await geminiTextJSON(ollamaPrompt) : await geminiText(ollamaPrompt);
    return { text, provider: "gemini" };
  }

  // === Kimi-only mode ===
  if (mode === "kimi") {
    if (!isKimiConfigured()) throw new Error("Kimi is not configured");
    logger.info("Using Kimi directly (kimi mode)");
    const text = jsonMode ? await kimiTextJSON(ollamaPrompt) : await kimiText(ollamaPrompt);
    return { text, provider: "kimi" };
  }

  // === Step 1: Ollama ===
  let ollamaText: string;
  try {
    ollamaText = await ollamaGenerate(ollamaPrompt, model || ARABIC_MODEL, jsonMode);
  } catch (err: any) {
    logger.error({ error: err.message }, "Ollama failed");
    if (mode === "ollama") throw new Error("Ollama unavailable and mode is ollama-only");
    if (isGeminiConfigured()) {
      logger.info("Falling back to Gemini (Ollama unavailable)");
      const text = jsonMode ? await geminiTextJSON(ollamaPrompt) : await geminiText(ollamaPrompt);
      return { text, provider: "gemini-fallback" };
    }
    throw err;
  }

  // === Ollama-only mode (no Gemini review) ===
  if (mode === "ollama") {
    return { text: ollamaText, provider: "ollama" };
  }

  // === Step 2: Gemini reviews (ollama+gemini mode) ===
  if (isGeminiConfigured()) {
    try {
      const geminiText_ = await geminiText(geminiReviewPrompt(ollamaText));
      logger.debug("Gemini review completed");
      return { text: geminiText_, provider: "ollama+gemini" };
    } catch (err: any) {
      logger.warn({ error: err.message }, "Gemini review failed — using Ollama output");
    }
  }

  return { text: ollamaText, provider: "ollama" };
}

// ==================== JSON UTILS ====================

function repairTruncatedJSON(text: string): string {
  // Count open/close brackets to determine what's missing
  let openBraces = 0, openBrackets = 0;
  let inString = false, escaped = false;
  for (const ch of text) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }
  // Remove trailing partial object/array (after last complete value)
  let repaired = text.trimEnd();
  // Remove trailing comma
  repaired = repaired.replace(/,\s*$/, '');
  // Close unclosed structures
  for (let i = 0; i < openBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces; i++) repaired += '}';
  return repaired;
}

function parseJSON<T>(text: string): T | null {
  if (!text) return null;
  // Try direct parse first
  try { return JSON.parse(text.trim()) as T; } catch { /* */ }
  // Extract largest JSON block
  const matches = text.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  // Try blocks from largest to smallest, also try repaired versions
  const sorted = matches.sort((a, b) => b.length - a.length);
  for (const m of sorted) {
    try { return JSON.parse(m) as T; } catch { /* */ }
    // Try repairing truncated JSON
    try { return JSON.parse(repairTruncatedJSON(m)) as T; } catch { /* */ }
  }
  // Last resort: try to repair the full text
  try { return JSON.parse(repairTruncatedJSON(text.trim())) as T; } catch { /* */ }
  return null;
}

/** Strip extra/double quotes and backticks that Ollama sometimes wraps values in */
function cleanStr(s: unknown): string {
  if (typeof s !== "string") return "";
  return s
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")  // strip leading/trailing quotes
    .replace(/"{2,}/g, "")             // remove double-double quotes mid-string
    .trim();
}

// ==================== INTERFACES ====================

interface Character {
  id: string;
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "mentor";
  age: string;
  personality: string;
  goal: string;
}

interface Scene {
  id: number;
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  dialogue: string;
  action: string;
  camera: string;
  imagePrompt: string;
}

interface Script {
  id: string;
  versionName: string;
  versionNumber: number;
  logline: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  totalScenes: number;
}

interface ScriptCollection {
  workNumber: number;
  workTitle: string;
  workId: string;
  scripts: Script[];
}

// ==================== PROMPT BUILDERS ====================

function buildEnhanceIdeaPrompt(idea: string, lib: Record<string, string>): string {
  return `أنت خبير في تطوير قصص الرسوم المتحركة العربية بمستوى ديزني ونتفليكس.

## مرجع بنية القصة:
${lib.story_structure ? lib.story_structure.split('\n').slice(0, 30).join('\n') : "بنية الفصول الثلاثة: تمهيد، صراع، حل"}

## فكرة المستخدم:
"${idea}"

## المطلوب:
حسّن هذه الفكرة وطوّرها إلى مشروع سينمائي احترافي.

قواعد مهمة:
- اكتب بالعربية فقط في جميع الحقول
- لا تضع علامات اقتباس داخل النصوص
- لا تستخدم كلمات إنجليزية إلا في حقل imagePrompt

أجب بـ JSON فقط — لا تكتب أي نص خارج الـ JSON أبداً:
{
  "title": "العنوان الجذاب للمسلسل",
  "concept": "وصف مفصل للقصة في 4-5 جمل يشمل الحبكة والصراع والرسالة",
  "genre": "النوع",
  "targetAge": "الفئة العمرية",
  "theme": "الموضوع الرئيسي",
  "characters": [
    {
      "name": "اسم الشخصية",
      "role": "دورها",
      "age": "عمرها",
      "desc": "وصف شخصيتها"
    }
  ]
}`;
}

function buildVariationsPrompt(enhancedIdea: any): string {
  return `أنت كاتب سيناريو محترف.

القصة: "${enhancedIdea.title}" — ${enhancedIdea.concept?.slice(0, 120)}

قاعدة مهمة: اكتب بالعربية فقط. لا تستخدم كلمات إنجليزية إطلاقاً. لا تضع علامات اقتباس داخل النصوص.

أنشئ 3 نسخ من القصة. كل نسخة: عنوان + جملتان وصف + نبرة.

أجب بـ JSON فقط، لا تكتب أي شيء قبل { أو بعد }:
{"variations":[{"id":1,"title":"عنوان النسخة الكوميدية هنا","concept":"الجملة الأولى للوصف الكوميدي. الجملة الثانية.","tone":"كوميدي","uniqueElement":"العنصر المميز"},{"id":2,"title":"عنوان النسخة الدرامية هنا","concept":"الجملة الأولى للوصف الدرامي. الجملة الثانية.","tone":"درامي","uniqueElement":"العنصر المميز"},{"id":3,"title":"عنوان النسخة المثيرة هنا","concept":"الجملة الأولى للوصف المثير. الجملة الثانية.","tone":"أكشن","uniqueElement":"العنصر المميز"}]}`;
}

function buildScriptPromptJSON(idea: any, versionName: string, tone: string): string {
  return `اكتب سيناريو رسوم متحركة عربي.
العنوان: ${cleanStr(String(idea.title || ""))}
النوع: ${cleanStr(String(idea.genre || "مغامرة"))}
النبرة: ${tone}

أعطني JSON فيه: logline (جملة)، synopsis (جملتان)، characters (مصفوفة شخصيتين)، scenes (مصفوفة 4 مشاهد).

كل مشهد يحتوي: sceneNumber، location، timeOfDay، dialogue، action، imagePrompt (إنجليزي).

JSON فقط بدون أي نص خارجه:`;
}

function buildRegenerateScenePromptJSON(
  scriptTitle: string,
  sceneNumber: number,
  location: string,
  time: string,
  genre: string
): string {
  return `أنت كاتب سيناريو محترف للرسوم المتحركة العربية.

السياق:
- عنوان العمل: ${scriptTitle || "غير محدد"}
- رقم المشهد: ${sceneNumber}
- المكان: ${location || "غير محدد"}
- الوقت: ${time || "غير محدد"}
- النوع: ${genre || "مغامرة"}

أعد كتابة هذا المشهد بأسلوب مختلف وأكثر إبداعاً.

أجب بـ JSON فقط:
{
  "content": "وصف أحداث المشهد الرئيسية",
  "dialogue": "الحوار الجديد",
  "action": "وصف الحركة والأفعال",
  "imagePrompt": "detailed English visual description: subject, lighting style, camera shot type, art style, animated"
}`;
}

// ==================== GEMINI REVIEW PROMPTS ====================

function buildIdeaReviewPrompt(originalIdea: string, ollamaResult: string): string {
  return `أنت محرر إبداعي محترف متخصص في الرسوم المتحركة. قام نموذج ذكاء اصطناعي آخر بتحسين الفكرة التالية:

الفكرة الأصلية: "${originalIdea}"

النتيجة المُولَّدة:
${ollamaResult}

راجع هذه النتيجة وحسّنها:
- اجعل العنوان أكثر جاذبية وتسويقاً
- عمّق وصف الشخصيات وأضف تفاصيل مميزة
- احتفظ بنفس بنية JSON تماماً

أعد الـ JSON المحسّن فقط — لا نص خارج JSON:`;
}

function buildVariationsReviewPrompt(ollamaResult: string): string {
  return `أنت محرر سيناريو محترف. راجع هذه التنويعات الثلاث وحسّنها:

${ollamaResult}

حسّن:
- العناوين لتكون أكثر جذباً
- المفاهيم لتكون أكثر وضوحاً وإثارة
- العناصر المميزة لكل نسخة

احتفظ بنفس بنية JSON. أعد JSON محسّن فقط:`;
}

function buildScriptReviewPrompt(ollamaResult: string, idea: any): string {
  // Limit size to avoid Gemini token limits
  const trimmed = ollamaResult.length > 4000 ? ollamaResult.slice(0, 4000) + '...' : ollamaResult;
  return `أنت محرر سيناريو محترف متخصص في الرسوم المتحركة. راجع هذا السيناريو المُولَّد لـ "${idea.title}" وحسّنه:

${trimmed}

قم بـ:
1. تحسين الحوارات لتكون أكثر حيوية وطبيعية
2. تحسين imagePrompt لكل مشهد (إنجليزية مفصّلة: art style، lighting، camera، subject، mood)
3. التأكد من أن كل المشاهد العشرة موجودة وكاملة
4. الحفاظ على نفس بنية JSON تماماً

أعد الـ JSON الكامل المحسّن فقط — لا نص خارج JSON:`;
}

// ==================== CONTROLLERS ====================

/** تحسين فكرة واحدة — Ollama يولد، Gemini يراجع */
export async function enhanceIdea(req: Request, res: Response) {
  try {
    const { idea, model, provider: providerMode } = req.body;
    if (!idea) return res.status(400).json({ error: "Idea is required" });

    const lib = getLibrary();
    const ollamaPrompt = buildEnhanceIdeaPrompt(idea, lib);

    const { text, provider } = await ollamaFirstGeminiReview(
      ollamaPrompt,
      (ollamaOut) => buildIdeaReviewPrompt(idea, ollamaOut),
      model,
      true,
      (providerMode as ProviderMode) || "ollama+gemini"
    );

    // Parse result
    let result = parseJSON<any>(text);
    if (!result?.title) {
      result = parseEnhancedIdea(text);
    }

    // Sanitize
    if (result) {
      result.title = cleanStr(result.title);
      result.concept = cleanStr(result.concept);
      result.genre = cleanStr(result.genre);
      if (Array.isArray(result.characters)) {
        result.characters = result.characters.map((c: any) => ({
          ...c,
          name: cleanStr(c.name),
          role: cleanStr(c.role),
          desc: cleanStr(c.desc || c.personality || ""),
        }));
      }
    }

    logger.info({ provider, title: result?.title }, "enhanceIdea completed");
    return res.json({ success: true, provider, data: result });
  } catch (err: any) {
    logger.error({ error: err.message }, "enhanceIdea failed");
    return res.status(500).json({ error: "Failed to enhance idea", details: err.message });
  }
}

/** توليد 3 تنويعات — Ollama يولد، Gemini يراجع */
export async function generateVariations(req: Request, res: Response) {
  try {
    const { enhancedIdea, model, provider: providerMode } = req.body;
    if (!enhancedIdea) return res.status(400).json({ error: "enhancedIdea is required" });

    const ollamaPrompt = buildVariationsPrompt(enhancedIdea);

    const { text, provider } = await ollamaFirstGeminiReview(
      ollamaPrompt,
      (ollamaOut) => buildVariationsReviewPrompt(ollamaOut),
      model,
      true,
      (providerMode as ProviderMode) || "ollama+gemini"
    );

    let result = parseJSON<{ variations: any[] }>(text);
    if (!result?.variations) {
      result = { variations: parseVariationsFallback(text) };
    }

    // Sanitize string values — Ollama sometimes wraps values in extra quotes
    const variations = (result.variations || []).map((v: any) => ({
      id: v.id,
      title: cleanStr(v.title),
      concept: cleanStr(v.concept),
      tone: cleanStr(v.tone),
      uniqueElement: cleanStr(v.uniqueElement || v.unique_element || ""),
    }));

    logger.info({ provider, count: variations.length }, "generateVariations completed");
    return res.json({ success: true, provider, variations });
  } catch (err: any) {
    logger.error({ error: err.message }, "generateVariations failed");
    return res.status(500).json({ error: "Failed to generate variations", details: err.message });
  }
}

/** توليد 10 أفكار */
export async function generateIdeas(req: Request, res: Response) {
  try {
    const { idea, model } = req.body;
    if (!idea) return res.status(400).json({ error: "Idea is required" });

    const lib = getLibrary();
    const prompt = `أنت خبير في تطوير أفلام الرسوم المتحركة.

مرجع السرد: ${lib.story_structure ? lib.story_structure.split('\n').slice(0, 10).join(' | ') : ""}

فكرة المستخدم: "${idea}"

قدم 10 مقترحات مختلفة. أجب بـ JSON فقط:
{
  "ideas": [
    {
      "id": 1,
      "title": "العنوان",
      "concept": "الملخص في 3 جمل",
      "genre": "النوع",
      "targetAudience": "الفئة العمرية",
      "logline": "جملة واحدة تبيع الفكرة"
    }
  ]
}`;

    const { text, provider } = await ollamaFirstGeminiReview(
      prompt,
      (out) => `راجع هذه الأفكار العشر وحسّن العناوين والملخصات لتكون أكثر جاذبية. احتفظ بنفس JSON:\n${out}\nأعد JSON محسّن فقط:`,
      model
    );

    let result = parseJSON<{ ideas: any[] }>(text);
    if (!result?.ideas) result = { ideas: parseIdeas(text) };

    return res.json({ success: true, originalIdea: idea, ideas: result.ideas || [], provider });
  } catch (err: any) {
    logger.error({ error: err.message }, "generateIdeas failed");
    return res.status(500).json({ error: "Failed to generate ideas", details: err.message });
  }
}

/** توليد السكربتات — Ollama يولد JSON، Gemini يراجع ويحسّن */
export async function generateScripts(req: Request, res: Response) {
  try {
    const { ideas, model, provider: providerMode } = req.body;
    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ error: "At least one idea is required" });
    }

    // Always process only first idea to keep it simple and reliable
    const scriptCollections: ScriptCollection[] = [];
    let idCounter = 0;

    for (let workIndex = 0; workIndex < Math.min(ideas.length, 1); workIndex++) {
      const idea = ideas[workIndex];
      const workNumber = workIndex + 1;
      const workId = `WORK-${++idCounter}`;
      const scripts: Script[] = [];

      const versionNum = 1;
      const versionName = VERSION_NAMES[0];
      const tone = VERSION_TONES[0];

      const ollamaPrompt = buildScriptPromptJSON(idea, versionName, tone);
      logger.info({ idea_title: idea.title }, "Generating script with Ollama");

      const { text, provider } = await ollamaFirstGeminiReview(
        ollamaPrompt,
        (ollamaOut) => buildScriptReviewPrompt(ollamaOut, idea),
        model,
        true,
        (providerMode as ProviderMode) || "ollama+gemini"
      );

      logger.debug({ provider, idea_title: idea.title }, "Script generated");

      // Parse the result
      logger.info({ raw_preview: text.slice(0, 300) }, "Ollama script raw response");
      const parsed = parseJSON<any>(text);
      logger.info({
        parsed_ok: !!parsed,
        has_scenes: !!parsed?.scenes,
        scenes_count: parsed?.scenes?.length ?? 0,
      }, "Script parse result");
      let script: Script;

      if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        script = {
          id: `SCRIPT-${++idCounter}`,
          versionName,
          versionNumber: versionNum,
          logline: cleanStr(parsed.logline || ""),
          synopsis: cleanStr(parsed.synopsis || ""),
          characters: (parsed.characters || []).map((c: any, i: number) => ({
            id: `CHAR-${i + 1}`,
            name: cleanStr(c.name || ""),
            role: c.role || "supporting",
            age: cleanStr(c.age || ""),
            personality: cleanStr(c.personality || c.desc || ""),
            goal: cleanStr(c.goal || ""),
          })),
          scenes: parsed.scenes.map((s: any, i: number) => ({
            id: i + 1,
            sceneNumber: s.sceneNumber || i + 1,
            location: cleanStr(s.location || ""),
            timeOfDay: cleanStr(s.timeOfDay || ""),
            dialogue: cleanStr(s.dialogue || ""),
            action: cleanStr(s.action || ""),
            camera: cleanStr(s.camera || ""),
            imagePrompt: cleanStr(s.imagePrompt || ""),
          })),
          totalScenes: parsed.scenes.length,
        };
        logger.info({ scenes: script.scenes.length, provider }, "Script parsed successfully");
      } else {
        // Fallback: try text parser
        logger.warn({ text_preview: text.slice(0, 300) }, "JSON parse failed, trying text parser");
        script = parseScript(text, versionNum, versionName, ++idCounter);
        // If text parser also fails, build placeholder scenes from raw text
        if (script.scenes.length === 0 && text.trim().length > 50) {
          logger.warn("Text parser also failed — building placeholder scenes from raw text");
          const chunks = text.trim().split(/\n\n+/).filter(c => c.trim().length > 20).slice(0, 4);
          script.scenes = chunks.map((chunk, i) => ({
            id: i + 1,
            sceneNumber: i + 1,
            location: `مشهد ${i + 1}`,
            timeOfDay: "نهاراً",
            dialogue: chunk.slice(0, 300),
            action: "",
            camera: "medium shot",
            imagePrompt: `scene ${i + 1}, animated, Arabic style`,
          }));
          script.totalScenes = script.scenes.length;
        }
      }

      scripts.push(script);
      scriptCollections.push({ workNumber, workTitle: idea.title, workId, scripts });
    }

    return res.json({
      success: true,
      workCount: ideas.length,
      totalScripts: scriptCollections.reduce((acc, c) => acc + c.scripts.length, 0),
      collections: scriptCollections,
      provider: isGeminiConfigured() ? "ollama+gemini" : "ollama",
    });
  } catch (err: any) {
    logger.error({ error: err.message }, "generateScripts failed");
    return res.status(500).json({ error: "Failed to generate scripts", details: err.message });
  }
}

/** إعادة توليد مشهد واحد */
export async function regenerateScene(req: Request, res: Response) {
  try {
    const { scriptTitle, sceneNumber, location, time, genre, model } = req.body;
    if (!sceneNumber) return res.status(400).json({ error: "sceneNumber is required" });

    const ollamaPrompt = buildRegenerateScenePromptJSON(scriptTitle, sceneNumber, location, time, genre);

    const { text, provider } = await ollamaFirstGeminiReview(
      ollamaPrompt,
      (ollamaOut) => `راجع هذا المشهد المُولَّد وحسّن الحوار والـ imagePrompt. احتفظ بنفس JSON:\n${ollamaOut}\nأعد JSON محسّن فقط:`,
      model
    );

    const result = parseJSON<any>(text);
    if (!result) {
      return res.status(500).json({ error: "Failed to parse scene response" });
    }

    return res.json({ success: true, provider, scene: result });
  } catch (err: any) {
    logger.error({ error: err.message }, "regenerateScene failed");
    return res.status(500).json({ error: "Failed to regenerate scene", details: err.message });
  }
}

// ==================== TEXT FALLBACK PARSERS ====================

function parseEnhancedIdea(text: string): any {
  const lines = text.split('\n');
  const data: any = { characters: [] };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('العنوان:')) data.title = t.replace('العنوان:', '').trim();
    else if (t.startsWith('الفكرة:') || t.startsWith('المفهوم:')) data.concept = t.split(':').slice(1).join(':').trim();
    else if (t.startsWith('النوع:')) data.genre = t.replace('النوع:', '').trim();
    else if (t.startsWith('الفئة:')) data.targetAge = t.replace('الفئة:', '').trim();
  }
  if (!data.title) data.title = text.slice(0, 60).trim();
  if (!data.concept) data.concept = text.slice(0, 200).trim();
  return data;
}

function parseVariationsFallback(text: string): any[] {
  return [
    { id: 1, title: "النسخة الكوميدية", concept: text.slice(0, 200), tone: "كوميدي", uniqueElement: "مواقف طريفة" },
    { id: 2, title: "النسخة الدرامية", concept: text.slice(0, 200), tone: "درامي", uniqueElement: "عواطف عميقة" },
    { id: 3, title: "النسخة المثيرة", concept: text.slice(0, 200), tone: "أكشن", uniqueElement: "إثارة وتشويق" },
  ];
}

function parseIdeas(text: string): any[] {
  const ideas: any[] = [];
  const works = text.split(/---+/);
  let id = 0;
  for (const work of works) {
    if (!work.trim()) continue;
    const lines = work.split('\n');
    const idea: any = { id: ++id };
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('العنوان:')) idea.title = t.replace('العنوان:', '').trim();
      else if (t.startsWith('الملخص:')) idea.concept = t.replace('الملخص:', '').trim();
      else if (t.startsWith('النوع:')) idea.genre = t.replace('النوع:', '').trim();
      else if (t.startsWith('الفئة:')) idea.targetAudience = t.replace('الفئة:', '').trim();
    }
    if (idea.title) ideas.push(idea);
  }
  return ideas;
}

function parseScript(text: string, versionNumber: number, versionName: string, idCounter: number): Script {
  const lines = text.split('\n');
  let logline = '', synopsis = '';
  const characters: Character[] = [];
  const scenes: Scene[] = [];
  let currentSection = '';
  let currentScene: Partial<Scene> = {};

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('اللوغ لاين:') || t.startsWith('الجملة الرئيسية:')) {
      logline = t.split(':').slice(1).join(':').trim();
    } else if (t.startsWith('الملخص:') && !currentSection) {
      synopsis = t.split(':').slice(1).join(':').trim();
    } else if (t.includes('الشخصيات:')) {
      currentSection = 'characters';
    } else if (t.includes('المشاهد:') || t.includes('السيناريو:')) {
      currentSection = 'scenes';
    } else if (t.match(/^مشهد\s*\d+/i)) {
      if (currentScene.sceneNumber) scenes.push(currentScene as Scene);
      currentScene = {
        id: scenes.length + 1,
        sceneNumber: scenes.length + 1,
        location: '', timeOfDay: '', dialogue: '', action: '', camera: '', imagePrompt: ''
      };
      currentSection = 'scenes';
    } else if (currentSection === 'scenes') {
      if (t.startsWith('المكان:')) currentScene.location = t.replace('المكان:', '').trim();
      else if (t.startsWith('الوقت:')) currentScene.timeOfDay = t.replace('الوقت:', '').trim();
      else if (t.startsWith('الحوار:')) currentScene.dialogue = t.replace('الحوار:', '').trim();
      else if (t.startsWith('الحركة:')) currentScene.action = t.replace('الحركة:', '').trim();
      else if (t.startsWith('الكاميرا:')) currentScene.camera = t.replace('الكاميرا:', '').trim();
      else if (t.startsWith('وصف الصورة:') || t.startsWith('imagePrompt:')) {
        currentScene.imagePrompt = t.split(':').slice(1).join(':').trim();
      }
    }
  }

  if (currentScene.sceneNumber) scenes.push(currentScene as Scene);

  return {
    id: `SCRIPT-${idCounter}`,
    versionName,
    versionNumber,
    logline,
    synopsis,
    characters,
    scenes,
    totalScenes: scenes.length,
  };
}

// ==================== CONSTANTS ====================

const VERSION_NAMES = [
  "الإصدار الكوميدي", "الإصدار الدرامي", "الإصدار المثير",
  "الإصدار الرومانسي", "الإصدار الغامض", "الإصدار الخيالي",
];

const VERSION_TONES = [
  "كوميدي، مضحك، مواقف طريفة، حوار ذكي",
  "درامي، عاطفي، عميق، رسائل قوية",
  "مثير، أكشن، إثارة، حبكة متشعبة",
  "رومانسي، عاطفي، علاقات، مشاعر",
  "غموض، تشويق، تحقيق، إثارة",
  "خيال، سحر، عوالم بديلة",
];

