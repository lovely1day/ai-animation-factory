import { ScriptWritingInput, EpisodeScript } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';
import { hybridGenerateScript } from './hybrid-ai.service';

export class ScriptWriterService {
  async write(input: ScriptWritingInput): Promise<EpisodeScript> {
    logger.info({ episode_id: input.episode_id, scene_count: input.scene_count }, 'Writing episode script (hybrid)');

    const { idea, scene_count } = input;

    const prompt = `You are an elite Hollywood cinematographer and screenwriter. Write a cinematic shot-by-shot breakdown.

Episode Concept:
- Title: ${idea.title}
- Description: ${idea.description}
- Genre: ${idea.genre}
- Target Audience: ${idea.target_audience}
- Theme: ${idea.theme}

Create exactly ${scene_count} SHOTS (not scenes). Think like a film director:
- Each shot = 2-4 seconds of screen time
- Vary shot types: establishing, wide, medium, close-up, extreme close-up, POV, over-shoulder, aerial
- Vary camera movement: static, slow pan, zoom in, dolly, crane up, tracking
- Use cinematic transitions: cut, fade, dissolve, match cut
- First 3 shots must HOOK the viewer instantly (dramatic, mysterious, or breathtaking)
- Last 2-3 shots must leave emotional impact (cliffhanger, revelation, or powerful closure)
- Middle shots build tension, develop characters, advance plot

Return ONLY a JSON object with exactly this structure:
{
  "title": "${idea.title}",
  "description": "${idea.description}",
  "genre": "${idea.genre}",
  "target_audience": "${idea.target_audience}",
  "tags": ${JSON.stringify(idea.tags)},
  "scenes": [
    {
      "scene_number": 1,
      "title": "ESTABLISHING - City skyline at dawn",
      "description": "[WIDE SHOT, SLOW PAN] What the camera sees in this exact frame",
      "visual_prompt": "Cinematic wide shot, golden hour dawn light over ancient city skyline, mist rising from valleys, volumetric lighting, dramatic shadows, film grain, anamorphic lens flare, 35mm film look, masterpiece composition. 40-60 words.",
      "dialogue": "Character dialogue OR 'NARRATOR: voice-over'. Max 25 words. Empty string if no dialogue.",
      "narration": "Internal thoughts, atmosphere, or scene-setting narration. Max 20 words.",
      "duration_seconds": 3
    }
  ]
}

CINEMATOGRAPHY RULES:
- Exactly ${scene_count} shots — no more, no less
- visual_prompt MUST include: shot type, lighting, mood, color palette, camera angle, film style. Be SPECIFIC.
- Duration: 2-4 seconds per shot (total ~60-90 seconds)
- Dialogue: short, impactful, natural for ${idea.target_audience}. Use "" for silent shots.
- Pacing: fast cuts for action/tension, longer holds for emotion/beauty
- Color: maintain consistent palette per mood (warm=hope, cool=danger, desaturated=despair)
- NEVER repeat the same shot type twice in a row
- Include at least 2 reaction shots (character emotions)
- Include at least 1 detail/insert shot (hands, eyes, objects)
- Return valid JSON only`;

    const context = `Title: ${idea.title}, Genre: ${idea.genre}, Audience: ${idea.target_audience}`;

    // Use cloud-only in production (no Ollama on Railway), hybrid locally
    const isProduction = process.env.NODE_ENV === 'production';
    const { result, engine, reviewed } = await hybridGenerateScript<EpisodeScript>(
      prompt,
      context,
      {
        mode: isProduction ? 'cloud-only' : 'hybrid',
        ollamaModel: 'mistral',
        skipReview: false,
      }
    );

    if (result.scenes?.length !== scene_count) {
      logger.warn({ expected: scene_count, got: result.scenes?.length, engine }, 'Scene count mismatch');
    }

    logger.info({ episode_id: input.episode_id, scenes: result.scenes?.length, engine, reviewed }, 'Script written');
    return result;
  }
}

export const scriptWriterService = new ScriptWriterService();
