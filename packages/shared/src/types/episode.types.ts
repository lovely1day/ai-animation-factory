export type EpisodeStatus =
  | 'pending'
  | 'generating'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'published'
  | 'archived';

export type EpisodeGenre =
  | 'adventure'
  | 'comedy'
  | 'drama'
  | 'sci-fi'
  | 'fantasy'
  | 'horror'
  | 'romance'
  | 'thriller'
  | 'educational'
  | 'mystery';

export type TargetAudience = 'children' | 'teens' | 'adults' | 'general';

export interface Episode {
  id: string;
  title: string;
  description?: string;
  genre: EpisodeGenre;
  target_audience: TargetAudience;
  status: EpisodeStatus;
  duration_seconds?: number;
  thumbnail_url?: string;
  video_url?: string;
  video_url_hd?: string;
  subtitle_url?: string;
  episode_number?: number;
  season_number: number;
  tags: string[];
  metadata: Record<string, unknown>;
  view_count: number;
  like_count: number;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  episode_id: string;
  scene_number: number;
  title?: string;
  description?: string;
  visual_prompt: string;
  dialogue?: string;
  narration?: string;
  duration_seconds: number;
  image_url?: string;
  animation_url?: string;
  voice_url?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  episode_id?: string;
  scene_id?: string;
  asset_type: 'image' | 'animation' | 'voice' | 'music' | 'video' | 'thumbnail' | 'subtitle';
  file_url: string;
  file_key: string;
  file_size_bytes?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EpisodeScript {
  title: string;
  description: string;
  genre: EpisodeGenre;
  target_audience: TargetAudience;
  tags: string[];
  scenes: SceneScript[];
}

export interface SceneScript {
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  dialogue: string;
  narration: string;
  duration_seconds: number;
}
