export type JobType =
  | 'idea_generation'
  | 'script_writing'
  | 'scene_prompts'
  | 'image_generation'
  | 'animation'
  | 'voice_generation'
  | 'music_generation'
  | 'video_assembly'
  | 'subtitle_generation'
  | 'thumbnail_generation';

export type JobStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export interface GenerationJob {
  id: string;
  episode_id: string;
  job_type: JobType;
  status: JobStatus;
  bull_job_id?: string;
  progress: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  error_stack?: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobProgress {
  job_id: string;
  episode_id: string;
  job_type: JobType;
  status: JobStatus;
  progress: number;
  message?: string;
}

export interface EpisodeGenerationRequest {
  genre?: string;
  target_audience?: string;
  theme?: string;
  scene_count?: number;
  episode_id?: string;
}

export interface IdeaGenerationInput {
  genre: string;
  target_audience: string;
  theme?: string;
}

export interface IdeaGenerationOutput {
  title: string;
  description: string;
  genre: string;
  target_audience: string;
  theme: string;
  tags: string[];
}

export interface ScriptWritingInput {
  episode_id: string;
  idea: IdeaGenerationOutput;
  scene_count: number;
}

export interface ImageGenerationInput {
  episode_id: string;
  scene_id: string;
  scene_number: number;
  visual_prompt: string;
  style?: string;
}

export interface AnimationInput {
  episode_id: string;
  scene_id: string;
  image_url: string;
  prompt: string;
  duration: number;
}

export interface VoiceGenerationInput {
  episode_id: string;
  scene_id: string;
  text: string;
  voice_id?: string;
}

export interface MusicGenerationInput {
  episode_id: string;
  genre: string;
  mood: string;
  duration: number;
}

export interface VideoAssemblyInput {
  episode_id: string;
  scenes: Array<{
    scene_id: string;
    scene_number: number;
    animation_url?: string;
    image_url?: string;
    voice_url?: string;
    duration_seconds: number;
  }>;
  music_url?: string;
}

export interface SubtitleGenerationInput {
  episode_id: string;
  video_url: string;
}

export interface ThumbnailGenerationInput {
  episode_id: string;
  title: string;
  genre: string;
  style?: string;
}
