export const JOB_QUEUE_NAMES = {
  IDEA: 'idea-generation',
  SCRIPT: 'script-writing',
  IMAGE: 'image-generation',
  ANIMATION: 'animation-generation',
  VOICE: 'voice-generation',
  MUSIC: 'music-generation',
  ASSEMBLY: 'video-assembly',
  SUBTITLE: 'subtitle-generation',
  THUMBNAIL: 'thumbnail-generation',
} as const;

export type JobQueueName = typeof JOB_QUEUE_NAMES[keyof typeof JOB_QUEUE_NAMES];