"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Filter,
  Film,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  ChevronLeft,
  X,
  Play
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface Episode {
  id: string;
  title: string;
  project_title: string;
  project_id: string;
  episode_number?: number;
  status: string;
  workflow_step: string;
  workflow_status: string;
  workflow_progress: number;
  thumbnail_url?: string;
  video_url?: string;
  duration_seconds?: number;
  view_count: number;
  like_count: number;
  createdAt: string;
}

const workflowSteps = [
  { id: 'idea', label: 'الفكرة', color: 'bg-gray-500' },
  { id: 'script', label: 'السكربت', color: 'bg-blue-500' },
  { id: 'scenes', label: 'المشاهد', color: 'bg-indigo-500' },
  { id: 'images', label: 'الصور', color: 'bg-purple-500' },
  { id: 'voice', label: 'الصوت', color: 'bg-pink-500' },
  { id: 'music', label: 'الموسيقى', color: 'bg-rose-500' },
  { id: 'subtitles', label: 'الترجمة', color: 'bg-orange-500' },
  { id: 'animation', label: 'الحركة', color: 'bg-amber-500' },
  { id: 'assembly', label: 'التجميع', color: 'bg-emerald-500' },
  { id: 'final', label: 'النهائي', color: 'bg-green-500' },
];

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/episodes`, { headers: authHeaders() });
      const data = await res.json();
      
      if (data.success) {
        setEpisodes(data.data || []);
      } else {
        setError(data.error || "فشل في تحميل الحلقات");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEpisodes = episodes.filter(episode => {
    const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         episode.project_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || episode.status === statusFilter;
    const matchesStep = stepFilter === "all" || episode.workflow_step === stepFilter;
    return matchesSearch && matchesStatus && matchesStep;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'published': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'waiting_approval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'published': return 'منشورة';
      case 'waiting_approval': return 'بانتظار الموافقة';
      case 'processing': return 'قيد المعالجة';
      default: return 'مسودة';
    }
  };

  const getStepIndex = (step: string) => workflowSteps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">الحلقات</h1>
              <p className="text-gray-400 mt-1">إدارة ومتابعة جميع الحلقات</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{episodes.length}</p>
                <p className="text-sm text-gray-400">إجمالي الحلقات</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الحلقات..."
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
              <option value="draft">مسودة</option>
              <option value="processing">قيد المعالجة</option>
              <option value="waiting_approval">بانتظار الموافقة</option>
              <option value="completed">مكتملة</option>
            </select>
            <select
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">جميع المراحل</option>
              {workflowSteps.map(step => (
                <option key={step.id} value={step.id}>{step.label}</option>
              ))}
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
            <button onClick={fetchEpisodes} className="mt-4 text-purple-400 hover:text-purple-300">
              إعادة المحاولة
            </button>
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Film className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">لا توجد حلقات</h3>
            <p className="text-gray-400">أنشئ حلقة جديدة من صفحة المشروع</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEpisodes.map((episode, index) => (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-white/5 relative overflow-hidden">
                  {episode.thumbnail_url ? (
                    <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  {episode.video_url && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {/* Duration Badge */}
                  {episode.duration_seconds && (
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                      {Math.floor(episode.duration_seconds / 60)}:{String(episode.duration_seconds % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Project */}
                  <p className="text-sm text-purple-400 mb-2">{episode.project_title}</p>
                  
                  {/* Title */}
                  <h3 className="font-semibold mb-3 line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {episode.episode_number && `حلقة ${episode.episode_number}:`} {episode.title}
                  </h3>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs border ${getStatusColor(episode.status)}`}>
                      {getStatusText(episode.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(episode.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  {/* Workflow Step */}
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">مرحلة الإنتاج</span>
                      <span className="text-sm font-medium">
                        {workflowSteps.find(s => s.id === episode.workflow_step)?.label}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${episode.workflow_progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">{episode.workflow_progress}%</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {episode.view_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {episode.like_count}
                    </span>
                  </div>

                  {/* Action */}
                  <Link
                    href={`/episodes/${episode.id}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
                  >
                    عرض التفاصيل
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
