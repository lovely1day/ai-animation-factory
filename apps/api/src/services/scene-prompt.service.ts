import { generateJSON } from '../config/ai-provider';
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
    logger.debug({ scene_number: scene.scene_number }, 'Enhancing scene prompt');

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
    logger.info({ count: scenes.length }, 'Generating batch scene prompts');

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

    const prompt = `You are an AI image generation prompt specialist for animated content.

Given these ${scenes.length} scenes from a ${genre} episode for ${audience} audience, enhance each visual prompt for image generation.

Scenes:
${scenes.map((s) => `Scene ${s.scene_number}: ${s.visual_prompt}`).join('\n')}

Art Style Context:
- Genre Style: ${baseStyle}
- Audience Style: ${audStyle}
- Quality: masterpiece, high quality illustration
- Aspect Ratio: 16:9

Return JSON array with ${scenes.length} objects:
[{
  "visual_prompt": "Enhanced detailed prompt with art style, cinematic composition, high quality illustration",
  "negative_prompt": "realistic photo, 3D render, blurry, low quality, nsfw, text, watermark",
  "style_tags": ["tag1", "tag2", "tag3"]
}]

Make each prompt highly specific, visual, and optimized for AI image generation.`;

    try {
      // Use Gemini or auto-select best available provider
      const prompts = await generateJSON<EnhancedScenePrompt[]>(prompt, {
        provider: 'auto', // Will auto-select Gemini if available
      });

      if (prompts.length !== scenes.length) {
        logger.warn({ expected: scenes.length, got: prompts.length }, 'Scene count mismatch');
        // Fall back to individual enhancement
        return Promise.all(scenes.map((s) => this.enhance(s, genre, audience)));
      }

      return prompts;
    } catch (error) {
      logger.error({ error }, 'Failed to generate batch prompts, falling back to individual enhancement');
      // Fall back to individual enhancement
      return Promise.all(scenes.map((s) => this.enhance(s, genre, audience)));
    }
  }
}

export const scenePromptService = new ScenePromptService();
