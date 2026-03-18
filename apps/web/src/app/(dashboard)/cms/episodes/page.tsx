'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, Search, Film, Eye, ImageIcon, AlertTriangle, Trash2, XCircle, CheckCircle,
  Pause, Play, Square
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Episode {
  id: string;
  title: string;
  genre: string;
  status: string;
  thumbnail_url?: string;
  video_url?: string;
  workflow_status?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; canPause: boolean }> = {
  pending:                  { label: 'انتظار',           color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', canPause: false },
  generating:               { label: 'جاري التوليد',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', canPause: true },
  processing:               { label: 'معالجة',           color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', canPause: true },
  awaiting_script_approval: { label: 'موافقة السيناريو', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', canPause: false },
  awaiting_image_approval:  { label: 'موافقة الصور',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', canPause: false },
  completed:                { label: 'مكتمل',            color: 'bg-green-500/20 text-green-400 border-green-500/30', canPause: false },
  published:                { label: 'منشور',            color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', canPause: false },
  failed:                   { label: 'فشل',              color: 'bg-red-500/20 text-red-400 border-red-500/30', canPause: false },
  paused:                   { label: 'موقف',             color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', canPause: false },
};

const STATUS_FILTER_OPTIONS = ['all','pending','processing','awaiting_script_approval','awaiting_image_approval','completed','published','failed','paused'];
const STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'الكل', pending: 'انتظار', processing: 'معالجة',
  awaiting_script_approval: 'موافقة سيناريو', awaiting_image_approval: 'موافقة صور',
  completed: 'مكتمل', published: 'منشور', failed: 'فشل', paused: 'موقف',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return m + ' دقيقة';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' ساعة';
  return Math.floor(h / 24) + ' يوم';
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pausing, setPausing] = useState<string | null>(null);
  const [resuming, setResuming] = useState<string | null>(null);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const cleanup = async () => {
    if (!confirm('سيتم حذف جميع الحلقات العالقة (pending + بدون بيانات). هل أنت متأكد؟')) return;
    setCleaning(true);
    try {
      const res = await fetch(API_URL + '/api/episodes/cleanup', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(`تم حذف ${json.deleted} حلقة عالقة`);
        fetchEpisodes();
      }
    } catch (_e) { /* silent */ }
    finally { setCleaning(false); }
  };

  const deleteEpisode = async (episodeId: string, title: string) => {
    const confirmMsg = title && title !== 'Generating...' 
      ? `هل أنت متأكد من حذف "${title}"؟\n\nلا يمكن التراجع عن هذا الإجراء!`
      : 'هل أنت متأكد من حذف هذه الحلقة؟\n\nلا يمكن التراجع عن هذا الإجراء!';
    
    if (!confirm(confirmMsg)) return;
    
    setDeleting(episodeId);
    try {
      const res = await fetch(API_URL + '/api/episodes/' + episodeId, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setEpisodes(prev => prev.filter(ep => ep.id !== episodeId));
        setTotal(prev => prev - 1);
      } else {
        alert('فشل في حذف الحلقة: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('فشل في حذف الحلقة: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const pauseEpisode = async (episodeId: string, title: string) => {
    if (!confirm(`هل تريد إيقاف "${title || 'هذه الحلقة'}" مؤقتاً؟`)) return;
    
    setPausing(episodeId);
    try {
      const res = await fetch(API_URL + '/api/episodes/' + episodeId, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'paused',
          workflow_status: 'paused'
        })
      });
      const json = await res.json();
      if (json.success) {
        // Update local state
        setEpisodes(prev => prev.map(ep => 
          ep.id === episodeId ? { ...ep, status: 'paused', workflow_status: 'paused' } : ep
        ));
      } else {
        alert('فشل في إيقاف الحلقة: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('فشل في إيقاف الحلقة: ' + e.message);
    } finally {
      setPausing(null);
    }
  };

  const resumeEpisode = async (episodeId: string, title: string) => {
    if (!confirm(`هل تريد استئناف "${title || 'هذه الحلقة'}"؟`)) return;
    
    setResuming(episodeId);
    try {
      const res = await fetch(API_URL + '/api/episodes/' + episodeId, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'processing',
          workflow_status: 'active'
        })
      });
      const json = await res.json();
      if (json.success) {
        // Update local state
        setEpisodes(prev => prev.map(ep => 
          ep.id === episodeId ? { ...ep, status: 'processing', workflow_status: 'active' } : ep
        ));
      } else {
        alert('فشل في استئناف الحلقة: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('فشل في استئناف الحلقة: ' + e.message);
    } finally {
      setResuming(null);
    }
  };

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search) params.set('search', search);
      const res = await fetch(API_URL + '/api/episodes?' + params.toString());
      const json = await res.json();
      if (json.success) {
        setEpisodes(json.data || []);
        setTotal(json.pagination?.total || json.data?.length || 0);
      }
    } catch (_e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchEpisodes(); }, [fetchEpisodes]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchEpisodes, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchEpisodes]);

  // Filter episodes based on showCompletedOnly
  const filteredEpisodes = showCompletedOnly 
    ? episodes.filter(ep => ep.status === 'completed' || ep.status === 'published')
    : episodes;

  const counts = episodes.reduce((acc: Record<string, number>, ep) => {
    acc[ep.status] = (acc[ep.status] || 0) + 1;
    return acc;
  }, {});

  const completedCount = (counts['completed'] || 0) + (counts['published'] || 0);
  const pausedCount = counts['paused'] || 0;
  const processingCount = (counts['processing'] || 0) + (counts['generating'] || 0);

  const needsApproval = episodes.filter(
    e => e.status === 'awaiting_script_approval' || e.status === 'awaiting_image_approval'
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">مشاريعي السابقة</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} حلقة إجمالاً
            {completedCount > 0 && (
              <span className="text-green-400 mr-2">({completedCount} مكتملة)</span>
            )}
            {pausedCount > 0 && (
              <span className="text-amber-400 mr-2">({pausedCount} موقفة)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              autoRefresh
                ? 'bg-green-500/15 border-green-500/30 text-green-400'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'تحديث تلقائي' : 'يدوي'}
          </button>
          <button
            type="button"
            onClick={fetchEpisodes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          {(counts['pending'] || 0) > 5 && (
            <button
              type="button"
              onClick={cleanup}
              disabled={cleaning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs transition-all disabled:opacity-50"
              title="حذف الحلقات العالقة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              تنظيف ({counts['pending'] || 0})
            </button>
          )}
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold transition-all"
          >
            <Film className="w-3.5 h-3.5" />
            + إنشاء حلقة
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {([
          { key: 'completed',                label: 'مكتمل',           color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
          { key: 'published',                label: 'منشور',           color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { key: 'processing',               label: 'معالجة',          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
          { key: 'paused',                   label: 'موقف',            color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
          { key: 'pending',                  label: 'انتظار',          color: 'text-gray-400',   bg: 'bg-white/5 border-white/10' },
          { key: 'awaiting_script_approval', label: 'موافقة سيناريو', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { key: 'awaiting_image_approval',  label: 'موافقة صور',     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { key: 'failed',                   label: 'فشل',             color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
        ] as const).map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setFilterStatus(filterStatus === s.key ? 'all' : s.key);
              setShowCompletedOnly(false);
            }}
            className={`text-center p-3 rounded-xl border transition-all ${s.bg} ${filterStatus === s.key ? 'ring-1 ring-white/20' : ''}`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key] || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Completed & Processing Stats */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setShowCompletedOnly(!showCompletedOnly);
            setFilterStatus('all');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            showCompletedOnly
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          الأعمال المكتملة ({completedCount})
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
          <RefreshCw className="w-4 h-4" />
          قيد المعالجة ({processingCount})
        </div>

        {pausedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <Pause className="w-4 h-4" />
            موقفة ({pausedCount})
          </div>
        )}
        
        {showCompletedOnly && (
          <button
            type="button"
            onClick={() => setShowCompletedOnly(false)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-all"
          >
            <XCircle className="w-4 h-4" />
            إلغاء الفلتر
          </button>
        )}
      </div>

      {/* Approval alert */}
      {needsApproval.length > 0 && !showCompletedOnly && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
          <p className="text-yellow-300 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {needsApproval.length} حلقة تنتظر موافقتك
          </p>
          <div className="space-y-1">
            {needsApproval.map(ep => (
              <Link
                key={ep.id}
                href={`/cms/review/${ep.id}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-400 hover:text-yellow-200 text-sm transition-all"
              >
                <span>{ep.title !== 'Generating...' ? ep.title : `حلقة ${ep.id.slice(0, 8)}`}</span>
                <span className="text-xs opacity-70">
                  {ep.status === 'awaiting_script_approval' ? 'موافقة السيناريو' : 'موافقة البرومبت'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="بحث في الحلقات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTER_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setFilterStatus(s);
                setShowCompletedOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {STATUS_FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading && filteredEpisodes.length === 0 ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Film className="w-10 h-10 mb-3 opacity-30" />
            <p>لا توجد حلقات</p>
            {showCompletedOnly ? (
              <button 
                onClick={() => setShowCompletedOnly(false)}
                className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
              >
                عرض جميع الحلقات
              </button>
            ) : (
              <Link href="/create" className="mt-3 text-purple-400 hover:text-purple-300 text-sm">
                + إنشاء أول حلقة
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredEpisodes.map(ep => {
              const st = STATUS_MAP[ep.status] || STATUS_MAP.pending;
              const isGenerating = ep.status === 'processing' || ep.status === 'generating';
              const isPending = ep.status === 'pending';
              const isPaused = ep.status === 'paused';
              const needsReview = ep.status === 'awaiting_script_approval' || ep.status === 'awaiting_image_approval';
              const isReal = ep.title && ep.title !== 'Generating...';
              const canPause = isGenerating || isPending;
              const canResume = isPaused;

              return (
                <div
                  key={ep.id}
                  className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all ${needsReview ? 'bg-yellow-500/5' : ''} ${isPaused ? 'bg-amber-500/5' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0">
                    {ep.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ep.thumbnail_url} alt={ep.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isGenerating && !isPaused
                          ? <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          : isPaused
                            ? <Pause className="w-4 h-4 text-amber-400" />
                            : <Film className="w-4 h-4 text-gray-600" />
                        }
                      </div>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {isReal
                        ? ep.title
                        : <span className="text-gray-500 italic text-sm">جاري التوليد...</span>
                      }
                      {isPaused && <span className="text-amber-400 text-xs mr-2">(موقف)</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-600 font-mono">{ep.id.slice(0, 8)}</span>
                      <span className="hidden sm:inline text-xs text-gray-600 capitalize">{ep.genre}</span>
                      <span className="hidden sm:inline text-xs text-gray-600">{timeAgo(ep.updated_at || ep.created_at)}</span>
                      {ep.video_url && (
                        <span className="flex items-center gap-0.5 text-xs text-green-500">
                          <Eye className="w-3 h-3" /> فيديو
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${st.color}`}>
                    {isPaused && <Pause className="w-3 h-3" />}
                    {st.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Pause Button - for processing/generating episodes */}
                    {canPause && (
                      <button
                        onClick={() => pauseEpisode(ep.id, ep.title)}
                        disabled={pausing === ep.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:text-amber-200 text-xs transition-all disabled:opacity-50"
                        title="إيقاف مؤقت"
                      >
                        <Pause className={`w-3 h-3 ${pausing === ep.id ? 'animate-pulse' : ''}`} />
                        <span className="hidden sm:inline">{pausing === ep.id ? 'جاري...' : 'إيقاف'}</span>
                      </button>
                    )}

                    {/* Resume Button - for paused episodes */}
                    {canResume && (
                      <button
                        onClick={() => resumeEpisode(ep.id, ep.title)}
                        disabled={resuming === ep.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 hover:text-green-200 text-xs transition-all disabled:opacity-50"
                        title="استئناف"
                      >
                        <Play className={`w-3 h-3 ${resuming === ep.id ? 'animate-pulse' : ''}`} />
                        <span className="hidden sm:inline">{resuming === ep.id ? 'جاري...' : 'تشغيل'}</span>
                      </button>
                    )}

                    {needsReview && (
                      <Link
                        href={`/cms/review/${ep.id}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 hover:text-yellow-200 text-xs transition-all"
                        title="مراجعة وموافقة"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">راجع</span>
                      </Link>
                    )}
                    <Link
                      href={`/cms/episodes/${ep.id}`}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all"
                      title="استوديو الحلقة"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">استوديو</span>
                    </Link>
                    {ep.video_url && (
                      <Link
                        href={`/watch/${ep.id}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 text-xs transition-all"
                        title="مشاهدة"
                      >
                        <Eye className="w-3 h-3" />
                      </Link>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteEpisode(ep.id, ep.title)}
                      disabled={deleting === ep.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs transition-all disabled:opacity-50"
                      title="حذف الحلقة"
                    >
                      <Trash2 className={`w-3 h-3 ${deleting === ep.id ? 'animate-pulse' : ''}`} />
                      <span className="hidden sm:inline">{deleting === ep.id ? 'جاري...' : 'حذف'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
