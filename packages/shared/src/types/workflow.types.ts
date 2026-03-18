/**
 * أنواع سير العمل (Workflow)
 */

// أنواع خطوات سير العمل
export type WorkflowStep =
  | "idea"           // الفكرة
  | "script"         // السكربت
  | "scenes"         // تجزئة المشاهد
  | "images"         // توليد الصور
  | "voice"          // توليد الصوت
  | "music"          // توليد الموسيقى
  | "subtitles"      // توليد الترجمة
  | "animation"      // توليد الحركة
  | "assembly"       // تجميع الفيديو
  | "final";         // المراجعة النهائية

// حالات سير العمل
export type WorkflowStatus =
  | "pending"          // في الانتظار
  | "processing"       // قيد المعالجة
  | "waiting_approval" // بانتظار الموافقة
  | "approved"         // تمت الموافقة
  | "rejected"         // تم الرفض
  | "completed";       // مكتمل

// أوضاع التوليد
export type GenerationMode =
  | "auto"      // تلقائي (بدون موافقات)
  | "manual"    // يدوي (مع موافقات)
  | "custom";   // مخصص

// خطوات الموافقة الافتراضية
export const DEFAULT_APPROVAL_STEPS: WorkflowStep[] = ['script', 'images'];

// ترتيب خطوات سير العمل
export const WORKFLOW_STEPS_ORDER: WorkflowStep[] = [
  'idea',
  'script',
  'scenes',
  'images',
  'voice',
  'music',
  'subtitles',
  'animation',
  'assembly',
  'final'
];

// تكوين سير العمل
export interface WorkflowConfig {
  mode: GenerationMode;
  approvalSteps: WorkflowStep[];
  settings?: {
    auto_proceed_on_approval?: boolean;
    notify_on_completion?: boolean;
    allow_step_revert?: boolean;
    require_final_approval?: boolean;
  };
}

// حالة سير العمل الحالية
export interface WorkflowState {
  currentStep: WorkflowStep;
  status: WorkflowStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  estimatedCompletionAt?: string;
  // معلومات إضافية
  currentJobId?: string;
  queuePosition?: number;
  processingMessage?: string;
}

// سجل حدث في سير العمل
export interface WorkflowEvent {
  id: string;
  step: WorkflowStep;
  event_type: 'started' | 'progress' | 'completed' | 'failed' | 'approved' | 'rejected';
  timestamp: string;
  data?: {
    progress?: number;
    message?: string;
    error?: string;
    output?: any;
  };
}

// تفاصيل خطوة معينة
export interface WorkflowStepDetails {
  step: WorkflowStep;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  estimated_duration_seconds: number;
  requires_approval: boolean;
  can_retry: boolean;
  inputs: string[];
  outputs: string[];
}

