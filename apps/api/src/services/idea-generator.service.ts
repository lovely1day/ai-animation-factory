import { IdeaGenerationInput, IdeaGenerationOutput } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';
import { hybridGenerateIdea } from './hybrid-ai.service';

const GENRES_PROMPTS: Record<string, string> = {
  adventure: 'exciting quest, exploration, discovery, brave heroes',
  comedy: 'funny situations, humorous characters, lighthearted mishaps',
  drama: 'emotional depth, character growth, meaningful relationships',
  'sci-fi': 'futuristic technology, space, AI, scientific concepts',
  fantasy: 'magic, mythical creatures, enchanted worlds',
  horror: 'suspense, mystery, eerie atmosphere (age-appropriate)',
  romance: 'heartwarming connections, love stories',
  thriller: 'suspense, plot twists, mystery solving',
  educational: 'learning, curiosity, science, history, culture',
  mystery: 'puzzles, clues, detective work, problem solving',
};

const AUDIENCE_PROMPTS: Record<string, string> = {
  children: 'simple vocabulary, positive messages, colorful, fun characters (ages 4-10)',
  teens: 'relatable situations, identity, friendship, adventure (ages 11-17)',
  adults: 'complex themes, mature storytelling, sophisticated humor',
  general: 'universally appealing, family-friendly',
};

export type OllamaModel = 'mistral' | 'llama3' | 'qwen2.5:7b';

export class IdeaGeneratorService {
  async generate(
    input: IdeaGenerationInput,
    ollamaModel: OllamaModel = 'mistral',
    skipReview = false,
  ): Promise<IdeaGenerationOutput & { engine: string; reviewed: boolean }> {
    logger.info({ genre: input.genre, audience: input.target_audience, ollamaModel }, 'Generating episode idea');

    const genreHint    = GENRES_PROMPTS[input.genre] || input.genre;
    const audienceHint = AUDIENCE_PROMPTS[input.target_audience] || input.target_audience;
    const themeHint    = input.theme ? `Theme: ${input.theme}.` : '';

    const prompt = `You are a creative director for an animated series. Generate an original episode concept.

Genre: ${input.genre} (${genreHint})
Target Audience: ${input.target_audience} (${audienceHint})
${themeHint}

Create a compelling, unique episode idea. Return ONLY a JSON object with exactly this structure:
{
  "title": "Episode title (5-10 words, catchy and memorable)",
  "description": "2-3 sentence synopsis that hooks the viewer",
  "genre": "${input.genre}",
  "target_audience": "${input.target_audience}",
  "theme": "Core theme or moral lesson of the episode",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Be creative, original, avoid clichés. Return valid JSON only.`;

    const context = `Genre: ${input.genre}, Audience: ${input.target_audience}`;

    const { result, engine, reviewed } = await hybridGenerateIdea<IdeaGenerationOutput>(
      prompt,
      context,
      { mode: 'hybrid', ollamaModel, skipReview },
    );

    logger.info({ title: result.title, engine, reviewed, ollamaModel }, 'Episode idea generated');
    return { ...result, engine, reviewed };
  }
}

export const ideaGeneratorService = new IdeaGeneratorService();
