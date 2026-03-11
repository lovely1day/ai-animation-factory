// Queue names for BullMQ
export const JOB_QUEUE_NAMES = {
  IDEA: 'idea-generation',
  SCRIPT: 'script-generation',
  IMAGE: 'image-generation',
  VOICE: 'voice-generation',
  VIDEO: 'video-generation',
  MUSIC: 'music-generation',
  SUBTITLE: 'subtitle-generation',
  ASSEMBLY: 'video-assembly',
  THUMBNAIL: 'thumbnail-generation',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics'
} as const;

export type JobQueueName = typeof JOB_QUEUE_NAMES[keyof typeof JOB_QUEUE_NAMES];
