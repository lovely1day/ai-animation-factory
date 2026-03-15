'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Image as ImageIcon, Film, Volume2, Music, RefreshCw, Upload,
  Play, Download, ChevronDown, ChevronUp, AlertCircle, Loader2,
  CheckCircle, Clock, Zap, Eye, Video
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

interface Scene {
  id: string;
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  narration?: string;
  image_url?: string;
  animation_url?: string;
  voice_url?: string;
  status: string;
  duration_seconds?: number;
}

interface Episode {
  id: string;
  title: string;
  description?: string;
  genre: string;
  status: string;
  video_url?: string;
  thumbnail_url?: string;
  subtitle_url?: string;
  music_url?: string;
  duration_seconds?: number;
  view_count?: number;
}

interface Job {
  job_type: string;
  status: string;
  created_at: string;
  output_data?: Record<string, unknown>;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  published: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  awaiting_script_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  awaiting_image_approval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function EpisodeStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(0);
  const [regenerating, setRegenerating] = useState<string>('');  // "sceneId:asset_type"
  const [uploadingScene, setUploadingScene] = useState<string>('');
  const [assembling, setAssembling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadSceneId, setPendingUploadSceneId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/episodes/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load');
      const data = json.data;
      setEpisode(data.episode || data);
      setScenes(data.scenes || []);
      setJobs(data.jobs || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const regenerate = async (sceneId: string | null, assetType: string) => {
    const key = sceneId ? `${sceneId}:${assetType}` : `episode:${assetType}`;
    setRegenerating(key);
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/regen-scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episode_id: id, scene_id: sceneId, asset_type: assetType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccessMsg(`تم إرسال طلب إعادة إنتاج ${assetType === 'video' ? 'الفيديو' : assetType}`);
      setTimeout(() => { setSuccessMsg(''); fetchData(); }, 3000);
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setRegenerating('');
    }
  };

  const reassembleVideo = async () => {
    setAssembling(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/episodes/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_type: 'video' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccessMsg('جاري إعادة تجميع الفيديو...');
      setTimeout(() => { setSuccessMsg(''); fetchData(); }, 3000);
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setAssembling(false);
    }
  };

  const handleUploadClick = (sceneId: string) => {
    setPendingUploadSceneId(sceneId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadSceneId) return;
    setUploadingScene(pendingUploadSceneId);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_URL}/api/scene-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene_id: pendingUploadSceneId, image_base64: base64, mime_type: file.type }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');
      setSuccessMsg('تم رفع الصورة بنجاح');
      setTimeout(() => { setSuccessMsg(''); fetchData(); }, 2000);
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setUploadingScene('');
      setPendingUploadSceneId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  if (!episode) return (
    <div className="flex items-center justify-center h-64 gap-2 text-red-400">
      <AlertCircle className="w-5 h-5" />
      <span>{error || 'Episode not found'}</span>
    </div>
  );

