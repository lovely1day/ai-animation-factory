"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Film,
  BarChart3,
  Settings,
  Trash2,
  Edit3,
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  Clock3,
  AlertCircle,
  X
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Project {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  target_audience?: string;
  status: string;
  progress: number;
  workflow_settings: {
    approval_steps: string[];
    auto_publish: boolean;
  };
  stats: {
    total_episodes: number;
    completed_episodes: number;
    in_progress_episodes: number;
    waiting_approval_episodes: number;
    total_duration_seconds: number;
    total_views: number;
    total_likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Episode {
  id: string;
  title: string;
  episode_number?: number;
  status: string;
  workflow_step: string;
  workflow_progress: number;
  thumbnail_url?: string;
  duration_seconds?: number;
  view_count: number;
  like_count: number;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id || '';

  const [project, setProject] = useState<Project | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'episodes' | 'stats' | 'settings'>('episodes');
  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchEpisodes();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`);
      const data = await res.json();
      
      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.error || "فشل في تحميل المشروع");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/episodes`);
      const data = await res.json();
      
      if (data.success) {
        setEpisodes(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        router.push("/projects");
      } else {
        setError("فشل في حذف المشروع");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getEpisodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'published': return 'bg-blue-500/20 text-blue-400';
      case 'waiting_approval': return 'bg-yellow-500/20 text-yellow-400';
      case 'processing': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getWorkflowStepText = (step: string) => {
    const steps: Record<string, string> = {
      idea: 'الفكرة',
      script: 'السكربت',
      scenes: 'المشاهد',
      images: 'الصور',
      voice: 'الصوت',
      music: 'الموسيقى',
      subtitles: 'الترجمة',
      animation: 'الحركة',
      assembly: 'التجميع',
      final: 'المراجعة النهائية'
    };
    return steps[step] || step;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-400">{error || "المشروع غير موجود"}</p>
          <Link href="/projects" className="mt-4 text-purple-400 hover:text-purple-300 inline-block">
            العودة للمشاريع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/projects" className="hover:text-white transition-colors">المشاريع</Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-white">{project.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(project.status)}`}>
                  {project.status === 'active' ? 'نشط' : project.status === 'paused' ? 'متوقف' : project.status === 'completed' ? 'مكتمل' : 'مؤرشف'}
                </span>
              </div>
              <p className="text-gray-400 max-w-2xl">{project.description || "بدون وصف"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateEpisode(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                حلقة جديدة
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">إجمالي الحلقات</p>
              <p className="text-2xl font-bold">{project.stats.total_episodes}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">مكتملة</p>
              <p className="text-2xl font-bold text-green-400">{project.stats.completed_episodes}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-purple-400">{project.stats.in_progress_episodes}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">بانتظار الموافقة</p>
              <p className="text-2xl font-bold text-yellow-400">{project.stats.waiting_approval_episodes}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">المشاهدات</p>
              <p className="text-2xl font-bold">{project.stats.total_views.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">التقدم العام</p>
              <p className="text-2xl font-bold">{project.progress}%</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-white/10">
            {[
              { id: 'episodes', label: 'الحلقات', icon: Film },
              { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'episodes' && (
            <motion.div
              key="episodes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {episodes.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                  <Film className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد حلقات</h3>
                  <p className="text-gray-400 mb-6">ابدأ بإضافة أول حلقة للمشروع</p>
                  <button
                    onClick={() => setShowCreateEpisode(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all"
                  >
                    إضافة حلقة
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                          {episode.thumbnail_url ? (
                            <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">حلقة {episode.episode_number}</span>
                            <h3 className="font-semibold group-hover:text-purple-400 transition-colors">{episode.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span className={`px-2 py-0.5 rounded text-xs ${getEpisodeStatusColor(episode.status)}`}>
                              {episode.status === 'completed' ? 'مكتملة' : episode.status === 'waiting_approval' ? 'بانتظار الموافقة' : 'قيد المعالجة'}
                            </span>
                            <span>{getWorkflowStepText(episode.workflow_step)}</span>
                            {episode.duration_seconds && (
                              <span>{Math.round(episode.duration_seconds / 60)} دقيقة</span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            {episode.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {episode.like_count}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="w-24">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${episode.workflow_progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">{episode.workflow_progress}%</p>
                        </div>

                        {/* Actions */}
                        <Link
                          href={`/episodes/${episode.id}`}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <ChevronLeft className="w-5 h-5 rotate-180" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">توزيع الحلقات</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">مكتملة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${project.stats.total_episodes ? (project.stats.completed_episodes / project.stats.total_episodes) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm">{project.stats.completed_episodes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">قيد التنفيذ</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${project.stats.total_episodes ? (project.stats.in_progress_episodes / project.stats.total_episodes) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm">{project.stats.in_progress_episodes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">بانتظار الموافقة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${project.stats.total_episodes ? (project.stats.waiting_approval_episodes / project.stats.total_episodes) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm">{project.stats.waiting_approval_episodes}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">معلومات إضافية</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">تاريخ الإنشاء</span>
                    <span>{new Date(project.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">آخر تحديث</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">إجمالي المدة</span>
                    <span>{Math.round(project.stats.total_duration_seconds / 60)} دقيقة</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-400">متوسط المشاهدات للحلقة</span>
                    <span>{project.stats.total_episodes ? Math.round(project.stats.total_views / project.stats.total_episodes) : 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6">إعدادات سير العمل</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">خطوات الموافقة المطلوبة</label>
                    <div className="flex flex-wrap gap-2">
                      {project.workflow_settings?.approval_steps?.map((step) => (
                        <span key={step} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                          {getWorkflowStepText(step)}
                        </span>
                      )) || (
                        <span className="text-gray-500">السكربت والصور</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <span className="text-gray-400">النشر التلقائي</span>
                    <span className={project.workflow_settings?.auto_publish ? 'text-green-400' : 'text-gray-500'}>
                      {project.workflow_settings?.auto_publish ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Episode Modal */}
      {showCreateEpisode && (
        <CreateEpisodeModal
          projectId={projectId}
          onClose={() => setShowCreateEpisode(false)}
          onSuccess={() => {
            setShowCreateEpisode(false);
            fetchEpisodes();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  );
}

function CreateEpisodeModal({ projectId, onClose, onSuccess }: { projectId: string; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "فشل في إنشاء الحلقة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">حلقة جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium mb-2">عنوان الحلقة *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الحلقة"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">حذف المشروع</h3>
            <p className="text-gray-400 text-sm">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl"
          >
            حذف
          </button>
        </div>
      </motion.div>
    </div>
  );
}
