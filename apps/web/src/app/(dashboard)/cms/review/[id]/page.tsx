'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Edit3, ChevronDown, ChevronUp, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface Scene {
  id: string;
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  narration?: string;
  duration_seconds?: number;
}

interface Episode {
  id: string;
  title: string;
  description: string;
  theme?: string;
  tags?: string[];
  status: string;
  workflow_step?: string;
  workflow_status?: string;
  genre: string;
  target_audience: string;
}

interface ReviewData {
  episode: Episode;
  scenes: Scene[];
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [tags, setTags] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [expandedScene, setExpandedScene] = useState<number | null>(0);

  const fetchReview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/episodes/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // API returns flat: { ...episode, scenes, approval_logs, recent_jobs }
      const { scenes: rawScenes, approval_logs: _al, recent_jobs: _rj, ...episode } = json.data;
      setData({ episode, scenes: rawScenes || [] });
      setTitle(episode.title || '');
      setDescription(episode.description || '');
      setTheme(episode.theme || '');
      setTags((episode.tags || []).join(', '));
      setScenes(rawScenes || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  const approveScript = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${id}/script`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'approved',
          modifications: {
            title,
            description,
            theme,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccess('تم الموافقة! جاري كتابة السيناريو الكامل...');
      setTimeout(() => router.push(`/cms/episodes`), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const approveImages = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${id}/images`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'approved' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccess('تم الموافقة! جاري توليد الصور والأنيميشن...');
      setTimeout(() => router.push(`/cms/queue`), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateScenePrompt = (sceneId: string, newPrompt: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, visual_prompt: newPrompt } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span>{error || 'Episode not found'}</span>
      </div>
    );
  }

  // Support both old status values and new workflow fields
  const isScriptApproval =
    data.episode.status === 'awaiting_script_approval' ||
    (data.episode.workflow_step === 'script' && data.episode.workflow_status === 'waiting_approval');
  const isImageApproval =
    data.episode.status === 'awaiting_image_approval' ||
    (data.episode.workflow_step === 'images' && data.episode.workflow_status === 'waiting_approval');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isScriptApproval ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
              isImageApproval ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {isScriptApproval ? '⏳ بانتظار موافقة السيناريو' :
               isImageApproval ? '⏳ بانتظار موافقة البرومبت' :
               data.episode.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">مراجعة وموافقة</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isScriptApproval ? 'راجع الفكرة وعدّل إن أردت، ثم وافق لبدء كتابة السيناريو الكامل' :
             isImageApproval ? 'راجع السيناريو وبرومبت كل مشهد، ثم وافق لبدء توليد الصور' : ''}
          </p>
        </div>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* === SCRIPT APPROVAL STEP === */}
      {isScriptApproval && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              الفكرة الأساسية
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">العنوان</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الثيم / الموضوع</label>
                  <input
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الوسوم (مفصولة بفاصلة)</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={approveScript}
            disabled={submitting || !title}
            className="w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/25"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {submitting ? 'جاري المعالجة...' : 'موافقة وبدء كتابة السيناريو الكامل'}
            {!submitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* === IMAGE PROMPTS APPROVAL STEP === */}
      {isImageApproval && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{title || data.episode.title}</h2>
              <p className="text-gray-400 text-sm mt-1">{description || data.episode.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              مشاهد السيناريو ({scenes.length} مشاهد) — عدّل البرومبت لكل مشهد
            </h2>

            {scenes.map((scene, i) => (
              <div key={scene.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3 text-start">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold flex-shrink-0">
                      {scene.scene_number}
                    </span>
                    <div>
                      <p className="text-white text-sm font-semibold">{scene.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{scene.description}</p>
                    </div>
                  </div>
                  {expandedScene === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {expandedScene === i && (
                  <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                    {scene.description && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">وصف المشهد</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{scene.description}</p>
                      </div>
                    )}
                    {scene.dialogue && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">الحوار</p>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{scene.dialogue}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-purple-400 mb-1 block font-semibold">برومبت الصورة (قابل للتعديل)</label>
                      <textarea
                        value={scene.visual_prompt}
                        onChange={e => updateScenePrompt(scene.id, e.target.value)}
                        rows={3}
                        className="w-full bg-black/30 border border-purple-500/20 text-white text-sm rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all resize-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={approveImages}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/25"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {submitting ? 'جاري المعالجة...' : `موافقة وبدء توليد ${scenes.length} صور`}
            {!submitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Not awaiting approval */}
      {!isScriptApproval && !isImageApproval && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <AlertCircle className="w-10 h-10 text-gray-500" />
          <p className="text-gray-400">هذه الحلقة لا تحتاج إلى موافقة حالياً</p>
          <p className="text-gray-600 text-sm">الحالة: {data.episode.status}</p>
        </div>
      )}
    </div>
  );
}