// معلومات الخطوات
export const WORKFLOW_STEP_DETAILS: Record<WorkflowStep, WorkflowStepDetails> = {
  idea: {
    step: 'idea',
    name: 'Idea',
    name_ar: 'الفكرة',
    description: 'Generate episode idea and concept',
    description_ar: 'توليد فكرة ومفهوم الحلقة',
    icon: 'Lightbulb',
    estimated_duration_seconds: 30,
    requires_approval: false,
    can_retry: true,
    inputs: ['title', 'description', 'genre', 'target_audience'],
    outputs: ['idea_summary', 'concept']
  },
  script: {
    step: 'script',
    name: 'Script',
    name_ar: 'السكربت',
    description: 'Write full episode script with scenes',
    description_ar: 'كتابة السكربت الكامل مع المشاهد',
    icon: 'FileText',
    estimated_duration_seconds: 60,
    requires_approval: true,
    can_retry: true,
    inputs: ['idea', 'genre', 'target_audience'],
    outputs: ['script', 'scenes', 'dialogues']
  },
  scenes: {
    step: 'scenes',
    name: 'Scenes',
    name_ar: 'المشاهد',
    description: 'Generate visual prompts for each scene',
    description_ar: 'توليد أوصاف بصرية لكل مشهد',
    icon: 'LayoutGrid',
    estimated_duration_seconds: 30,
    requires_approval: false,
    can_retry: true,
    inputs: ['script', 'scenes'],
    outputs: ['visual_prompts']
  },
  images: {
    step: 'images',
    name: 'Images',
    name_ar: 'الصور',
    description: 'Generate images using ComfyUI',
    description_ar: 'توليد الصور باستخدام ComfyUI',
    icon: 'Image',
    estimated_duration_seconds: 300,
    requires_approval: true,
    can_retry: true,
    inputs: ['visual_prompts'],
    outputs: ['scene_images']
  },
  voice: {
    step: 'voice',
    name: 'Voice',
    name_ar: 'الصوت',
    description: 'Generate voice narration for scenes',
    description_ar: 'توليد التعليق الصوتي للمشاهد',
    icon: 'Mic',
    estimated_duration_seconds: 120,
    requires_approval: false,
    can_retry: true,
    inputs: ['script', 'dialogues'],
    outputs: ['voice_tracks']
  },
  music: {
    step: 'music',
    name: 'Music',
    name_ar: 'الموسيقى',
    description: 'Generate background music',
    description_ar: 'توليد الموسيقى الخلفية',
    icon: 'Music',
    estimated_duration_seconds: 60,
    requires_approval: false,
    can_retry: true,
    inputs: ['genre', 'duration'],
    outputs: ['music_track']
  },
  subtitles: {
    step: 'subtitles',
    name: 'Subtitles',
    name_ar: 'الترجمة',
    description: 'Generate subtitles',
    description_ar: 'توليد الترجمة',
    icon: 'Subtitles',
    estimated_duration_seconds: 30,
    requires_approval: false,
    can_retry: true,
    inputs: ['voice_tracks', 'script'],
    outputs: ['subtitle_file']
  },
  animation: {
    step: 'animation',
    name: 'Animation',
    name_ar: 'الحركة',
    description: 'Animate scenes using Runway',
    description_ar: 'تحريك المشاهد باستخدام Runway',
    icon: 'Film',
    estimated_duration_seconds: 600,
    requires_approval: false,
    can_retry: true,
    inputs: ['scene_images'],
    outputs: ['animated_clips']
  },
  assembly: {
    step: 'assembly',
    name: 'Assembly',
    name_ar: 'التجميع',
    description: 'Assemble final video with FFmpeg',
    description_ar: 'تجميع الفيديو النهائي باستخدام FFmpeg',
    icon: 'Combine',
    estimated_duration_seconds: 120,
    requires_approval: false,
    can_retry: true,
    inputs: ['animated_clips', 'voice_tracks', 'music_track', 'subtitle_file'],
    outputs: ['final_video']
  },
  final: {
    step: 'final',
    name: 'Final Review',
    name_ar: 'المراجعة النهائية',
    description: 'Final review and publishing',
    description_ar: 'المراجعة النهائية والنشر',
    icon: 'CheckCircle',
    estimated_duration_seconds: 30,
    requires_approval: true,
    can_retry: false,
    inputs: ['final_video'],
    outputs: ['published_episode']
  }
};

// الحصول على الخطوة التالية
export function getNextWorkflowStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentIndex = WORKFLOW_STEPS_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS_ORDER.length - 1) {
    return null;
  }
  return WORKFLOW_STEPS_ORDER[currentIndex + 1];
}

// الحصول على الخطوة السابقة
export function getPreviousWorkflowStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentIndex = WORKFLOW_STEPS_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return WORKFLOW_STEPS_ORDER[currentIndex - 1];
}

// حساب التقدم
export function calculateWorkflowProgress(currentStep: WorkflowStep): number {
  const currentIndex = WORKFLOW_STEPS_ORDER.indexOf(currentStep);
  if (currentIndex === -1) return 0;
  return Math.round((currentIndex / (WORKFLOW_STEPS_ORDER.length - 1)) * 100);
}

// التحقق مما إذا كانت الخطوة تتطلب موافقة
export function stepRequiresApproval(step: WorkflowStep): boolean {
  return WORKFLOW_STEP_DETAILS[step]?.requires_approval || false;
}
