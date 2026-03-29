import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ── System prompt ────────────────────────────────────────────────
const SYSTEM = `You are a Character DNA Extractor. Your job is to analyze an image and extract a structured DNA specification that can be used to regenerate a similar subject using ANY AI image generation tool.

You support these subject types:
- human: a person or portrait
- animal: any animal or creature
- vehicle: car, motorcycle, plane, etc.
- place: landscape, building, room, environment
- object: any inanimate object, food, item
- creature: fantasy/fictional beings

For the DNA string, use this format: v1|TYPE:<type>|<KEY>:<VALUE>|...

For HUMAN subjects, use these DNA keys (use as many as relevant):
G (gender: M/F), FS (face_shape: oval/round/square/heart/oblong), FH (forehead: wide/narrow/medium),
ES (eye_shape: almond/round/hooded/monolid/upturned/downturned/deep-set),
EZ (eye_size: small/medium/large), EC (eye_color: brown/blue/green/hazel/black/gray/amber),
NS (nose_shape: straight/button/roman/snub/wide/narrow), NB (nose_bridge: high/low/medium),
LS (lip_shape: thin/medium/full/cupid-bow/wide/narrow),
CH (chin: round/square/pointed/cleft/weak), JW (jawline: sharp/soft/wide/narrow),
NK (neck: long/medium/short), HS (hair_style: straight/wavy/curly/coily/braids/locs/bun/bob/pixie/buzz),
HL (hair_length: short/medium/long/very-long/bald), HC (hair_color: black/brown/blonde/red/gray/white/auburn/dyed),
SK (skin_tone: fair/light/medium/tan/brown/dark), SU (skin_undertone: cool/warm/neutral),
BT (body_type: slim/athletic/average/curvy/plus), ERA (era: modern/vintage/futuristic/medieval/etc)

For NON-HUMAN subjects, use descriptive keys:
TYPE:<type>|SUBJ:<subject_name>|CLR:<primary_colors>|STY:<art_style>|MOOD:<mood>|ENV:<environment>|LIGHT:<lighting>|COMP:<composition>|DETAIL:<key_detail_1;key_detail_2;...>

Return ONLY valid JSON (no markdown, no explanation):
{
  "subjectType": "human|animal|vehicle|place|object|creature",
  "subjectTypeLabel": "human-readable label in Arabic",
  "dna": "v1|TYPE:human|G:M|FS:oval|...",
  "dnaJson": {"G": "M", "FS": "oval", ...},
  "prompts": {
    "comfyui": {
      "positive": "masterpiece, best quality, ultra detailed, photorealistic, [gender], [era], [features], cinematic lighting, detailed face, sharp focus, 8k resolution",
      "negative": "blurry, bad anatomy, bad hands, ugly, deformed, disfigured, low quality, watermark, text, signature, extra limbs"
    },
    "midjourney": "full Midjourney prompt --ar 2:3 --style raw --v 6 --q 2",
    "gemini": "full natural language prompt for Gemini/Imagen — detailed photorealistic description paragraph",
    "dalle": "full DALL-E prompt (concise, clear description for content policy compliance)",
    "chatgpt": "full ChatGPT/GPT-4o prompt — instructional style: 'Create a highly detailed photorealistic portrait...'",
    "grok": "full Grok/Aurora prompt — photorealistic style with era context",
    "stableDiffusion": "full SD/SDXL positive tags — score_9, score_8_up, [gender_short], [era], [features], photorealistic, masterpiece",
    "flux": "full FLUX prompt — natural language, highly detailed, emphasize realism and consistency",
    "universal": "clean universal prompt usable in any tool — balanced between natural language and tags"
  },
  "negativePrompt": "bad anatomy, blurry, deformed, low quality, watermark, extra limbs, disfigured, ugly, duplicate, mutated",
  "characterCard": {
    "name": "Unnamed Character",
    "gender": "Male|Female|N/A",
    "era": "era label or N/A",
    "yearRange": "year range or N/A",
    "features": ["feature1", "feature2", "feature3"],
    "dna": "same DNA string as above"
  },
  "description": "2-3 sentence description of the subject in Arabic",
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "regenerationNotes": "Tips for best regeneration in Arabic — seeds, model recommendations, lighting notes, etc."
}`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرفاق صورة" }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif") || "image/jpeg";

    // Call Claude Vision
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Analyze this image and extract the full Character DNA specification with ALL 9 platform prompts. Return only valid JSON.",
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Clean and parse JSON
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("[extract-dna]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
