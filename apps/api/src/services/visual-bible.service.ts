/**
 * Visual Bible — locks style + characters + locations across all scenes of an episode.
 * Goal: every Pollinations prompt for the same episode shares the same DNA so the
 * 25 shots feel like one film instead of 25 random pictures.
 */
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type VisualStyle =
  | 'cinematic_realistic'
  | 'anime'
  | 'pixar_3d'
  | 'watercolor'
  | 'black_and_white'
  | 'comic_book'
  | 'oil_painting'
  | 'photorealistic';

const STYLE_PRESETS: Record<VisualStyle, string> = {
  cinematic_realistic:
    'cinematic live-action film, anamorphic lens, 35mm film grain, warm color grading, dramatic lighting, photorealistic, masterpiece composition',
  anime:
    'anime style, Studio Ghibli influence, hand-drawn, soft watercolor backgrounds, expressive characters, vibrant colors, cel-shaded',
  pixar_3d:
    'Pixar 3D animation, soft global illumination, expressive stylized characters, vibrant colors, family-friendly, polished render',
  watercolor:
    'watercolor painting, soft brushstrokes, paper texture, muted earthy palette, dreamy atmosphere, hand-painted illustration',
  black_and_white:
    'black and white photography, high contrast, dramatic chiaroscuro lighting, classic film noir, 35mm grain, monochrome',
  comic_book:
    'comic book art, bold ink outlines, halftone dots, cel-shaded, dynamic angles, vibrant flat colors, graphic novel style',
  oil_painting:
    'classical oil painting, rich textured brushstrokes, Rembrandt lighting, deep shadows, museum quality, painterly',
  photorealistic:
    'hyper-photorealistic, ultra-detailed, professional photography, natural lighting, 8k quality, sharp focus',
};

export interface VisualBible {
  style_lock: string;
  characters: Record<string, string>; // name -> description
  locations: Record<string, string>; // name -> description
}

export interface SceneInput {
  scene_number: number;
  description?: string;
  visual_prompt?: string;
  dialogue?: string;
  narration?: string;
}

export async function buildVisualBible(
  scenes: SceneInput[],
  style: VisualStyle,
  episodeTitle: string
): Promise<VisualBible> {
  const styleLock = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic_realistic;

  const sceneDump = scenes
    .map(
      (s) =>
        `#${s.scene_number}: ${s.description || ''} | ${s.visual_prompt || ''} | dialogue: ${s.dialogue || ''}`
    )
    .join('\n');

  const prompt = `You are a film production designer. Read these ${scenes.length} scenes from "${episodeTitle}" and extract:
1. Every recurring CHARACTER (name + frozen visual description: age, clothing, hair, distinctive features — 15-25 words each)
2. Every recurring LOCATION (name + frozen visual description: setting, lighting, key features — 15-25 words each)

Return ONLY valid JSON, no commentary:
{
  "characters": { "character_name": "frozen visual description in english", ... },
  "locations": { "location_name": "frozen visual description in english", ... }
}

All descriptions must be in ENGLISH (used by image generator). Use lowercase snake_case names.

Scenes:
${sceneDump}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    const bible: VisualBible = {
      style_lock: styleLock,
      characters: parsed.characters || {},
      locations: parsed.locations || {},
    };

    logger.info(
      {
        style,
        chars: Object.keys(bible.characters).length,
        locs: Object.keys(bible.locations).length,
      },
      'Visual Bible built'
    );
    return bible;
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Visual Bible extraction failed — using style only');
    return { style_lock: styleLock, characters: {}, locations: {} };
  }
}

/**
 * Inject the bible into a single scene's prompt.
 * Heuristic: include any character/location whose name (or first word) appears in the scene text.
 */
export function injectBible(
  scenePrompt: string,
  sceneText: string,
  bible: VisualBible
): string {
  const haystack = (scenePrompt + ' ' + sceneText).toLowerCase();
  const parts: string[] = [bible.style_lock];

  for (const [name, desc] of Object.entries(bible.characters)) {
    const key = name.toLowerCase().replace(/_/g, ' ');
    const firstWord = key.split(' ')[0];
    if (haystack.includes(key) || haystack.includes(firstWord)) {
      parts.push(`${name}: ${desc}`);
    }
  }

  for (const [name, desc] of Object.entries(bible.locations)) {
    const key = name.toLowerCase().replace(/_/g, ' ');
    const firstWord = key.split(' ')[0];
    if (haystack.includes(key) || haystack.includes(firstWord)) {
      parts.push(`${name}: ${desc}`);
    }
  }

  // If no character/location matched, still include all characters (better consistency than nothing)
  if (parts.length === 1 && Object.keys(bible.characters).length > 0) {
    for (const [name, desc] of Object.entries(bible.characters)) {
      parts.push(`${name}: ${desc}`);
    }
  }

  return `[${parts.join(' | ')}] ${scenePrompt}`;
}
