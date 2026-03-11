import { openai } from '../config/openai';
import { SceneScript } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

export interface EnhancedScenePrompt {
  visual_prompt: string;
  negative_prompt: string;
  style_tags: string[];
}

export class ScenePromptService {
  /**
   * Enhances a scene's visual prompt for optimal image generation results
   */
  async enhance(scene: SceneScript, genre: string, audience: string): Promise<EnhancedScenePrompt> {
    logger.debug('Enhancing scene prompt', { scene_number: scene.scene_number });

    const styleMap: Record<string, string> = {
      'adventure': 'epic animated movie style, dynamic composition, vivid colors',
      'comedy': 'cartoon style, expressive characters, bright cheerful palette',
      'drama': 'cinematic animated style, emotional lighting, detailed backgrounds',
      'sci-fi': 'futuristic animated style, neon accents, high-tech environments',
      'fantasy': 'magical animated style, ethereal lighting, fantastical elements',
      'horror': 'gothic animated style, moody shadows, atmospheric fog',
      'romance': 'soft animated style, warm lighting, dreamy backgrounds',
      'thriller': 'suspenseful animated style, dramatic shadows, tense composition',
      'educational': 'clear and bright animated style, friendly characters, informative',
      'mystery': 'noir-influenced animated style, dramatic lighting, mysterious atmosphere',
    };

    const audienceStyle: Record<string, string> = {
      children: 'cute and colorful, simple shapes, friendly expressions, safe for kids',
      teens: 'stylized anime-influenced, dynamic poses, modern aesthetic',
      adults: 'sophisticated animation, complex backgrounds, mature themes',
      general: 'universally appealing animation style, family-friendly',
    };

    const baseStyle = styleMap[genre] || 'high-quality animated style';
    const audStyle = audienceStyle[audience] || 'family-friendly animation';

    const enhanced: EnhancedScenePrompt = {
      visual_prompt: `${scene.visual_prompt}, ${baseStyle}, ${audStyle}, masterpiece quality, 16:9 aspect ratio`,
      negative_prompt: 'realistic photo, 3D render, blurry, low quality, watermark, text, violence, inappropriate content',
      style_tags: [baseStyle, audStyle, 'animated', 'high quality'],
    };

    return enhanced;
  }

  /**
   * Generates a complete set of scene prompts for an episode
   */
  async generateBatch(
    scenes: SceneScript[],
    genre: string,
    audience: string
  ): Promise<EnhancedScenePrompt[]> {
    logger.info('Generating batch scene prompts', { count: scenes.length });

    const prompt = `You are an AI image generation prompt specialist for animated content.

Given these ${scenes.length} scenes from a ${genre} episode for ${audience} audience, enhance each visual prompt for DALL-E 3.

Scenes:
${scenes.map((s) => `Scene ${s.scene_number}: ${s.visual_prompt}`).join('\n')}

Return JSON array with ${scenes.length} objects:
[{
  "visual_prompt": "Enhanced detailed prompt, include art style: vibrant animated style, cinematic composition, ${genre} genre aesthetics, high quality illustration",
  "negative_prompt": "realistic photo, 3D render, blurry, low quality, nsfw",
  "style_tags": ["tag1", "tag2"]
}]

Make each prompt highly specific, visual, and optimized for DALL-E 3.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);
    const prompts: EnhancedScenePrompt[] = Array.isArray(parsed) ? parsed : parsed.prompts || parsed.scenes || [];

    if (prompts.length !== scenes.length) {
      // Fall back to individual enhancement
      return Promise.all(scenes.map((s) => this.enhance(s, genre, audience)));
    }

    return prompts;
  }
}

export const scenePromptService = new ScenePromptService();
