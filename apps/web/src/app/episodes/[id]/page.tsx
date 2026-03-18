"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Film,
  FileText,
  Image,
  Mic,
  Music,
  Video,
  Settings,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  X
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Episode {
  id: string;
  title: string;
  project_id: string;
  project_title: string;
  description?: string;
  episode_number?: number;
  status: string;
  workflow_step: string;
  workflow_status: string;
  workflow_progress: number;
  workflow_data?: {
    script?: string;
    script_url?: string;
    voice_url?: string;
    music_url?: string;
    final_video_url?: string;
    assets?: any[];
  };
  script_data?: {
    scenes: SceneScript[];
  };
  images_data?: {
    images: SceneImage[];
  };
  view_count: number;
  like_count: number;
  createdAt: string;
  updatedAt: string;
}

interface SceneScript {
  scene_number: number;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  duration_seconds?: number;
}

interface SceneImage {
  scene_number: number;
  image_url: string;
  generation_status: string;
}

interface ApprovalLog {
  id: string;
  step: string;
  action: string;
  comment?: string;
  created_by_name: string;
  createdAt: string;
}

const workflowSteps = [
  { id: 'idea', label: 'الفكرة', icon: Film, description: 'الفكرة الأساسية للحلقة' },
  { id: 'script', label: 'السكربت', icon: FileText, description: 'كتابة النص والسرد' },
  { id: 'scenes', label: 'المشاهد', icon: Video, description: 'تقسيم للمشاهد' },
  { id: 'images', label: 'الصور', icon: Image, description: 'توليد الصور بالذكاء الاصطناعي' },
  { id: 'voice', label: 'الصوت', icon: Mic, description: 'التعليق الصوتي' },
  { id: 'music', label: 'الموسيقى', icon: Music, description: 'الموسيقى التصويرية' },
  { id: 'subtitles', label: 'الترجمة', icon: FileText, description: 'الترجمة والنصوص' },
  { id: 'animation', label: 'الحركة', icon: Video, description: 'المؤثرات الحركية' },
  { id: 'assembly', label: 'التجميع', icon: Video, description: 'تجميع العناصر' },
  { id: 'final', label: 'النهائي', icon: CheckCircle2, description: 'المراجعة النهائية' },
];

