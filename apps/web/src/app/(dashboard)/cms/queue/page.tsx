'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Zap, CheckCircle, AlertCircle, Clock, Eye, Play } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface QueueStat {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  error?: string;
}

interface Episode {
  id: string;
  title: string;
  genre: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Job {
  job_type: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

const QUEUE_LABELS: Record<string, string> = {
  idea: 'فكرة', script: 'سيناريو', image: 'صورة',
  animation: 'أنيميشن', voice: 'صوت', music: 'موسيقى',
  assembly: 'تجميع', subtitle: 'ترجمة', thumbnail: 'مصغرة',
};

function duration(start?: string, end?: string) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 'ث';
  return Math.floor(s / 60) + 'د ' + (s % 60) + 'ث';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return m + ' دقيقة';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' ساعة';
  return Math.floor(h / 24) + ' يوم';
}

export default function QueuePage() {
  const [queueStats, setQueueStats] = useState<QueueStat[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, Job[]>>({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, epRes] = await Promise.all([
        fetch(API_URL + '/api/jobs/queue-stats').then(r => r.json()),
        fetch(API_URL + '/api/episodes?limit=30').then(r => r.json()),
      ]);
      if (qRes.success) setQueueStats(qRes.data || []);
      if (epRes.success) setEpisodes(epRes.data || []);
    } catch (_e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (episodeId: string) => {
    try {
      const res = await fetch(API_URL + '/api/jobs/' + episodeId + '/status');
      const json = await res.json();
      if (json.success) {
        setJobsMap(prev => ({ ...prev, [episodeId]: json.data.jobs || [] }));
      }
    } catch (_e) {
      // silent
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchData]);

  useEffect(() => {
    if (expandedId) fetchJobs(expandedId);
  }, [expandedId, fetchJobs]);

  const totalActive = queueStats.reduce((s, q) => s + (q.active || 0), 0);
  const totalWaiting = queueStats.reduce((s, q) => s + (q.waiting || 0), 0);
  const totalFailed = queueStats.reduce((s, q) => s + (q.failed || 0), 0);
  const totalCompleted = queueStats.reduce((s, q) => s + (q.completed || 0), 0);

  const activeEpisodes = episodes.filter(e => e.status === 'processing' || e.status === 'generating');
  const pendingEpisodes = episodes.filter(e => e.status === 'pending');

  const handleGenerate = async () => {
    try {
      await fetch(API_URL + '/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: 'adventure', target_audience: 'teens' }),
      });
      fetchData();
    } catch (_e) {
      // silent
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">مراقبة الإنتاج</h1>
          <p className="text-gray-500 text-sm mt-0.5">حالة قوائم الانتظار والمهام الجارية</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              autoRefresh ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'تحديث تلقائي (10ث)' : 'يدوي'}
          </button>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'نشط الآن', value: totalActive, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Zap className="w-4 h-4" /> },
          { label: 'في الانتظار', value: totalWaiting, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: <Clock className="w-4 h-4" /> },
          { label: 'مكتمل', value: totalCompleted, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'فشل', value: totalFailed, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <AlertCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
            <div className={`flex items-center gap-2 ${s.color} mb-1`}>
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Queue stats per worker */}
      {queueStats.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-3">قوائم الانتظار</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {queueStats.map(q => (
              <div key={q.name} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-sm font-semibold text-white mb-2">
                  {QUEUE_LABELS[q.name] || q.name}
                </p>
                {q.error ? (
                  <p className="text-xs text-red-400">{q.error}</p>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">نشط</span>
                      <span className={q.active > 0 ? 'text-blue-400 font-bold' : 'text-gray-400'}>{q.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">انتظار</span>
                      <span className={q.waiting > 0 ? 'text-yellow-400' : 'text-gray-400'}>{q.waiting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">مكتمل</span>
                      <span className="text-green-400">{q.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">فشل</span>
                      <span className={q.failed > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>{q.failed}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active episodes */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
          حلقات قيد المعالجة ({activeEpisodes.length})
        </h2>
        {activeEpisodes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-500 text-sm">
            لا توجد حلقات قيد المعالجة الآن
          </div>
        ) : (
          <div className="space-y-2">
            {activeEpisodes.map(ep => (
              <div key={ep.id} className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expandedId === ep.id ? null : ep.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500/10 transition-all text-start"
                >
                  <Zap className="w-4 h-4 text-blue-400 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {ep.title !== 'Generating...' ? ep.title : 'جاري التوليد...'}
                    </p>
                    <p className="text-xs text-gray-500">{ep.id.slice(0, 8)} · {timeAgo(ep.updated_at)}</p>
                  </div>
                  <span className="text-xs text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">معالجة</span>
                </button>
                {expandedId === ep.id && (
                  <div className="px-4 pb-3 border-t border-blue-500/10 pt-3">
                    {(jobsMap[ep.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-500">لا توجد مهام مسجلة</p>
                    ) : (
                      <div className="space-y-1">
                        {(jobsMap[ep.id] || []).map((job, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-mono">{job.job_type}</span>
                            <div className="flex items-center gap-2">
                              {duration(job.started_at, job.completed_at) && (
                                <span className="text-gray-600">{duration(job.started_at, job.completed_at)}</span>
                              )}
                              <span className={
                                job.status === 'completed' ? 'text-green-400' :
                                job.status === 'active' ? 'text-blue-400' :
                                job.status === 'failed' ? 'text-red-400' : 'text-gray-400'
                              }>{job.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/cms/episodes/${ep.id}`}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        استوديو الحلقة →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending episodes */}
      {pendingEpisodes.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            حلقات في الانتظار ({pendingEpisodes.length})
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {pendingEpisodes.map(ep => (
                <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-sm truncate">
                      {ep.title !== 'Generating...' ? ep.title : `حلقة ${ep.id.slice(0,8)}`}
                    </p>
                    <p className="text-xs text-gray-600">{ep.genre} · {timeAgo(ep.created_at)}</p>
                  </div>
                  <Link
                    href={`/cms/episodes/${ep.id}`}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
