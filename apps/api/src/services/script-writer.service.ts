import { openai } from '../config/openai';
import { ScriptWritingInput, EpisodeScript } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

export class ScriptWriterService {
  async write(input: ScriptWritingInput): Promise<EpisodeScript> {
    logger.info('Writing episode script', { episode_id: input.episode_id, scene_count: input.scene_count });

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
- Make visual_prompt extremely detailed for DALL-E image generation
- Include art style: "vibrant animated style, cel-shaded, colorful"
- Each scene should flow naturally to the next
- Keep dialogue concise and natural
- Ensure content is appropriate for ${idea.target_audience} audience`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const script = JSON.parse(content) as EpisodeScript;

    // Validate scene count
    if (script.scenes.length !== scene_count) {
      logger.warn('Scene count mismatch', {
        expected: scene_count,
        got: script.scenes.length,
      });
    }

    logger.info('Script written', { episode_id: input.episode_id, scenes: script.scenes.length });
    return script;
  }
}

export const scriptWriterService = new ScriptWriterService();
