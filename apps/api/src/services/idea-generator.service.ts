import { openai } from '../config/openai';
import { IdeaGenerationInput, IdeaGenerationOutput } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

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

export class IdeaGeneratorService {
  async generate(input: IdeaGenerationInput): Promise<IdeaGenerationOutput> {
    logger.info('Generating episode idea', input);

    const genreHint = GENRES_PROMPTS[input.genre] || input.genre;
    const audienceHint = AUDIENCE_PROMPTS[input.target_audience] || input.target_audience;
    const themeHint = input.theme ? `Theme: ${input.theme}.` : '';

    const prompt = `You are a creative director for an animated series. Generate an original episode concept.

Genre: ${input.genre} (${genreHint})
Target Audience: ${input.target_audience} (${audienceHint})
${themeHint}

Create a compelling, unique episode idea. Return a JSON object with:
{
  "title": "Episode title (5-10 words, catchy)",
  "description": "2-3 sentence synopsis",
  "genre": "${input.genre}",
  "target_audience": "${input.target_audience}",
  "theme": "Core theme/moral of the episode",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Be creative, original, and ensure the content is appropriate for the target audience.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const idea = JSON.parse(content) as IdeaGenerationOutput;
    logger.info('Episode idea generated', { title: idea.title });

    return idea;
  }
}

export const ideaGeneratorService = new IdeaGeneratorService();
