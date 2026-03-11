export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateJobId(type: string, episodeId: string): string {
  return `${type}:${episodeId}:${Date.now()}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number = 1000
): Promise<T> {
  return fn().catch(async (err) => {
    if (attempts <= 1) throw err;
    await sleep(delayMs);
    return retry(fn, attempts - 1, delayMs * 2);
  });
}

export const GENRES = [
  'adventure', 'comedy', 'drama', 'sci-fi', 'fantasy',
  'horror', 'romance', 'thriller', 'educational', 'mystery'
] as const;

export const AUDIENCES = ['children', 'teens', 'adults', 'general'] as const;

export const JOB_QUEUE_NAMES = {
  IDEA: 'idea-generation',
  SCRIPT: 'script-writing',
  IMAGE: 'image-generation',
  ANIMATION: 'animation',
  VOICE: 'voice-generation',
  MUSIC: 'music-generation',
  ASSEMBLY: 'video-assembly',
  SUBTITLE: 'subtitle-generation',
  THUMBNAIL: 'thumbnail-generation',
} as const;
