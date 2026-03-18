import { ScriptWritingInput, EpisodeScript } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';
import { hybridGenerateScript } from './hybrid-ai.service';

export class ScriptWriterService {
  async write(input: ScriptWritingInput): Promise<EpisodeScript> {
    logger.info({ episode_id: input.episode_id, scene_count: input.scene_count }, 'Writing episode script (hybrid)');

    const { idea, scene_count } = input;

    const prompt = `You are a professional animated series scriptwriter. Write a complete episode script.

Episode Concept:
- Title: ${idea.title}
- Description: ${idea.description}
- Genre: ${idea.genre}
- Target Audience: ${idea.target_audience}
- Theme: ${idea.theme}

Write exactly ${scene_count} scenes. Each scene = 6-10 seconds of animation content.

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
      "title": "Scene title",
      "description": "What happens visually in this scene",
      "visual_prompt": "Detailed prompt for AI image generation. Include: art style (vibrant animated, cel-shaded), colors, lighting, characters appearance, setting details, camera angle. 30-50 words.",
      "dialogue": "Character says this OR 'NARRATOR: voice-over text'. Max 30 words.",
      "narration": "Background narration or atmosphere description. Max 25 words.",
      "duration_seconds": 8
    }
  ]
}

Rules:
- Exactly ${scene_count} scenes — no more, no less
- visual_prompt must be rich and specific for image generation
- Dialogue should feel natural for ${idea.target_audience} audience
- Each scene flows naturally into the next (good pacing)
- Return valid JSON only`;

    const context = `Title: ${idea.title}, Genre: ${idea.genre}, Audience: ${idea.target_audience}`;

    const { result, engine, reviewed } = await hybridGenerateScript<EpisodeScript>(
      prompt,
      context,
      {
        mode: 'hybrid',
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