export default function EpisodeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const episodeId = params?.id || '';

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'images' | 'approval'>('overview');
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  useEffect(() => {
    if (episodeId) {
      fetchEpisode();
      fetchApprovalLogs();
    }
  }, [episodeId]);

  const fetchEpisode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/episodes/${episodeId}`);
      const data = await res.json();
      
      if (data.success) {
        setEpisode(data.data);
      } else {
        setError(data.error || "فشل في تحميل الحلقة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/logs`);
      const data = await res.json();
      if (data.success) {
        setApprovalLogs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch approval logs:", err);
    }
  };

  const handleAdvanceWorkflow = async () => {
    try {
      const res = await fetch(`${API_URL}/api/episodes/${episodeId}/workflow/advance`, {
        method: "POST"
      });
      
      const data = await res.json();
      if (data.success) {
        fetchEpisode();
      }
    } catch (err) {
      console.error("Failed to advance workflow:", err);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/${episode?.workflow_step}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'approved', comment: approvalComment }),
      });

      if (res.ok) {
        setShowApproveModal(false);
        setApprovalComment("");
        fetchEpisode();
        fetchApprovalLogs();
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/${episode?.workflow_step}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'rejected', comment: approvalComment }),
      });

      if (res.ok) {
        setShowRejectModal(false);
        setApprovalComment("");
        fetchEpisode();
        fetchApprovalLogs();
      }
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  const getStepIndex = (step: string) => workflowSteps.findIndex(s => s.id === step);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-400">{error || "الحلقة غير موجودة"}</p>
          <Link href="/episodes" className="mt-4 text-purple-400 hover:text-purple-300 inline-block">
            العودة للحلقات
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(episode.workflow_step);

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/projects" className="hover:text-white transition-colors">المشاريع</Link>
            <ChevronLeft className="w-4 h-4" />
            <Link href={`/projects/${episode.project_id}`} className="hover:text-white transition-colors">{episode.project_title}</Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-white">{episode.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{episode.title}</h1>
                {episode.episode_number && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    حلقة {episode.episode_number}
                  </span>
                )}
              </div>
              <p className="text-gray-400">{episode.description}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {episode.workflow_status === 'waiting_approval' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-all"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    موافقة
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    رفض
                  </button>
                </>
              )}
              {episode.workflow_status === 'in_progress' && (
                <button
                  onClick={handleAdvanceWorkflow}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                  متابعة للمرحلة التالية
                </button>
              )}
            </div>
          </div>

          {/* Workflow Flowchart */}
          <div className="mt-8 overflow-x-auto pb-4">
            <div className="flex items-center gap-2 min-w-max">
              {workflowSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCurrent = step.id === episode.workflow_step;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{ scale: isCurrent ? 1.05 : 1 }}
                      className={`flex flex-col items-center p-3 rounded-xl border min-w-[100px] transition-all ${
                        isCurrent
                          ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : isActive
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mb-2 ${
                        isCurrent ? 'bg-purple-500 text-white' : isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-500'
                      }`}>
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isCurrent ? 'text-purple-400' : isActive ? 'text-green-400' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </motion.div>
                    {index < workflowSteps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-1 ${
                        index < currentStepIndex ? 'bg-green-500/50' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-white/10">
            {[
              { id: 'overview', label: 'نظرة عامة' },
              { id: 'script', label: 'السكربت', disabled: !episode.script_data },
              { id: 'images', label: 'الصور', disabled: !episode.images_data },
              { id: 'approval', label: 'سجل الموافقة' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : tab.disabled
                    ? 'border-transparent text-gray-600 cursor-not-allowed'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">حالة الإنتاج</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">المرحلة الحالية</span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                        {workflowSteps.find(s => s.id === episode.workflow_step)?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">حالة سير العمل</span>
                      <span className={`px-3 py-1 rounded-lg ${
                        episode.workflow_status === 'waiting_approval' ? 'bg-yellow-500/20 text-yellow-400' :
                        episode.workflow_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {episode.workflow_status === 'waiting_approval' ? 'بانتظار الموافقة' :
                         episode.workflow_status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">التقدم العام</span>
                        <span className="font-semibold">{episode.workflow_progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${episode.workflow_progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assets Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">العناصر المنتجة</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {episode.workflow_data?.script_url && (
                      <a
                        href={episode.workflow_data.script_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                      >
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="font-medium">السكربت</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            تحميل <ExternalLink className="w-3 h-3" />
                          </p>
                        </div>
                      </a>
                    )}
                    {episode.workflow_data?.voice_url && (
                      <a
                        href={episode.workflow_data.voice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Mic className="w-8 h-8 text-pink-400" />
                        <div>
                          <p className="font-medium">الصوت</p>
                          <p className="text-sm text-gray-500">استماع</p>
                        </div>
                      </a>
                    )}
                    {episode.workflow_data?.music_url && (
                      <a
                        href={episode.workflow_data.music_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Music className="w-8 h-8 text-rose-400" />
                        <div>
                          <p className="font-medium">الموسيقى</p>
                          <p className="text-sm text-gray-500">استماع</p>
                        </div>
                      </a>
                    )}
                    {episode.workflow_data?.final_video_url && (
                      <a
                        href={episode.workflow_data.final_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Video className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="font-medium">الفيديو النهائي</p>
                          <p className="text-sm text-gray-500">مشاهدة</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Stats Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">الإحصائيات</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">المشاهدات</span>
                      <span className="font-semibold">{episode.view_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">الإعجابات</span>
                      <span className="font-semibold">{episode.like_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">تاريخ الإنشاء</span>
                      <span>{new Date(episode.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-400">آخر تحديث</span>
                      <span>{new Date(episode.updatedAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'script' && episode.script_data && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {episode.script_data.scenes.map((scene, index) => (
                <div key={scene.scene_number} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-semibold">
                      {scene.scene_number}
                    </span>
                    <h3 className="font-semibold">المشهد {scene.scene_number}</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">الوصف البصري</p>
                      <p className="text-white/80 leading-relaxed">{scene.description}</p>
                    </div>
                    {scene.visual_prompt && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-sm text-purple-400 mb-1">الوصف للذكاء الاصطناعي</p>
                        <p className="text-sm text-gray-300">{scene.visual_prompt}</p>
                      </div>
                    )}
                    {scene.dialogue && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">الحوار</p>
                        <p className="text-white/80 italic">"{scene.dialogue}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'images' && episode.images_data && (
            <motion.div
              key="images"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {episode.images_data.images.map((image) => (
                <div key={image.scene_number} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {image.image_url ? (
                    <img src={image.image_url} alt={`Scene ${image.scene_number}`} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium">المشهد {image.scene_number}</p>
                    <p className={`text-xs ${image.generation_status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {image.generation_status === 'completed' ? 'مكتمل' : 'قيد التوليد'}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'approval' && (
            <motion.div
              key="approval"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {approvalLogs.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">لا يوجد سجل موافقة</p>
                </div>
              ) : (
                approvalLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      log.action === 'approved' ? 'bg-green-500/20 text-green-400' :
                      log.action === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.action === 'approved' ? <ThumbsUp className="w-5 h-5" /> :
                       log.action === 'rejected' ? <ThumbsDown className="w-5 h-5" /> :
                       <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.created_by_name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(log.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-gray-300">{log.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approval Modals */}
      {showApproveModal && (
        <ApprovalModal
          title="الموافقة على المرحلة"
          action="approve"
          comment={approvalComment}
          setComment={setApprovalComment}
          onClose={() => setShowApproveModal(false)}
          onConfirm={handleApprove}
        />
      )}
      {showRejectModal && (
        <ApprovalModal
          title="رفض المرحلة"
          action="reject"
          comment={approvalComment}
          setComment={setApprovalComment}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

function ApprovalModal({ 
  title, 
  action, 
  comment, 
  setComment, 
  onClose, 
  onConfirm 
}: { 
  title: string;
  action: 'approve' | 'reject';
  comment: string;
  setComment: (c: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="تعليق (اختياري)..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {action === 'approve' ? 'موافقة' : 'رفض'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
