"use client";

/**
 * /studio — JL AI Animation Factory — Clean Pipeline
 *
 * Architecture: 100% DB-backed. Frontend never manages image URLs.
 * Flow: idea → episode in DB → poll → script approval → poll → image approval → poll → video.
 *
 * Why this exists: idea-generator.tsx kept images in client state which never displayed.
 * This page reads everything from DB via polling — same pattern as /create but with rich UI.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon,
  Video, ScrollText, ChevronRight, ArrowRight, Play, RotateCcw, Wand2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "idea" | "generating_script" | "script_review" | "generating_images" | "image_review" | "producing_video" | "done";

interface Scene {
  id: string;
  scene_number: number;
  title?: string;
  description?: string;
  visual_prompt?: string;
  dialogue?: string;
  narration?: string;
  duration_seconds?: number;
  image_url?: string;
  status?: string;
}

interface Episode {
  id: string;
  title: string;
  idea?: string;
  description?: string;
  genre?: string;
  target_audience?: string;
  workflow_step?: string;
  workflow_status?: string;
  workflow_progress?: number;
  video_url?: string;
  scenes?: Scene[];
  metadata?: any;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

async function ensureAuth(): Promise<string | null> {
  const existing = getAuthToken();
  if (existing) return existing;
  const guestEmail = "guest@factory.jl";
  const guestPass = "GuestAccess2026!Secure";
  try {
    let res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: guestEmail, password: guestPass }),
    });
    let data = await res.json();
    if (data.success && data.data?.token) {
      localStorage.setItem("auth_token", data.data.token);
      return data.data.token;
    }
    res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: guestEmail, password: guestPass, full_name: "Guest", role: "viewer" }),
    });
    data = await res.json();
    if (data.success && data.data?.token) {
      localStorage.setItem("auth_token", data.data.token);
      return data.data.token;
    }
  } catch {}
  return null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  { id: "adventure", label: "مغامرة", emoji: "⚔️" },
  { id: "drama", label: "دراما", emoji: "🎭" },
  { id: "comedy", label: "كوميدي", emoji: "😄" },
  { id: "thriller", label: "إثارة", emoji: "🔥" },
  { id: "fantasy", label: "فانتازيا", emoji: "🧙" },
  { id: "sci-fi", label: "خيال علمي", emoji: "🚀" },
  { id: "mystery", label: "غموض", emoji: "🔍" },
  { id: "horror", label: "رعب", emoji: "👻" },
];

const AUDIENCES = [
  { id: "children", label: "أطفال", emoji: "🧒" },
  { id: "teens", label: "مراهقين", emoji: "👦" },
  { id: "adults", label: "بالغين", emoji: "👨" },
  { id: "general", label: "عائلي", emoji: "👨‍👩‍👧" },
];

const SCENE_COUNTS = [8, 12, 16, 20, 25];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudioPage() {
  // Form state
  const [step, setStep] = useState<Step>("idea");
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("adventure");
  const [audience, setAudience] = useState("general");
  const [sceneCount, setSceneCount] = useState(8);
  const [visualStyle, setVisualStyle] = useState("cinematic_realistic");

  // Episode state (single source of truth from DB)
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Approval state
  const [approvedScenes, setApprovedScenes] = useState<Set<number>>(new Set());

  // Auth on mount
  useEffect(() => {
    ensureAuth();
  }, []);

  // ─── Polling: keep episode synced with DB ──────────────────────────────────
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!episodeId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/episodes/${episodeId}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!data.success) return;
        const ep: Episode = data.data;
        setEpisode(ep);

        // Auto-advance step based on workflow_step + workflow_status
        const wfStep = ep.workflow_step;
        const wfStatus = ep.workflow_status;

        if (wfStep === "script" && wfStatus === "waiting_approval") {
          setStep("script_review");
        } else if (wfStep === "images" && wfStatus === "processing") {
          setStep("generating_images");
        } else if (wfStep === "images" && wfStatus === "waiting_approval") {
          setStep("image_review");
        } else if (
          ["production", "assembly", "subtitles"].includes(wfStep || "") ||
          (wfStep === "production" && wfStatus === "processing")
        ) {
          setStep("producing_video");
        } else if (wfStep === "completed" || wfStep === "final" || wfStatus === "completed" || ep.video_url) {
          setStep("done");
        }
      } catch (e) {
        console.warn("poll error", e);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [episodeId]);

  // Auto-mark images as ready for approval if they've been generated
  useEffect(() => {
    if (!episode?.scenes) return;
    if (step !== "image_review" && step !== "generating_images") return;
    const allHaveImages = episode.scenes.length > 0 && episode.scenes.every((s) => !!s.image_url);
    if (allHaveImages && step === "generating_images") {
      // Force set to image_review even if backend hasn't switched
      setStep("image_review");
    }
  }, [episode, step]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!title.trim() || !idea.trim()) {
      setError("الرجاء إدخال العنوان والفكرة");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await ensureAuth();
      // Step 1: create episode in DB with scene_count
      const res = await fetch(`${API_URL}/api/episodes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          idea,
          description: idea,
          genre,
          target_audience: audience,
          scene_count: sceneCount,
          visual_style: visualStyle,
          tags: [genre, audience],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "فشل إنشاء الحلقة");
      const epId = data.data.id;
      setEpisodeId(epId);
      setStep("generating_script");

      // Step 2: kick off script generation in background
      fetch(`${API_URL}/api/episodes/${epId}/start`, {
        method: "POST",
        headers: authHeaders(),
      }).catch(() => {});
    } catch (e: any) {
      setError(e.message || "خطأ غير معروف");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveScript = async () => {
    if (!episodeId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/script`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "approved" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل الاعتماد");
      setStep("generating_images");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateScript = async () => {
    if (!episodeId) return;
    setBusy(true);
    setStep("generating_script");
    try {
      await fetch(`${API_URL}/api/episodes/${episodeId}/start`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    } finally {
      setBusy(false);
    }
  };

  const toggleSceneApproval = (sceneNumber: number) => {
    setApprovedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneNumber)) next.delete(sceneNumber);
      else next.add(sceneNumber);
      return next;
    });
  };

  const approveAllImages = () => {
    if (!episode?.scenes) return;
    setApprovedScenes(new Set(episode.scenes.map((s) => s.scene_number)));
  };

  const handleApproveImages = async () => {
    if (!episodeId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/images`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "approved" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل الاعتماد");
      setStep("producing_video");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setStep("idea");
    setTitle("");
    setIdea("");
    setEpisodeId(null);
    setEpisode(null);
    setError("");
    setApprovedScenes(new Set());
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">JL Studio</h1>
              <p className="text-xs text-gray-400">مصنع الفيديو الذكي — نسخة نظيفة</p>
            </div>
          </div>
          {episodeId && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> ابدأ من جديد
            </button>
          )}
        </div>
      </header>

      {/* Progress steps */}
      <ProgressBar step={step} />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "idea" && (
            <IdeaForm
              key="idea"
              title={title}
              setTitle={setTitle}
              idea={idea}
              setIdea={setIdea}
              genre={genre}
              setGenre={setGenre}
              audience={audience}
              setAudience={setAudience}
              sceneCount={sceneCount}
              setSceneCount={setSceneCount}
              visualStyle={visualStyle}
              setVisualStyle={setVisualStyle}
              onStart={handleStart}
              busy={busy}
            />
          )}

          {step === "generating_script" && <Loading key="gs" label="جاري كتابة السكربت..." sub="Claude يبني السيناريو السينمائي" />}

          {step === "script_review" && episode && (
            <ScriptReview
              key="sr"
              episode={episode}
              onApprove={handleApproveScript}
              onRegenerate={handleRegenerateScript}
              busy={busy}
            />
          )}

          {step === "generating_images" && (
            <Loading
              key="gi"
              label="جاري توليد الصور..."
              sub={`${episode?.scenes?.filter((s) => s.image_url).length || 0} / ${episode?.scenes?.length || 0} صورة جاهزة`}
            />
          )}

          {step === "image_review" && episode && (
            <ImageReview
              key="ir"
              episode={episode}
              approvedScenes={approvedScenes}
              toggleScene={toggleSceneApproval}
              approveAll={approveAllImages}
              onApprove={handleApproveImages}
              busy={busy}
            />
          )}

          {step === "producing_video" && (
            <Loading
              key="pv"
              label="جاري إنتاج الفيديو النهائي..."
              sub="تجميع المشاهد + التحريك + الترجمة"
            />
          )}

          {step === "done" && episode && <DoneView key="dv" episode={episode} onReset={handleReset} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "idea", label: "الفكرة", icon: Sparkles },
    { id: "script_review", label: "السكربت", icon: ScrollText },
    { id: "image_review", label: "الصور", icon: ImageIcon },
    { id: "done", label: "الفيديو", icon: Video },
  ];

  const currentIdx = steps.findIndex((s) => {
    if (step === "idea") return s.id === "idea";
    if (step === "generating_script" || step === "script_review") return s.id === "script_review";
    if (step === "generating_images" || step === "image_review") return s.id === "image_review";
    if (step === "producing_video" || step === "done") return s.id === "done";
    return false;
  });

  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                        : isActive
                        ? "bg-purple-500/30 border-2 border-purple-400 text-white shadow-lg shadow-purple-500/40"
                        : "bg-white/5 border-2 border-white/10 text-gray-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs ${isActive ? "text-white font-bold" : isDone ? "text-green-300" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${i < currentIdx ? "bg-green-500/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IdeaForm(props: {
  title: string; setTitle: (v: string) => void;
  idea: string; setIdea: (v: string) => void;
  genre: string; setGenre: (v: string) => void;
  audience: string; setAudience: (v: string) => void;
  sceneCount: number; setSceneCount: (v: number) => void;
  visualStyle: string; setVisualStyle: (v: string) => void;
  onStart: () => void; busy: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">اكتب فكرتك</h2>
        <p className="text-gray-400">سنحوّلها إلى فيديو سينمائي بـ {props.sceneCount} لقطة</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">العنوان</label>
          <input
            type="text"
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder="مثال: آخر النخلة"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">الفكرة الكاملة</label>
          <textarea
            value={props.idea}
            onChange={(e) => props.setIdea(e.target.value)}
            placeholder="اكتب القصة، الشخصيات، الحبكة، الإحساس العام..."
            rows={6}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white resize-none"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-300">النوع</label>
          <div className="grid grid-cols-4 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => props.setGenre(g.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  props.genre === g.id
                    ? "bg-purple-500/30 border-2 border-purple-400 text-white"
                    : "bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-300">الجمهور</label>
          <div className="grid grid-cols-4 gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => props.setAudience(a.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  props.audience === a.id
                    ? "bg-pink-500/30 border-2 border-pink-400 text-white"
                    : "bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scene count */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-300">عدد اللقطات</label>
          <div className="grid grid-cols-5 gap-2">
            {SCENE_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => props.setSceneCount(n)}
                className={`py-2 rounded-xl text-sm font-bold transition-all ${
                  props.sceneCount === n
                    ? "bg-cyan-500/30 border-2 border-cyan-400 text-white"
                    : "bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">~{props.sceneCount * 5} ثانية فيديو نهائي</p>
        </div>

        {/* Visual style */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-300">الستايل البصري</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "cinematic_realistic", l: "🎬 سينمائي واقعي" },
              { v: "anime", l: "🌸 أنمي / Ghibli" },
              { v: "pixar_3d", l: "✨ Pixar 3D" },
              { v: "watercolor", l: "🎨 ألوان مائية" },
              { v: "black_and_white", l: "⚫ أبيض وأسود" },
              { v: "comic_book", l: "💥 كومكس" },
              { v: "oil_painting", l: "🖼️ زيتي كلاسيكي" },
              { v: "photorealistic", l: "📷 فوتوغرافي" },
            ].map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => props.setVisualStyle(s.v)}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                  props.visualStyle === s.v
                    ? "bg-amber-500/30 border-2 border-amber-400 text-white"
                    : "bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">يُطبّق على كل اللقطات لضمان وحدة الستايل</p>
        </div>

        {/* Start button */}
        <button
          onClick={props.onStart}
          disabled={props.busy || !props.title.trim() || !props.idea.trim()}
          className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 transition-all"
        >
          {props.busy ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> جاري البدء...</>
          ) : (
            <><Wand2 className="w-5 h-5" /> ابدأ الإنتاج <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function Loading({ label, sub }: { label: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-32"
    >
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-2">{label}</h3>
      {sub && <p className="text-gray-400">{sub}</p>}
    </motion.div>
  );
}

function ScriptReview({ episode, onApprove, onRegenerate, busy }: {
  episode: Episode; onApprove: () => void; onRegenerate: () => void; busy: boolean;
}) {
  const scenes = episode.scenes || [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-purple-400" />
            راجع السكربت
          </h2>
          <p className="text-gray-400">{scenes.length} مشهد — {episode.title}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {scenes.map((s) => (
          <div key={s.id} className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center font-bold shrink-0">
                {s.scene_number}
              </div>
              <div className="flex-1 space-y-2">
                {s.title && <h4 className="font-bold text-white">{s.title}</h4>}
                {s.description && <p className="text-gray-300 text-sm leading-relaxed">{s.description}</p>}
                {s.dialogue && (
                  <div className="mt-2 p-3 rounded-xl bg-black/30 border-r-2 border-purple-400">
                    <p className="text-gray-200 italic text-sm">&quot;{s.dialogue}&quot;</p>
                  </div>
                )}
                {s.visual_prompt && (
                  <details className="mt-2">
                    <summary className="text-xs text-cyan-400 cursor-pointer">برومبت الصورة</summary>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{s.visual_prompt}</p>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex gap-3">
        <button
          onClick={onRegenerate}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" /> توليد جديد
        </button>
        <button
          onClick={onApprove}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold disabled:opacity-50 shadow-lg shadow-purple-500/30"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          اعتمد السكربت — توليد الصور
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function ImageReview({ episode, approvedScenes, toggleScene, approveAll, onApprove, busy }: {
  episode: Episode;
  approvedScenes: Set<number>;
  toggleScene: (n: number) => void;
  approveAll: () => void;
  onApprove: () => void;
  busy: boolean;
}) {
  const scenes = episode.scenes || [];
  const approvedCount = approvedScenes.size;
  const totalCount = scenes.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <ImageIcon className="w-7 h-7 text-pink-400" />
            راجع الصور
          </h2>
          <p className="text-gray-400">{approvedCount} / {totalCount} معتمدة</p>
        </div>
        <button
          onClick={approveAll}
          className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30 text-sm font-medium"
        >
          اعتمد الكل
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((s) => {
          const isApproved = approvedScenes.has(s.scene_number);
          return (
            <div
              key={s.id}
              className={`rounded-2xl overflow-hidden border-2 transition-all ${
                isApproved ? "border-green-400 shadow-lg shadow-green-500/20" : "border-white/10"
              }`}
            >
              <div className="aspect-video bg-black/50 relative">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={`Scene ${s.scene_number}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-xs font-bold">
                  #{s.scene_number}
                </div>
              </div>
              <div className="p-3 bg-black/40 space-y-2">
                {s.dialogue && <p className="text-xs text-gray-300 italic line-clamp-2">&quot;{s.dialogue}&quot;</p>}
                <button
                  onClick={() => toggleScene(s.scene_number)}
                  disabled={!s.image_url}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 ${
                    isApproved
                      ? "bg-green-500/30 border border-green-400 text-green-200"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {isApproved ? "✓ معتمدة" : "اعتمد"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex gap-3">
        <button
          onClick={onApprove}
          disabled={busy || approvedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold disabled:opacity-40 shadow-lg shadow-purple-500/30"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          أنتج الفيديو ({approvedCount} صورة)
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function DoneView({ episode, onReset }: { episode: Episode; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-4xl font-bold">الفيديو جاهز! 🎉</h2>
      <p className="text-gray-400">{episode.title}</p>

      {episode.video_url ? (
        <video
          src={episode.video_url}
          controls
          className="w-full rounded-2xl border border-white/10 shadow-2xl"
        />
      ) : (
        <div className="aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">الفيديو يجمّع... سيظهر خلال ثوانٍ</p>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-medium"
      >
        ابدأ فيديو جديد
      </button>
    </motion.div>
  );
}
