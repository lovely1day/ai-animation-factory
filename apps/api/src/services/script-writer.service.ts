import { geminiJSON } from '../config/gemini';
import { ScriptWritingInput, EpisodeScript } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

export class ScriptWriterService {
  async write(input: ScriptWritingInput): Promise<EpisodeScript> {
    logger.info({ episode_id: input.episode_id, scene_count: input.scene_count }, 'Writing episode script');

    const { idea, scene_count } = input;

    const prompt = `You are a professional animated series scriptwriter. Write a complete script for this episode.

Episode Concept:
- Title: ${idea.title}
- Description: ${idea.description}
- Genre: ${idea.genre}
- Target Audience: ${idea.target_audience}
- Theme: ${idea.theme}

Write exactly ${scene_count} scenes. Each scene should be 6-10 seconds of content.

Return a JSON object with this exact structure:
{
  "title": "${idea.title}",
  "description": "${idea.description}",
  "genre": "${idea.genre}",
  "target_audience": "${idea.target_audience}",
  "tags": ${JSON.stringify(idea.tags)},
  "scenes": [
    {
      "scene_number": 1,
      "title": "Scene title",
      "description": "What happens in this scene",
      "visual_prompt": "Detailed description for AI image generation - include art style, colors, composition, characters, setting. Be very specific and visual.",
      "dialogue": "Character dialogue or 'NARRATOR:' prefix for narration. Keep under 30 words.",
      "narration": "Narrator voice-over text. Keep under 25 words.",
      "duration_seconds": 8
    }
  ]
}

Important:
- Make visual_prompt extremely detailed for image generation
- Include art style: "vibrant animated style, cel-shaded, colorful"
- Each scene should flow naturally to the next
- Keep dialogue concise and natural
- Ensure content is appropriate for ${idea.target_audience} audience
- Return exactly ${scene_count} scenes`;

    const script = await geminiJSON<EpisodeScript>(prompt);

    if (script.scenes.length !== scene_count) {
      logger.warn({ expected: scene_count, got: script.scenes.length }, 'Scene count mismatch');
    }

    logger.info({ episode_id: input.episode_id, scenes: script.scenes.length }, 'Script written');
    return script;
  }
}

export const scriptWriterService = new ScriptWriterService();
