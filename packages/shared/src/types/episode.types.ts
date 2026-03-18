import { WorkflowConfig, WorkflowState } from "./workflow.types";

/**
 * سكربت المشهد الواحد
 */
export interface SceneScript {
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  narration?: string;
  dialogue?: string;
  character_actions?: string;
  setting?: string;
  duration_seconds?: number;
  // حقول إضافية للتوليد
  generated_image_url?: string;
  generated_voice_url?: string;
  generated_video_url?: string;
  // حالة المشهد
  status: 'pending' | 'processing' | 'completed' | 'failed';
  // معرفات التوليد للمتابعة
  generation_ids?: {
    comfyui_prompt_id?: string;
    voice_job_id?: string;
    video_job_id?: string;
  };
}

/**
 * بيانات السكربت الكامل
 */
export interface EpisodeScript {
  title: string;
  description?: string;
  genre?: string;
  target_audience?: string;
  scenes: SceneScript[];
  characters?: string[];
  duration?: number;
  // بيانات إضافية
  metadata?: {
    generated_at: string;
    model_used: string;
    prompt_tokens?: number;
  };
}

/**
 * بيانات الصور المُنشأة
 */
export interface ImagesData {
  generated: boolean;
  total_scenes: number;
  completed_scenes: number;
  failed_scenes: number;
  pending_approval: boolean;
  approved: boolean;
  scenes_data: {
    scene_number: number;
    image_url: string;
    thumbnail_url: string;
    generated_at: string;
    prompt_used: string;
    status: 'pending' | 'completed' | 'failed';
  }[];
}

/**
 * بيانات الصوت المُنشأ
 */
export interface VoiceData {
  generated: boolean;
  total_scenes: number;
  completed_scenes: number;
  approved: boolean;
  scenes_data: {
    scene_number: number;
    voice_url: string;
    duration_seconds: number;
    voice_id: string;
    generated_at: string;
  }[];
}

/**
 * بيانات الموسيقى المُنشأة
 */
export interface MusicData {
  generated: boolean;
  music_url: string;
  duration_seconds: number;
  genre: string;
  approved: boolean;
  generated_at: string;
}

/**
 * سجل موافقة واحد
 */
export interface ApprovalLog {
  id: string;
  step: 'script' | 'images' | 'voice' | 'music' | 'final';
  action: 'approved' | 'rejected' | 'requested_changes';
  approved_by?: string;
  approved_by_name?: string;
  comment?: string;
  created_at: string;
  // التعديلات المطلوبة (في حالة requested_changes)
  requested_changes?: {
    field: string;
    old_value: string;
    new_value: string;
  }[];
}

/**
 * حلقة واحدة
 */
export interface Episode {
  // البيانات الأساسية
  id: string;
  project_id: string;
  title: string;
  description?: string;
  idea?: string;
  
  // التصنيف
  genre?: string;
  target_audience?: string;
  tags?: string[];
  
  // حالة النشر
  status: 'draft' | 'generating' | 'processing' | 'waiting_approval' | 'approved' | 'completed' | 'published' | 'archived';
  episode_number?: number;
  season_number?: number;
  
  // سير العمل
  workflow_step: 'idea' | 'script' | 'scenes' | 'images' | 'voice' | 'music' | 'subtitles' | 'animation' | 'assembly' | 'final';
  workflow_status: 'pending' | 'processing' | 'waiting_approval' | 'approved' | 'rejected' | 'completed';
  workflow_progress: number; // 0-100
  
  // البيانات المُنشأة
  script_data?: EpisodeScript;
  images_data?: ImagesData;
  voice_data?: VoiceData;
  music_data?: MusicData;
  final_video_url?: string;
  final_video_hd_url?: string;
  subtitle_url?: string;
  thumbnail_url?: string;
  
  // الموافقات
  approval_steps: ('script' | 'images' | 'voice' | 'music' | 'final')[];
  approvals_log: ApprovalLog[];
  current_approval_step?: string;
  
  // المدة والحجم
  duration_seconds?: number;
  file_size_bytes?: number;
  
  // المؤشرات
  view_count: number;
  like_count: number;
  share_count: number;
  
  // البيانات الوصفية
  metadata?: {
    // إعدادات التوليد المستخدمة
    generation_settings?: {
      scene_count: number;
      image_width: number;
      image_height: number;
      video_quality: 'sd' | 'hd' | '4k';
    };
    // سجل التوليد
    generation_history?: {
      step: string;
      started_at: string;
      completed_at?: string;
      error?: string;
    }[];
    // إحصائيات
    stats?: {
      total_generation_time?: number;
      retry_count?: number;
      cost_estimate?: number;
    };
  };
  
  // معلومات الإنشاء
  created_by?: string;
  created_by_name?: string;
  published_at?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * مشروع (مجموعة من الحلقات)
 */
export interface Project {
  // البيانات الأساسية
  id: string;
  title: string;
  description?: string;
  
  // التصنيف
  genre?: string;
  target_audience?: string;
  tags?: string[];
  
  // الحالة
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // إعدادات سير العمل
  workflow_settings: {
    approval_steps: ('script' | 'images' | 'voice' | 'music' | 'final')[];
    auto_publish: boolean;
    default_scene_count: number;
    default_video_quality: 'sd' | 'hd' | '4k';
  };
  
  // إحصائيات
  stats: {
    total_episodes: number;
    completed_episodes: number;
    in_progress_episodes: number;
    waiting_approval_episodes: number;
    total_duration_seconds: number;
    total_views: number;
    total_likes: number;
  };
  
  // تقدم المشروع
  progress: number; // 0-100
  
  // معلومات الإنشاء
  created_by?: string;
  created_by_name?: string;
  createdAt: string;
  updatedAt: string;
  
  // الحلقات (اختياري - للعرض المفصل)
  episodes?: Episode[];
}

/**
 * ملخص الحلقة (للعرض في القوائم)
 */
export interface EpisodeSummary {
  id: string;
  project_id: string;
  title: string;
  episode_number?: number;
  thumbnail_url?: string;
  status: Episode['status'];
  workflow_step: Episode['workflow_step'];
  workflow_progress: number;
  duration_seconds?: number;
  view_count: number;
  like_count: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ملخص المشروع (للعرض في القوائم)
 */
export interface ProjectSummary {
  id: string;
  title: string;
  genre?: string;
  status: Project['status'];
  progress: number;
  stats: Project['stats'];
  updatedAt: string;
}
