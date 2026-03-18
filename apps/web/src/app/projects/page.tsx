"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  CheckCircle2,
  Clock,
  Film,
  BarChart3,
  ChevronLeft,
  X
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Project {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  progress: number;
  stats: {
    total_episodes: number;
    completed_episodes: number;
    in_progress_episodes: number;
    waiting_approval_episodes: number;
    total_views: number;
    total_likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();
      
      if (data.success) {
        setProjects(data.data || []);
      } else {
        setError(data.error || "فشل في تحميل المشاريع");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'paused': return 'متوقف';
      case 'completed': return 'مكتمل';
      case 'archived': return 'مؤرشف';
      default: return 'مسودة';
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">المشاريع</h1>
              <p className="text-gray-400 mt-1">إدارة ومتابعة جميع مشاريعك</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              مشروع جديد
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المشاريع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="paused">متوقف</option>
              <option value="completed">مكتمل</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">لا توجد مشاريع</h3>
            <p className="text-gray-400 mb-6">ابدأ بإنشاء أول مشروع لك</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all"
            >
              إنشاء مشروع
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all group"
              >
                {/* Progress Bar */}
                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-purple-400 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                        {project.description || "بدون وصف"}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs border ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Film className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                      <p className="text-xl font-bold">{project.stats.total_episodes}</p>
                      <p className="text-xs text-gray-500">حلقة</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-400" />
                      <p className="text-xl font-bold">{project.stats.completed_episodes}</p>
                      <p className="text-xs text-gray-500">مكتملة</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                      <p className="text-xl font-bold">{project.stats.waiting_approval_episodes}</p>
                      <p className="text-xs text-gray-500">بانتظار الموافقة</p>
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {project.stats.total_views.toLocaleString()} مشاهدة
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-gray-500">
                      تم التحديث: {new Date(project.updatedAt).toLocaleDateString('ar-SA')}
                    </span>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                      عرض التفاصيل
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchProjects();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Project Modal
function CreateProjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("adventure");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          genre,
          status: 'active'
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "فشل في إنشاء المشروع");
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
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">مشروع جديد</h2>
            <p className="text-gray-400 text-sm mt-1">أدخل تفاصيل المشروع الجديد</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">عنوان المشروع *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مغامرات الفضاء"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المشروع..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">النوع</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="adventure">مغامرة</option>
              <option value="comedy">كوميديا</option>
              <option value="drama">دراما</option>
              <option value="sci-fi">خيال علمي</option>
              <option value="fantasy">فانتازيا</option>
              <option value="educational">تعليمي</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء المشروع"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