  const completedScenes = scenes.filter(s => s.image_url).length;
  const animatedScenes = scenes.filter(s => s.animation_url).length;

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Episode Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          <div className="w-full sm:w-48 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
            {episode.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-white">{episode.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StatusBadge status={episode.status} />
                  <span className="text-xs text-gray-500 capitalize">{episode.genre}</span>
                  {episode.duration_seconds && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(episode.duration_seconds / 60)}:{String(episode.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                title="تحديث"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {episode.description && (
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{episode.description}</p>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>{completedScenes}/{scenes.length} صور</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Film className="w-4 h-4 text-purple-400" />
                <span>{animatedScenes}/{scenes.length} أنيميشن</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Volume2 className="w-4 h-4 text-green-400" />
                <span>{scenes.filter(s => s.voice_url).length}/{scenes.length} صوت</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
          {episode.video_url && (
            <a
              href={`/watch/${episode.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all"
            >
              <Eye className="w-4 h-4" />
              مشاهدة الفيديو
            </a>
          )}
          {episode.video_url && (
            <a
              href={episode.video_url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              تنزيل الفيديو
            </a>
          )}
          <button
            type="button"
            onClick={reassembleVideo}
            disabled={assembling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white text-sm transition-all disabled:opacity-50"
          >
            {assembling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4 text-purple-400" />}
            إعادة تجميع الفيديو
          </button>
          {episode.music_url && (
            <a
              href={episode.music_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
            >
              <Music className="w-4 h-4 text-pink-400" />
              الموسيقى
            </a>
          )}
          {episode.subtitle_url && (
            <a
              href={episode.subtitle_url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              الترجمة (SRT)
            </a>
          )}
        </div>
      </div>

      {/* Scenes */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          المشاهد والأصول ({scenes.length} مشهد)
        </h2>

        <div className="space-y-3">
          {scenes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>لا توجد مشاهد بعد</p>
            </div>
          )}
          {scenes.map((scene, i) => (
            <div key={scene.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Scene header */}
              <button
                type="button"
                onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all text-start"
              >
                <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-sm font-bold flex-shrink-0">
                  {scene.scene_number}
                </span>

                {/* Thumbnail preview */}
                {scene.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={scene.image_url}
                    alt={scene.title}
                    className="w-14 h-10 object-cover rounded-lg flex-shrink-0 border border-white/10"
                  />
                )}
                {!scene.image_url && (
                  <div className="w-14 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{scene.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scene.image_url ? 'bg-blue-400' : 'bg-gray-600'}`} title="صورة" />
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scene.animation_url ? 'bg-purple-400' : 'bg-gray-600'}`} title="أنيميشن" />
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scene.voice_url ? 'bg-green-400' : 'bg-gray-600'}`} title="صوت" />
                    <StatusBadge status={scene.status} />
                  </div>
                </div>

                {expandedScene === i
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </button>

              {/* Scene detail */}
              {expandedScene === i && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                  {/* Description + Prompt */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {scene.description && (
                      <div className="bg-black/20 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">وصف المشهد</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{scene.description}</p>
                      </div>
                    )}
                    {scene.visual_prompt && (
                      <div className="bg-black/20 rounded-xl p-3">
                        <p className="text-xs text-purple-400 mb-1 font-semibold uppercase tracking-wide">برومبت الصورة</p>
                        <p className="text-gray-300 text-sm leading-relaxed font-mono" dir="ltr">{scene.visual_prompt}</p>
                      </div>
                    )}
                  </div>

                  {scene.dialogue && (
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-xs text-green-400 mb-1 font-semibold uppercase tracking-wide">الحوار</p>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{scene.dialogue}</p>
                    </div>
                  )}

                  {/* Assets grid */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    {/* IMAGE */}
                    <div className="bg-black/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> الصورة
                        </p>
                        {scene.image_url && (
                          <a href={scene.image_url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {scene.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={scene.image_url}
                          alt={scene.title}
                          className="w-full aspect-video object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-slate-800 rounded-lg border border-white/10 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => regenerate(scene.id, 'image')}
                          disabled={regenerating === `${scene.id}:image`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs transition-all disabled:opacity-50"
                        >
                          {regenerating === `${scene.id}:image` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          إعادة توليد
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUploadClick(scene.id)}
                          disabled={uploadingScene === scene.id}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all disabled:opacity-50"
                        >
                          {uploadingScene === scene.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          رفع صورة
                        </button>
                      </div>
                    </div>

                    {/* ANIMATION */}
                    <div className="bg-black/20 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <Film className="w-3.5 h-3.5" /> الأنيميشن
                      </p>
                      {scene.animation_url ? (
                        <video
                          src={scene.animation_url}
                          className="w-full aspect-video object-cover rounded-lg border border-white/10 bg-black"
                          controls
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-slate-800 rounded-lg border border-white/10 flex items-center justify-center">
                          <Film className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => regenerate(scene.id, 'animation')}
                        disabled={regenerating === `${scene.id}:animation`}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-xs transition-all disabled:opacity-50"
                      >
                        {regenerating === `${scene.id}:animation` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        إعادة توليد
                      </button>
                    </div>

                    {/* VOICE */}
                    <div className="bg-black/20 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-green-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" /> الصوت
                      </p>
                      {scene.voice_url ? (
                        <div className="space-y-1.5">
                          <audio controls src={scene.voice_url} className="w-full h-8" preload="metadata" />
                          <a href={scene.voice_url} download target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
                            <Download className="w-3 h-3" /> تنزيل
                          </a>
                        </div>
                      ) : (
                        <div className="h-16 bg-slate-800 rounded-lg border border-white/10 flex items-center justify-center">
                          <Volume2 className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => regenerate(scene.id, 'voice')}
                        disabled={regenerating === `${scene.id}:voice`}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs transition-all disabled:opacity-50"
                      >
                        {regenerating === `${scene.id}:voice` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        إعادة توليد
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Production Jobs log */}
      {jobs.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            سجل الإنتاج ({jobs.length} عمليات)
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-start text-xs text-gray-500 font-semibold">العملية</th>
                  <th className="px-4 py-3 text-start text-xs text-gray-500 font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start text-xs text-gray-500 font-semibold">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{job.job_type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(job.created_at).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
