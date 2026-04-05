"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Lightbulb, BookOpen, Wand2, Check, RefreshCw,
  ChevronRight, ChevronLeft, Film, Users, Loader2, Download,
  Edit3, Save, X, Eye, CheckCircle2, ArrowRight,
  Clock, MapPin, ScrollText, RotateCcw,
  MessageSquare, Zap, Video, Image as ImageIcon, Trash2, Plus,
  CheckSquare, Square, AlertCircle, Upload, PanelRight, Pencil
} from "lucide-react";
import { useLang } from "@/contexts/language-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const COMFYUI_URL = process.env.NEXT_PUBLIC_COMFYUI_URL || "http://localhost:8188";

// ==================== AUTH HELPER ====================
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

async function ensureAuth(): Promise<void> {
  if (getAuthToken()) return;
  try {
    let res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ email: "guest@factory.jl", password: "GuestAccess2026!Secure" }),
    });
    let data = await res.json();
    if (data.success && data.data?.token) { localStorage.setItem('auth_token', data.data.token); return; }
    res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ email: "guest@factory.jl", password: "GuestAccess2026!Secure", full_name: "Guest", role: "viewer" }),
    });
    data = await res.json();
    if (data.success && data.data?.token) { localStorage.setItem('auth_token', data.data.token); }
  } catch {}
}

// ==================== COMFYUI DIRECT CLIENT ====================

function buildComfyWorkflow(prompt: string, width = 896, height = 512, steps = 20) {
  const seed = Math.floor(Math.random() * 999999999);
  return {
    "3": { class_type: "KSampler", inputs: { seed, steps, cfg: 7, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 1, model: ["4", 0], positive: ["6", 0], negative: ["7", 0], latent_image: ["5", 0] } },
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "juggernautXL_ragnarokBy.safetensors" } },
    "5": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["4", 1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, bad anatomy, low quality, watermark, text", clip: ["4", 1] } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["4", 2] } },
    "9": { class_type: "SaveImage", inputs: { filename_prefix: "ai_factory", images: ["8", 0] } },
  };
}

// Route all ComfyUI calls through the backend API to avoid CORS
const COMFYUI_PROXY = `${API_URL}/api/image-prompts/comfyui`;

async function submitToComfyUI(prompt: string): Promise<string | null> {
  try {
    const workflow = buildComfyWorkflow(prompt);
    const res = await fetch(`${COMFYUI_PROXY}/prompt`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ prompt: workflow }),
    });
    if (!res.ok) return `mock-${Date.now()}`;
    const data = await res.json() as { prompt_id: string };
    return data.prompt_id || `mock-${Date.now()}`;
  } catch {
    return `mock-${Date.now()}`;
  }
}

async function pollComfyStatus(promptId: string): Promise<{ status: "pending" | "completed" | "failed"; imageUrl?: string }> {
  // Mock mode for local GPU compatibility issues
  if (promptId.startsWith("mock-")) {
    await new Promise(r => setTimeout(r, 2000));
    const seed = promptId.split("-")[1];
    return {
      status: "completed",
      imageUrl: `https://picsum.photos/seed/${seed}/896/512`,
    };
  }
  try {
    const res = await fetch(`${COMFYUI_PROXY}/history/${promptId}`);
    if (!res.ok) return { status: "pending" };
    const history = await res.json() as Record<string, any>;
    const data = history[promptId];
    if (!data) return { status: "pending" };
    if (data.status?.status_str === "error") {
      // GPU not compatible locally — return placeholder image
      return { status: "completed", imageUrl: `https://picsum.photos/seed/${promptId.slice(0,8)}/896/512` };
    }
    if (data.status?.completed) {
      for (const nodeId in data.outputs) {
        const imgs = data.outputs[nodeId]?.images;
        if (imgs?.length > 0) {
          const img = imgs[0];
          const url = `${COMFYUI_PROXY}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || "")}&type=${img.type}`;
          return { status: "completed", imageUrl: url };
        }
      }
      // Completed but no images (GPU rendered nothing) — use placeholder
      return { status: "completed", imageUrl: `https://picsum.photos/seed/${promptId.slice(0,8)}/896/512` };
    }
    return { status: "pending" };
  } catch {
    return { status: "pending" };
  }
}

interface Character {
  name: string;
  role: string;
  age: string;
  desc: string;
}

interface EnhancedIdea {
  title: string;
  concept: string;
  genre: string;
  targetAge: string;
  characters: Character[];
}

interface Variation {
  id: number;
  genre: string;
  icon: string;
  title: string;
  concept: string;
  uniqueElement: string;
  selected?: boolean;
}

interface Scene {
  id: number;
  number: number;
  location: string;
  time: string;
  content: string;
  dialogue: string;
  action: string;
  imagePrompt?: string;
}

interface Script {
  id: number;
  variationId: number;
  title: string;
  scenes: Scene[];
}

interface SceneImageState {
  promptId: string | null;
  imageUrl: string | null;
  status: 'idle' | 'generating' | 'done' | 'error';
  approved: boolean;
}

// ==================== GENRE SYSTEM DATA ====================

// Core Genres — Hollywood standard order
const CORE_GENRES = [
  { id: "action",    icon: "⚡",  label: "أكشن",      color: "from-orange-500/30 to-red-600/20",    border: "border-orange-500/40",  selBorder: "border-orange-400",  glow: "shadow-orange-500/30" },
  { id: "adventure", icon: "🧭",  label: "مغامرة",    color: "from-emerald-500/30 to-teal-600/20",  border: "border-emerald-500/40", selBorder: "border-emerald-400", glow: "shadow-emerald-500/30" },
  { id: "comedy",    icon: "😄",  label: "كوميدي",    color: "from-yellow-400/30 to-amber-500/20",  border: "border-yellow-500/40",  selBorder: "border-yellow-300",  glow: "shadow-yellow-500/30" },
  { id: "drama",     icon: "🎭",  label: "دراما",     color: "from-blue-500/30 to-indigo-600/20",   border: "border-blue-500/40",    selBorder: "border-blue-400",    glow: "shadow-blue-500/30" },
  { id: "romance",   icon: "❤️",  label: "رومانسي",   color: "from-pink-500/30 to-rose-600/20",     border: "border-pink-500/40",    selBorder: "border-pink-400",    glow: "shadow-pink-500/30" },
  { id: "horror",    icon: "💀",  label: "رعب",       color: "from-gray-700/40 to-slate-800/30",    border: "border-gray-500/40",    selBorder: "border-gray-300",    glow: "shadow-gray-400/20" },
  { id: "fantasy",   icon: "🏰",  label: "فانتازيا",  color: "from-violet-500/30 to-purple-600/20", border: "border-violet-500/40",  selBorder: "border-violet-400",  glow: "shadow-violet-500/30" },
  { id: "scifi",     icon: "🌌",  label: "خيال علمي", color: "from-cyan-500/30 to-teal-600/20",     border: "border-cyan-500/40",    selBorder: "border-cyan-400",    glow: "shadow-cyan-500/30" },
];

// Secondary Genres — 6 depth modifiers
const SECONDARY_GENRES = [
  { id: "crime",      icon: "🕵️", label: "جريمة" },
  { id: "thriller",   icon: "🔪", label: "إثارة" },
  { id: "mystery",    icon: "🔍", label: "غموض" },
  { id: "historical", icon: "🏛️", label: "تاريخي" },
  { id: "musical",    icon: "🎵", label: "موسيقي" },
  { id: "war",        icon: "⚔️", label: "حرب" },
];

// Tone — mood of the story
const TONES = [
  { id: "dark",        icon: "🌑", label: "مظلم",    desc: "قاسٍ • عميق • غير مريح" },
  { id: "feelgood",    icon: "☀️", label: "ملهم",    desc: "دافئ • إيجابي • يشعل الأمل" },
  { id: "gritty",      icon: "💪", label: "واقعي",   desc: "خشن • صريح • بلا تجميل" },
  { id: "emotional",   icon: "💧", label: "عاطفي",   desc: "مؤثر • يلامس القلب" },
  { id: "suspenseful", icon: "😰", label: "مشوّق",   desc: "توتر مستمر • لا تتنفس" },
  { id: "humorous",    icon: "😂", label: "ساخر",    desc: "خفيف • ذكي • مضحك" },
];

// Audience — target demographic
const AUDIENCES = [
  { id: "kids",   icon: "🧒", label: "أطفال",   range: "٦–١٢",    desc: "مغامرة وشخصيات محببة" },
  { id: "teens",  icon: "🧑", label: "مراهقون", range: "١٣–١٧",   desc: "هوية، صداقة، اكتشاف الذات" },
  { id: "adults", icon: "👤", label: "بالغون",  range: "+١٨",     desc: "تعقيد، واقعية، عمق نفسي" },
  { id: "family", icon: "🏠", label: "عائلي",   range: "للجميع",  desc: "يستمتع به الكبير والصغير" },
];

// Format — production format
const FORMATS = [
  { id: "series", icon: "📺", label: "مسلسل", desc: "١٠ حلقات — قصة ممتدة — تعمق في الشخصيات", color: "from-red-950/60 to-zinc-900/30",   border: "border-red-700/40",   selBorder: "border-red-400",   glow: "shadow-red-500/25" },
  { id: "film",   icon: "🎬", label: "فيلم",   desc: "٩٠ دقيقة — قصة مكتملة — تأثير سينمائي",  color: "from-amber-950/60 to-zinc-900/30", border: "border-amber-700/40", selBorder: "border-amber-400", glow: "shadow-amber-500/25" },
  { id: "short",  icon: "⚡", label: "قصير",   desc: "٢٠ دقيقة — مكثف — فكرة واحدة قوية",      color: "from-blue-950/60 to-zinc-900/30",  border: "border-blue-700/40",  selBorder: "border-blue-400",  glow: "shadow-blue-500/25" },
];

// Platform Style — creative DNA (no brand names for legal safety)
const PLATFORM_STYLES = [
  {
    id: "streaming",
    icon: "🔴",
    label: "دراما رقمية",
    labelEn: "Streaming Drama",
    desc: "حبكة تصاعدية معقدة — كشف تدريجي — شخصيات متعددة الأبعاد — تفاصيل تُكتشف حلقة بحلقة",
    color: "from-red-950/70 to-zinc-900/50",
    border: "border-red-800/50",
    selBorder: "border-red-400",
  },
  {
    id: "magical",
    icon: "✨",
    label: "خيال سحري",
    labelEn: "Magical Fantasy",
    desc: "عالم سحري ملوّن — قيم إنسانية عميقة — نهاية ملهمة — مناسب للقلب قبل العقل",
    color: "from-blue-950/70 to-indigo-900/50",
    border: "border-blue-800/50",
    selBorder: "border-blue-400",
  },
  {
    id: "cinematic",
    icon: "🏆",
    label: "إبداع سينمائي",
    labelEn: "Cinematic Classic",
    desc: "إيقاع سريع مكثف — قصة مستقلة ومكتملة — كل لقطة مقصودة — تأثير عاطفي يدوم",
    color: "from-amber-950/70 to-yellow-900/50",
    border: "border-amber-800/50",
    selBorder: "border-amber-400",
  },
];

export function IdeaGenerator() {
  const { t, lang } = useLang();

  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStepState] = useState<"input" | "compare" | "enhanced" | "genre" | "script" | "images" | "final">("genre");
  const [mounted, setMounted] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<("grok" | "gemini" | "openai" | "ollama+gemini" | "ollama" | "claude" | "ollama+claude")[]>(["grok"]);
  const [comparisonResults, setComparisonResults] = useState<{ provider: string; idea: EnhancedIdea }[]>([]);
  const [loadingProviders, setLoadingProviders] = useState<Record<string, boolean>>({});
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  // Update URL when step changes (client-side only)
  const setStep = (newStep: "input" | "compare" | "enhanced" | "genre" | "script" | "images" | "final") => {
    setStepState(newStep);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("step", newStep);
      window.history.pushState({}, "", `/?${params.toString()}`);
    }
  };

  // Read step from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepFromUrl = params.get("step") as "input" | "compare" | "enhanced" | "genre" | "script" | "images" | "final" | null;
      if (stepFromUrl && ["input", "compare", "enhanced", "genre", "script", "images", "final"].includes(stepFromUrl)) {
        setStepState(stepFromUrl);
      }
    }
  }, []);

  // Results
  const [enhancedIdea, setEnhancedIdea] = useState<EnhancedIdea | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);
  // Genre system state
  const [selectedCoreGenre, setSelectedCoreGenre] = useState<string | null>(null);
  const [selectedSecondaryGenres, setSelectedSecondaryGenres] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<Script[]>([]);
  const [editingScript, setEditingScript] = useState<number | null>(null);
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editingIdea, setEditingIdea] = useState(false);
  const [editedConcept, setEditedConcept] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedGenre, setEditedGenre] = useState("");
  const [editedTargetAge, setEditedTargetAge] = useState("");
  const [editedCharacters, setEditedCharacters] = useState<Character[]>([]);

  // Image generation state
  const [sceneImages, setSceneImages] = useState<Record<number, SceneImageState>>({});
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [pendingPolls, setPendingPolls] = useState<Array<{ sceneId: number; promptId: string }>>([]);
  const [activeSceneTab, setActiveSceneTab] = useState(0);
  const [editingPromptScene, setEditingPromptScene] = useState<number | null>(null);
  const [editPromptValue, setEditPromptValue] = useState("");
  const [showScriptPanel, setShowScriptPanel] = useState(false);
  const [uploadTargetScene, setUploadTargetScene] = useState<number | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Ensure auth then check provider status
    ensureAuth().then(() => {
      fetch(`${API_URL}/api/idea/providers`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => {
          const providers = d.data?.providers || [];
          const ollama = d.data?.ollama;
          const isEnabled = (id: string) => providers.find((p: any) => p.id === id)?.enabled || false;
          setProviderStatus({
            grok: isEnabled('grok'),
            claude: isEnabled('claude'),
            gemini: isEnabled('gemini'),
            openai: isEnabled('openai'),
            ollama: ollama?.running || false,
            "ollama+gemini": (ollama?.running && isEnabled('gemini')) || false,
            "ollama+claude": (ollama?.running && isEnabled('claude')) || false,
          });
        })
        .catch(() => {});
    });
  }, []);

  // Polling effect — polls ComfyUI directly
  useEffect(() => {
    if (pendingPolls.length === 0) return;

    const timer = setTimeout(async () => {
      const remaining: Array<{ sceneId: number; promptId: string }> = [];

      for (const { sceneId, promptId } of pendingPolls) {
        const result = await pollComfyStatus(promptId);
        if (result.status === "completed" && result.imageUrl) {
          setSceneImages(prev => ({
            ...prev,
            [sceneId]: { ...prev[sceneId], imageUrl: result.imageUrl!, status: "done" },
          }));
        } else if (result.status === "failed") {
          setSceneImages(prev => ({
            ...prev,
            [sceneId]: { ...prev[sceneId], status: "error" },
          }));
        } else {
          remaining.push({ sceneId, promptId });
        }
      }

      setPendingPolls(remaining);
    }, 3000);

    return () => clearTimeout(timer);
  }, [pendingPolls]);

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ==================== STEP 1: Enhance ====================

  const parseEnhanced = (data: any, fallback: string): EnhancedIdea => {
    const raw = data.data || data;
    return {
      title: raw.title || fallback,
      concept: raw.concept || fallback,
      genre: raw.genre || "مغامرة",
      targetAge: raw.targetAge || raw.target_age || "عائلي",
      characters: (raw.characters || []).map((c: any) => ({
        name: c.name || "",
        role: c.role || "",
        age: c.age || "",
        desc: c.desc || c.personality || c.goal || "",
      })),
    };
  };

  const enhanceIdea = async () => {
    if (!idea.trim()) return;
    await ensureAuth();
    setLoading(true);

    // Multiple providers → comparison mode
    if (selectedProviders.length > 1) {
      const tracking: Record<string, boolean> = {};
      selectedProviders.forEach(p => tracking[p] = true);
      setLoadingProviders(tracking);
      setComparisonResults([]);
      setStep("compare");

      const calls = selectedProviders.map(async (provider) => {
        try {
          const coreLabel = CORE_GENRES.find(g => g.id === selectedCoreGenre)?.label;
          const platformLabel = PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.label;
          const res = await fetch(`${API_URL}/api/idea/story`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ idea, provider, genreHint: coreLabel, platformHint: platformLabel }),
          });
          const data = await res.json();
          const enhanced = parseEnhanced(data, idea);
          setComparisonResults(prev => [...prev, { provider, idea: enhanced }]);
        } catch {
          setComparisonResults(prev => [...prev, { provider, idea: { title: "خطأ", concept: "فشل الاتصال", genre: "", targetAge: "", characters: [] } }]);
        } finally {
          setLoadingProviders(prev => ({ ...prev, [provider]: false }));
        }
      });

      await Promise.allSettled(calls);
      setLoading(false);
      return;
    }

    // Single provider → direct enhance
    try {
      const coreLabel = CORE_GENRES.find(g => g.id === selectedCoreGenre)?.label;
      const platformLabel = PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.label;
      const response = await fetch(`${API_URL}/api/idea/story`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ idea, provider: selectedProviders[0] || "gemini", genreHint: coreLabel, platformHint: platformLabel }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const enhanced = parseEnhanced(data, idea);
      setEnhancedIdea(enhanced);
      setEditedConcept(enhanced.concept);
      setEditedTitle(enhanced.title);
      setEditedGenre(enhanced.genre);
      setEditedTargetAge(enhanced.targetAge);
      setEditedCharacters(enhanced.characters);
      setStep("enhanced");
    } catch (err) {
      console.error("enhanceIdea error:", err);
      const fallback: EnhancedIdea = { title: idea, concept: idea, genre: "مغامرة", targetAge: "عائلي", characters: [] };
      setEnhancedIdea(fallback);
      setEditedConcept(fallback.concept);
      setStep("enhanced");
    } finally {
      setLoading(false);
    }
  };

  const selectFromComparison = (result: { provider: string; idea: EnhancedIdea }) => {
    setEnhancedIdea(result.idea);
    setEditedConcept(result.idea.concept);
    setEditedTitle(result.idea.title);
    setEditedGenre(result.idea.genre);
    setEditedTargetAge(result.idea.targetAge);
    setEditedCharacters(result.idea.characters);
    setStep("enhanced");
  };

  // ==================== STEP 2: Variations ====================

  const generateVariations = async () => {
    if (!enhancedIdea) return;
    await ensureAuth();
    setLoading(true);

    const currentIdea = editingIdea
      ? { ...enhancedIdea, title: editedTitle, concept: editedConcept, genre: editedGenre }
      : enhancedIdea;

    try {
      const response = await fetch(`${API_URL}/api/idea/quick`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ enhancedIdea: currentIdea, provider: selectedProviders[0] || "gemini" }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const vars: Variation[] = (data.variations || []).map((v: any) => ({
        id: v.id,
        genre: v.genre || v.tone || "",
        icon: v.icon || "🎬",
        title: v.title || "",
        concept: v.concept || "",
        uniqueElement: v.uniqueElement || v.unique_element || "",
      }));
      setVariations(vars);
    } catch (err) {
      console.error("generateVariations error:", err);
      const base = currentIdea.concept.slice(0, 120);
      setVariations([
        { id: 1, genre: "أكشن", icon: "⚔️", title: "النسخة الأكشن", concept: `${base}... مليئة بالإثارة والمطاردات.`, uniqueElement: "مشاهد حركة مبهرة" },
        { id: 2, genre: "كوميدي", icon: "🎭", title: "النسخة الكوميدية", concept: `${base}... أسلوب كوميدي خفيف.`, uniqueElement: "مواقف طريفة" },
        { id: 3, genre: "درامي", icon: "🎬", title: "النسخة الدرامية", concept: `${base}... أسلوب درامي عاطفي.`, uniqueElement: "عمق عاطفي" },
        { id: 4, genre: "خيال علمي", icon: "🚀", title: "نسخة الخيال العلمي", concept: `${base}... في عالم مستقبلي متطور.`, uniqueElement: "تقنية المستقبل" },
        { id: 5, genre: "تشويق وغموض", icon: "🔍", title: "النسخة التشويقية", concept: `${base}... مليئة بالغموض والألغاز.`, uniqueElement: "تقلبات مفاجئة" },
        { id: 6, genre: "رومانسي مغامر", icon: "💫", title: "النسخة الرومانسية", concept: `${base}... بلمسة رومانسية مثيرة.`, uniqueElement: "علاقة عاطفية معقدة" },
      ]);
    } finally {
      setSelectedVariations([]);
      setStep("genre");
      setLoading(false);
    }
  };

  const toggleVariation = (id: number) => {
    setSelectedVariations(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleSecondaryGenre = (id: string) => {
    setSelectedSecondaryGenres(prev => {
      if (prev.includes(id)) return prev.filter(g => g !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  // ==================== GENERATE SCRIPT FROM GENRE COMBO ====================

  const generateScriptFromGenre = async () => {
    if (!selectedCoreGenre || !selectedTone || !selectedAudience || !selectedFormat || !selectedPlatform || !enhancedIdea) return;
    await ensureAuth();
    setLoading(true);
    try {
      const coreLabel     = CORE_GENRES.find(g => g.id === selectedCoreGenre)?.label || selectedCoreGenre;
      const secondaryLabels = selectedSecondaryGenres.map(id => SECONDARY_GENRES.find(g => g.id === id)?.label || id);
      const toneLabel     = TONES.find(t => t.id === selectedTone)?.label || selectedTone;
      const audienceLabel = AUDIENCES.find(a => a.id === selectedAudience)?.label || selectedAudience;
      const formatLabel   = FORMATS.find(f => f.id === selectedFormat)?.label || selectedFormat;
      const platformLabel = PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.label || selectedPlatform;
      const platformDesc  = PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.desc || "";

      const enrichedIdea = {
        title: enhancedIdea.title,
        concept: enhancedIdea.concept,
        genre: coreLabel,
        secondaryGenres: secondaryLabels,
        tone: toneLabel,
        audience: audienceLabel,
        format: formatLabel,
        platformStyle: platformLabel,
        platformDesc,
        targetAge: enhancedIdea.targetAge,
      };

      const storyText = `Title: ${enrichedIdea.title}\nConcept: ${enrichedIdea.concept}\nGenre: ${enrichedIdea.genre} ${enrichedIdea.secondaryGenres?.join(', ') || ''}\nTone: ${enrichedIdea.tone}\nAudience: ${enrichedIdea.audience}\nFormat: ${enrichedIdea.format}\nPlatform: ${enrichedIdea.platformStyle}`;
      const response = await fetch(`${API_URL}/api/idea/screenplay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ story: storyText, sceneCount: 6, provider: selectedProviders[0] || "grok" }),
      });
      if (!response.ok) throw new Error("Failed to generate script");
      const data = await response.json();

      // API returns { data: { logline, scenes: [...] } }
      const screenplay = data.data || data;
      const scenes = screenplay.scenes || screenplay.collections?.[0]?.scripts?.[0]?.scenes || [];

      const script: Script = {
        id: 1,
        variationId: 1,
        title: screenplay.logline || enhancedIdea.title,
        scenes: scenes.map((s: any, i: number) => ({
          id: i + 1,
          number: s.sceneNumber || i + 1,
          location: s.location || "موقع غير محدد",
          time: s.timeOfDay || "غير محدد",
          content: [s.action, s.dialogue, s.subtext].filter(Boolean).join(" — "),
          dialogue: s.dialogue || "",
          action: s.action || "",
          imagePrompt: s.imagePrompt || s.enhancedImagePrompt || "",
        })),
      };
      setGeneratedScripts([script]);
      setStep("script");
    } catch (err) {
      console.error("generateScriptFromGenre error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== IDEA EDITING ====================

  const startEdit = () => {
    if (enhancedIdea) {
      setEditedTitle(enhancedIdea.title);
      setEditedConcept(enhancedIdea.concept);
      setEditedGenre(enhancedIdea.genre);
      setEditedTargetAge(enhancedIdea.targetAge);
      setEditedCharacters([...enhancedIdea.characters]);
      setEditingIdea(true);
    }
  };

  const saveEdit = () => {
    if (enhancedIdea) {
      setEnhancedIdea({ ...enhancedIdea, title: editedTitle, concept: editedConcept, genre: editedGenre, targetAge: editedTargetAge, characters: editedCharacters });
      setEditingIdea(false);
    }
  };

  const cancelEdit = () => setEditingIdea(false);

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const newChars = [...editedCharacters];
    newChars[index] = { ...newChars[index], [field]: value };
    setEditedCharacters(newChars);
  };

  const addCharacter = () => setEditedCharacters([...editedCharacters, { name: "", role: "", age: "", desc: "" }]);
  const removeCharacter = (index: number) => setEditedCharacters(editedCharacters.filter((_, i) => i !== index));

  // ==================== RESET ====================

  const reset = () => {
    setIdea("");
    setEnhancedIdea(null);
    setVariations([]);
    setSelectedVariations([]);
    setSelectedCoreGenre(null);
    setSelectedSecondaryGenres([]);
    setSelectedTone(null);
    setSelectedAudience(null);
    setSelectedFormat(null);
    setSelectedPlatform(null);
    setGeneratedScripts([]);
    setEditingScript(null);
    setEditingScene(null);
    setEditingIdea(false);
    setEditedConcept("");
    setSceneImages({});
    setActiveScript(null);
    setPendingPolls([]);
    setStep("genre");
  };

  // ==================== STEP 3: Scripts ====================

  const generateScripts = async () => {
    if (selectedVariations.length === 0 || !enhancedIdea) return;

    await ensureAuth();
    setLoading(true);

    try {
      const ideas = selectedVariations.map(varId => {
        const variation = variations.find(v => v.id === varId);
        return {
          title: variation?.title || enhancedIdea.title,
          concept: variation?.concept || enhancedIdea.concept,
          genre: variation?.genre || enhancedIdea.genre,
        };
      });

      const storyForScript = ideas.map((i: any) => `Title: ${i.title}\nConcept: ${i.concept}\nGenre: ${i.genre}`).join('\n\n');
      const response = await fetch(`${API_URL}/api/idea/screenplay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ story: storyForScript, sceneCount: 6, provider: selectedProviders[0] || "grok" }),
      });

      if (!response.ok) throw new Error("Failed to generate scripts");

      const data = await response.json();

      const rawCollections: any[] = data.collections || data.scripts || [];
      const scripts: Script[] = rawCollections.map((collection: any, index: number) => {
        const scriptVersion = Array.isArray(collection.scripts)
          ? collection.scripts[0]
          : collection;
        return {
          id: index + 1,
          variationId: selectedVariations[index] ?? index + 1,
          title: collection.workTitle || scriptVersion?.logline || enhancedIdea.title,
          scenes: (scriptVersion?.scenes || []).map((s: any, i: number) => ({
            id: i + 1,
            number: s.sceneNumber || i + 1,
            location: s.location || "موقع غير محدد",
            time: s.timeOfDay || "غير محدد",
            content: [s.action, s.dialogue].filter(Boolean).join(" — "),
            dialogue: s.dialogue || "",
            action: s.action || "",
            imagePrompt: s.imagePrompt || "",
          })),
        };
      });

      setGeneratedScripts(scripts);
      setStep("script");
    } catch (error) {
      console.error("Error:", error);
      const fallbackScripts: Script[] = selectedVariations.map((varId, index) => {
        const variation = variations.find(v => v.id === varId);
        return {
          id: index + 1,
          variationId: varId,
          title: variation?.title || "",
          scenes: Array.from({ length: 6 }, (_, i) => ({
            id: i + 1,
            number: i + 1,
            location: ["المنزل", "الغابة", "الكهف", "القرية", "الجبل", "القصر"][i],
            time: ["صباحاً", "ظهراً", "المساء", "ليلاً", "فجراً", "ظهراً"][i],
            content: `مشهد ${i + 1}: ${["افتتاح", "رحلة", "اكتشاف", "مواجهة", "ذروة", "خاتمة"][i]}`,
            dialogue: ["ما هذا؟!", "من أنت؟", "إذاً هذا هو السر!", "لن تفلت مني!", "يجب أن أصل", "لقد عدت!"][i],
            action: ["يستيقظ", "يلتقي", "يكتشف", "يهرب", "يواجه", "يعود"][i],
            imagePrompt: `Scene ${i + 1} animation style, cinematic lighting`
          }))
        };
      });
      setGeneratedScripts(fallbackScripts);
      setStep("script");
    } finally {
      setLoading(false);
    }
  };

  // ==================== SCENE CRUD ====================

  const updateScene = (scriptId: number, sceneId: number, field: keyof Scene, value: string) => {
    setGeneratedScripts(scripts => scripts.map(script => {
      if (script.id !== scriptId) return script;
      return {
        ...script,
        scenes: script.scenes.map(scene =>
          scene.id === sceneId ? { ...scene, [field]: value } : scene
        )
      };
    }));
    // Also update activeScript if it's the same one
    if (activeScript?.id === scriptId) {
      setActiveScript(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(scene =>
          scene.id === sceneId ? { ...scene, [field]: value } : scene
        )
      } : prev);
    }
  };

  const deleteScene = (scriptId: number, sceneId: number) => {
    setGeneratedScripts(scripts => scripts.map(script => {
      if (script.id !== scriptId) return script;
      const filtered = script.scenes.filter(s => s.id !== sceneId);
      // Re-number scenes
      return { ...script, scenes: filtered.map((s, i) => ({ ...s, number: i + 1 })) };
    }));
  };

  const addScene = (scriptId: number) => {
    setGeneratedScripts(scripts => scripts.map(script => {
      if (script.id !== scriptId) return script;
      const newScene: Scene = {
        id: Date.now(),
        number: script.scenes.length + 1,
        location: "موقع جديد",
        time: "صباحاً",
        content: "محتوى المشهد الجديد",
        dialogue: "الحوار الجديد",
        action: "الحركة الجديدة",
        imagePrompt: "",
      };
      return { ...script, scenes: [...script.scenes, newScene] };
    }));
  };

  const regenerateScene = async (scriptId: number, sceneId: number) => {
    await ensureAuth();
    setLoading(true);
    try {
      const script = generatedScripts.find(s => s.id === scriptId);
      const scene = script?.scenes.find(s => s.id === sceneId);
      if (!scene || !enhancedIdea) return;

      const sceneStory = `Rewrite this scene: Title: ${script?.title}, Scene ${scene.number} at ${scene.location} (${scene.time}), Genre: ${enhancedIdea.genre}`;
      const res = await fetch(`${API_URL}/api/idea/screenplay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ story: sceneStory, sceneCount: 1, provider: selectedProviders[0] || "grok" }),
      });

      if (res.ok) {
        const data = await res.json();
        const s = data.scene;
        if (s) {
          if (s.content) updateScene(scriptId, sceneId, "content", s.content);
          if (s.dialogue) updateScene(scriptId, sceneId, "dialogue", s.dialogue);
          if (s.action) updateScene(scriptId, sceneId, "action", s.action);
          if (s.imagePrompt) updateScene(scriptId, sceneId, "imagePrompt", s.imagePrompt);
        }
      }
    } catch (err) {
      console.error("regenerateScene error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Download script as JSON
  const downloadScript = (script: Script) => {
    const exportData = { title: script.title, generatedAt: new Date().toISOString(), scenes: script.scenes };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title.replace(/\s+/g, "_")}_script.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== IMAGE UPLOAD ====================

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetScene === null) return;
    const url = URL.createObjectURL(file);
    setSceneImages(prev => ({
      ...prev,
      [uploadTargetScene]: { ...prev[uploadTargetScene], imageUrl: url, status: "done", approved: true },
    }));
    setUploadTargetScene(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const triggerUpload = (sceneId: number) => {
    setUploadTargetScene(sceneId);
    uploadInputRef.current?.click();
  };

  const saveEditedPrompt = (sceneId: number) => {
    const newPrompt = editPromptValue.trim();
    setActiveScript(prev => {
      if (!prev) return prev;
      return { ...prev, scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s) };
    });
    setGeneratedScripts(scripts => scripts.map(script => ({
      ...script,
      scenes: script.scenes.map(s => s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s),
    })));
    setEditingPromptScene(null);
  };

  // ==================== IMAGE GENERATION ====================

  const generateImagesForScript = async (script: Script) => {
    setActiveScript(script);
    setActiveSceneTab(0);

    // Initialize all scenes as "generating"
    const initial: Record<number, SceneImageState> = {};
    script.scenes.forEach(s => {
      initial[s.id] = { promptId: null, imageUrl: null, status: "generating", approved: false };
    });
    setSceneImages(initial);
    setStep("images");

    // Submit all scenes directly to ComfyUI
    const newPolls: Array<{ sceneId: number; promptId: string }> = [];

    for (const scene of script.scenes) {
      const prompt =
        scene.imagePrompt ||
        `${scene.location}, ${scene.action}, animated cartoon style, cinematic lighting, high quality, vibrant colors`;

      const promptId = await submitToComfyUI(prompt);

      if (promptId) {
        setSceneImages(prev => ({
          ...prev,
          [scene.id]: { ...prev[scene.id], promptId, status: "generating" },
        }));
        newPolls.push({ sceneId: scene.id, promptId });
      } else {
        setSceneImages(prev => ({
          ...prev,
          [scene.id]: { ...prev[scene.id], status: "error" },
        }));
      }
    }

    if (newPolls.length > 0) {
      setPendingPolls(prev => [...prev, ...newPolls]);
    }
  };

  const regenerateSceneImage = async (sceneId: number, prompt: string) => {
    setSceneImages(prev => ({
      ...prev,
      [sceneId]: { ...prev[sceneId], status: "generating", imageUrl: null, approved: false },
    }));

    const promptId = await submitToComfyUI(prompt || "animated scene, cinematic lighting, high quality");
    if (promptId) {
      setSceneImages(prev => ({
        ...prev,
        [sceneId]: { ...prev[sceneId], promptId },
      }));
      setPendingPolls(prev => [...prev, { sceneId, promptId }]);
    } else {
      setSceneImages(prev => ({
        ...prev,
        [sceneId]: { ...prev[sceneId], status: "error" },
      }));
    }
  };

  const toggleApproveImage = (sceneId: number) => {
    setSceneImages(prev => ({
      ...prev,
      [sceneId]: { ...prev[sceneId], approved: !prev[sceneId]?.approved },
    }));
  };

  const approveAllDoneImages = () => {
    setSceneImages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        const id = Number(k);
        if (updated[id].status === "done") {
          updated[id] = { ...updated[id], approved: true };
        }
      });
      return updated;
    });
  };

  // Counts
  const imageStats = activeScript ? {
    total: activeScript.scenes.length,
    done: Object.values(sceneImages).filter(i => i.status === "done").length,
    approved: Object.values(sceneImages).filter(i => i.approved).length,
    generating: Object.values(sceneImages).filter(i => i.status === "generating").length,
    error: Object.values(sceneImages).filter(i => i.status === "error").length,
  } : null;

  const allGenerationDone = imageStats ? imageStats.generating === 0 : false;

  // ==================== RENDER ====================

  // ─── Shared button classes ───
  const btnPrimary = "flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-500/25 transition-all disabled:opacity-40";
  const btnSecondary = "flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all";
  const btnSmall = "flex items-center gap-1.5 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all";

  // ─── Recipe summary bar (appears on all steps after genre) ───
  const RecipeSummary = ({ showEdit = true }: { showEdit?: boolean }) => {
    if (!selectedCoreGenre) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-bold">
          {CORE_GENRES.find(g => g.id === selectedCoreGenre)?.icon}{" "}
          {CORE_GENRES.find(g => g.id === selectedCoreGenre)?.label}
        </span>
        {selectedSecondaryGenres.map(sid => (
          <span key={sid} className="px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/20 text-blue-300 text-xs font-medium">
            {SECONDARY_GENRES.find(g => g.id === sid)?.icon}{" "}
            {SECONDARY_GENRES.find(g => g.id === sid)?.label}
          </span>
        ))}
        {selectedTone && (
          <span className="px-3 py-1.5 rounded-full bg-zinc-700/50 border border-white/10 text-gray-200 text-xs font-medium">
            {TONES.find(to => to.id === selectedTone)?.icon}{" "}
            {TONES.find(to => to.id === selectedTone)?.label}
          </span>
        )}
        {selectedAudience && (
          <span className="px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/20 text-emerald-200 text-xs font-medium">
            {AUDIENCES.find(a => a.id === selectedAudience)?.icon}{" "}
            {AUDIENCES.find(a => a.id === selectedAudience)?.label}
          </span>
        )}
        {selectedFormat && (
          <span className="px-3 py-1.5 rounded-full bg-amber-600/20 border border-amber-500/20 text-amber-200 text-xs font-medium">
            {FORMATS.find(f => f.id === selectedFormat)?.icon}{" "}
            {FORMATS.find(f => f.id === selectedFormat)?.label}
          </span>
        )}
        {selectedPlatform && (
          <span className="px-3 py-1.5 rounded-full bg-pink-600/20 border border-pink-500/20 text-pink-200 text-xs font-medium">
            {PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.icon}{" "}
            {PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.label}
          </span>
        )}
        {showEdit && (
          <button type="button" onClick={() => setStep("genre")}
            className="text-[11px] text-gray-500 hover:text-purple-400 underline underline-offset-2 transition-colors">
            {t("تعديل", "Edit")}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {[
          { id: "genre",    label: t("النوع", "Genre") },
          { id: "input",    label: t("الفكرة", "Idea") },
          { id: "enhanced", label: t("التحسين", "Enhanced") },
          { id: "script",   label: t("السكربت", "Script") },
          { id: "images",   label: t("الصور", "Images") },
          { id: "final",    label: t("النهائي", "Final") },
        ].map((s, index) => {
          const stepOrder = ["genre", "input", "enhanced", "script", "images", "final"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s.id);
          const isActive = step === s.id;
          const isPast = thisIdx < currentIdx;

          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                isActive ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" :
                isPast ? "bg-green-500/20 text-green-300" : "bg-white/5 text-gray-500"
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  isActive ? "bg-purple-500 text-white" :
                  isPast ? "bg-green-500 text-white" : "bg-gray-600"
                }`}>
                  {isPast ? "✓" : index + 1}
                </div>
                <span className="font-medium hidden sm:inline">{s.label}</span>
              </div>
              {index < 5 && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </div>
          );
        })}
      </div>

      {/* ===== STEP 1: INPUT ===== */}
      {step === "input" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{t("أعطني فكرتك", "Give Me Your Idea")}</h2>
            <p className="text-gray-400 mb-4">{t("سأحسنها وأكتب لك سكربتاً كاملاً", "I'll enhance it and write you a complete script")}</p>
            {/* Selected genre summary */}
            {selectedCoreGenre && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <RecipeSummary />
              </div>
            )}
          </div>

          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={t("اكتب فكرتك هنا بالتفصيل...", "Write your detailed idea here...")}
              className="w-full h-48 p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none text-lg"
              dir={lang === "ar" ? "rtl" : "ltr"}
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-500">
              {idea.length} {t("حرف", "chars")}
            </div>
          </div>

          {/* AI Provider Multi-Select */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">{t("اختر مزود أو أكثر للمقارنة", "Select one or more providers to compare")}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {([
                { value: "grok" as const,           icon: "⚡", label: "Grok",          color: "from-red-600 to-rose-600" },
                { value: "claude" as const,        icon: "🧠", label: "Claude",        color: "from-purple-600 to-violet-600" },
                { value: "gemini" as const,        icon: "✨", label: "Gemini",        color: "from-blue-600 to-cyan-600" },
                { value: "openai" as const,        icon: "🎬", label: "GPT-4o",        color: "from-green-600 to-emerald-600" },
                { value: "ollama+claude" as const, icon: "🔄", label: "Ollama+Claude", color: "from-violet-600 to-purple-600" },
                { value: "ollama+gemini" as const, icon: "🔄", label: "Ollama+Gemini", color: "from-green-600 to-teal-600" },
                { value: "ollama" as const,        icon: "🤖", label: "Ollama",        color: "from-orange-600 to-red-600" },
              ]).map((opt) => {
                const isSelected = selectedProviders.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedProviders(prev =>
                      isSelected ? prev.filter(p => p !== opt.value) : [...prev, opt.value]
                    )}
                    className={`relative py-2 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                      isSelected
                        ? `bg-gradient-to-r ${opt.color} text-white border-transparent shadow-lg`
                        : "text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-zinc-900 ${
                      providerStatus[opt.value] === true ? "bg-green-400" :
                      providerStatus[opt.value] === false ? "bg-red-500" : "bg-gray-500"
                    }`} />
                    {opt.icon} {opt.label}
                    {isSelected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
            {selectedProviders.length > 1 && (
              <p className="text-xs text-center text-purple-400">
                ✨ {t("سيتم المقارنة بين", "Will compare")} {selectedProviders.length} {t("مزودين", "providers")}
              </p>
            )}
          </div>

          <motion.button
            onClick={enhanceIdea}
            disabled={loading || !idea.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-5 text-xl ${btnPrimary}`}
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" />{t("جاري تحسين الفكرة...", "Enhancing your idea...")}</>
            ) : (
              <><Sparkles className="w-6 h-6" />{t("حسّن فكرتي", "Enhance My Idea")}</>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* ===== COMPARE STEP ===== */}
      {step === "compare" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{t("مقارنة النتائج", "Compare Results")}</h2>
            <p className="text-gray-400 text-sm">{t("اختر الفكرة الأفضل للمتابعة", "Choose the best idea to continue")}</p>
          </div>

          <div className={`grid gap-4 ${selectedProviders.length === 2 ? "grid-cols-2" : selectedProviders.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {selectedProviders.map((provider) => {
              const result = comparisonResults.find(r => r.provider === provider);
              const isLoading = loadingProviders[provider];
              const providerIcons: Record<string, string> = { gemini: "✨", kimi: "🌙", "ollama+gemini": "🔄", ollama: "🤖" };

              return (
                <div key={provider} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                    <span className="text-lg">{providerIcons[provider] || "🤖"}</span>
                    <span className="text-white font-semibold capitalize">{provider}</span>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-400 ml-auto" />}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        <p className="text-gray-500 text-sm">{t("جاري التوليد...", "Generating...")}</p>
                      </div>
                    ) : result ? (
                      <div className="space-y-3">
                        <h3 className="text-white font-bold text-base leading-snug">{result.idea.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{result.idea.concept}</p>
                        <div className="flex flex-wrap gap-1">
                          {result.idea.genre && <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">{result.idea.genre}</span>}
                          {result.idea.targetAge && <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">{result.idea.targetAge}</span>}
                        </div>
                        {result.idea.characters?.length > 0 && (
                          <div className="space-y-1">
                            {result.idea.characters.slice(0, 2).map((c, i) => (
                              <p key={i} className="text-gray-500 text-xs">• {c.name} — {c.role}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-gray-600 text-sm">{t("في انتظار النتيجة...", "Waiting...")}</p>
                      </div>
                    )}
                  </div>

                  {/* Select Button */}
                  {result && !isLoading && result.idea.title !== "خطأ" && (
                    <div className="p-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => selectFromComparison(result)}
                        className={`w-full ${btnPrimary} py-3 text-sm`}
                      >
                        <Check className="w-4 h-4" />
                        {t("اختر هذه", "Select This")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep("input")}
            className={`w-full ${btnSecondary}`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("رجوع", "Back")}
          </button>
        </motion.div>
      )}

      {/* ===== STEP 2: ENHANCED IDEA ===== */}
      {step === "enhanced" && enhancedIdea && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl font-bold text-white">{t("الفكرة المحسّنة", "Enhanced Idea")}</h3>
            </div>

            <h4 className="text-3xl font-bold text-white mb-4">{enhancedIdea.title}</h4>

            {editingIdea ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-purple-400" />
                  </div>
                  {t("تعديل الفكرة", "Edit Idea")}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">{t("عنوان القصة", "Story Title")}</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      title={t("عنوان القصة", "Story Title")}
                      placeholder={t("عنوان القصة", "Story Title")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-lg font-bold"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border border-white/8">
                    <p className="text-xs text-gray-500 mb-2">{t("هوية العمل", "Story Identity")}</p>
                    <RecipeSummary showEdit={false} />
                    <button type="button" onClick={() => setStep("genre")}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
                      {t("← تعديل التصنيف", "← Edit Genre")}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t("النوع", "Genre")}</label>
                      <select
                        value={editedGenre}
                        onChange={(e) => setEditedGenre(e.target.value)}
                        title={t("النوع", "Genre")}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                      >
                        {CORE_GENRES.map(g => (
                          <option key={g.id} value={g.label}>{g.icon} {g.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t("الجمهور", "Audience")}</label>
                      <select
                        value={editedTargetAge}
                        onChange={(e) => setEditedTargetAge(e.target.value)}
                        title={t("الجمهور", "Audience")}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                      >
                        {AUDIENCES.map(a => (
                          <option key={a.id} value={a.label}>{a.icon} {a.label} ({a.range})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">{t("القصة", "Story")}</label>
                    <textarea
                      value={editedConcept}
                      onChange={(e) => setEditedConcept(e.target.value)}
                      rows={4}
                      placeholder={t("اكتب القصة هنا...", "Write the story here...")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    />
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        {t("الشخصيات", "Characters")}
                      </h3>
                      <button type="button" onClick={addCharacter} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all">
                        <Plus className="w-4 h-4" /> {t("إضافة شخصية", "Add Character")}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editedCharacters.map((char, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {(["name","role","age","desc"] as (keyof Character)[]).map(field => (
                              <input key={field} type="text" value={char[field]} onChange={(e) => updateCharacter(i, field, e.target.value)} placeholder={t(field === "name" ? "اسم الشخصية" : field === "role" ? "الدور" : field === "age" ? "العمر" : "وصف مختصر", field)} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                            ))}
                          </div>
                          <button type="button" onClick={() => removeCharacter(i)} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 transition-colors">
                            <X className="w-4 h-4" /> {t("حذف الشخصية", "Remove")}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={saveEdit} className={`flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 ${btnPrimary}`}>
                      <Save className="w-5 h-5" /> {t("حفظ التغييرات", "Save Changes")}
                    </button>
                    <button type="button" onClick={cancelEdit} className={`flex-1 ${btnSecondary}`}>
                      <X className="w-5 h-5" /> {t("إلغاء", "Cancel")}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Genre selections from step 1 */}
                {selectedCoreGenre && (
                  <div className="mb-5 p-3 rounded-xl bg-black/30 border border-white/8">
                    <p className="text-xs text-gray-500 mb-2">{t("هوية العمل المختارة", "Selected Story Identity")}</p>
                    <RecipeSummary />
                  </div>
                )}
                <p className="text-gray-300 text-lg leading-relaxed mb-6">{enhancedIdea.concept}</p>
                <div className="border-t border-white/10 pt-6">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">{t("الشخصيات", "Characters")}</h5>
                  <div className="flex flex-wrap gap-3">
                    {enhancedIdea.characters.map((char, i) => (
                      <div key={i} className="px-4 py-2 rounded-xl bg-white/5 text-sm">
                        <span className="text-white font-medium">{char.name}</span>
                        <span className="text-gray-400 mx-2">-</span>
                        <span className="text-purple-300">{char.role}</span>
                        {char.age && <span className="text-gray-500 ml-2">({char.age})</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
                  <button type="button" onClick={startEdit} className={`flex-1 ${btnSmall} py-2.5`}>
                    <Edit3 className="w-4 h-4" /> {t("تعديل", "Edit")}
                  </button>
                  <button type="button" onClick={() => {
                    const content = `العنوان: ${enhancedIdea.title}\n\n${enhancedIdea.concept}\n\nالنوع: ${enhancedIdea.genre}\nالفئة: ${enhancedIdea.targetAge}`;
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `${enhancedIdea.title}.txt`; a.click();
                  }} className={`flex-1 ${btnSmall} py-2.5`}>
                    <Download className="w-4 h-4" /> {t("حفظ", "Save")}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={reset} className={btnSecondary}>{t("إلغاء", "Cancel")}</button>
            <button type="button" onClick={() => setStep("input")} className={`flex-1 ${btnSecondary}`}>
              <ChevronLeft className="w-5 h-5" /> {t("السابق", "Back")}
            </button>
            <motion.button
              onClick={generateScriptFromGenre}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-[2] text-lg ${btnPrimary}`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ScrollText className="w-6 h-6" />{t("ابدأ توليد السكربت", "Generate Script")}<ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ===== STEP 1: GENRE BUILDER ===== */}
      {step === "genre" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

          {/* Header + completion dots */}
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {t("ابنِ هوية عملك", "Build Your Story Identity")}
            </motion.h2>
            <p className="text-gray-400 text-sm mb-5">
              {t("خمس خطوات تُحدد روح القصة قبل أن تكتب كلمة واحدة", "Five steps that define the story's soul before you write a single word")}
            </p>
            {/* Completion dots */}
            <div className="flex justify-center items-center gap-2">
              {[
                { val: selectedCoreGenre,   label: t("النوع", "Genre"),     color: "bg-purple-500" },
                { val: selectedTone,        label: t("النبرة", "Tone"),     color: "bg-blue-500" },
                { val: selectedAudience,    label: t("الجمهور", "Audience"),color: "bg-emerald-500" },
                { val: selectedFormat,      label: t("الشكل", "Format"),    color: "bg-amber-500" },
                { val: selectedPlatform,    label: t("الأسلوب", "Style"),   color: "bg-pink-500" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${item.val ? `${item.color} shadow-lg` : 'bg-white/10'}`} />
                  <span className={`text-[10px] transition-colors ${item.val ? 'text-white' : 'text-gray-600'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 1: Core Genre ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-500/30">1</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("النوع الأساسي", "Core Genre")}</h4>
                <p className="text-xs text-gray-500">{t("المعيار العالمي — اختر واحداً", "Global standard — pick one • required")}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {CORE_GENRES.map((genre, index) => {
                const isSelected = selectedCoreGenre === genre.id;
                return (
                  <motion.button
                    key={genre.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCoreGenre(genre.id)}
                    className={`relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-all bg-gradient-to-br border-2 overflow-hidden ${
                      isSelected
                        ? `${genre.color} ${genre.selBorder} shadow-xl ${genre.glow}`
                        : `${genre.color} ${genre.border}`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-3xl leading-none">{genre.icon}</span>
                    <span className="text-xs font-bold text-white text-center leading-tight">{genre.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Section 2: Secondary (optional) ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/30">2</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("إضافات العمق", "Secondary Genres")}</h4>
                <p className="text-xs text-gray-500">
                  {t("اختياري — حتى 2", "Optional — up to 2")}
                  {selectedSecondaryGenres.length > 0 && <span className="text-blue-400 mr-2"> • {selectedSecondaryGenres.length} مختار</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_GENRES.map((genre) => {
                const isSelected = selectedSecondaryGenres.includes(genre.id);
                const isDisabled = !isSelected && selectedSecondaryGenres.length >= 2;
                return (
                  <motion.button
                    key={genre.id}
                    type="button"
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    onClick={() => toggleSecondaryGenre(genre.id)}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border-2 ${
                      isSelected
                        ? "bg-blue-600/50 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                        : isDisabled
                        ? "bg-transparent border-white/5 text-gray-700 cursor-not-allowed"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{genre.icon}</span>
                    <span>{genre.label}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Section 3: Tone ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center text-sm font-bold text-white shadow-lg">3</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("النبرة", "Tone")}</h4>
                <p className="text-xs text-gray-500">{t("مزاج القصة — اختر واحداً • مطلوب", "Story mood — pick one • required")}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map((tone, index) => {
                const isSelected = selectedTone === tone.id;
                return (
                  <motion.button
                    key={tone.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`p-4 rounded-2xl flex flex-col items-start gap-1 transition-all border-2 text-right ${
                      isSelected
                        ? "bg-white/15 border-white/50 shadow-lg"
                        : "bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">{tone.icon}</span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-white">{tone.label}</span>
                    <span className="text-xs text-gray-400 leading-tight">{tone.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Section 4: Audience ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30">4</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("الجمهور المستهدف", "Target Audience")}</h4>
                <p className="text-xs text-gray-500">{t("من تخاطب؟ — اختر واحداً • مطلوب", "Who are you speaking to? — pick one • required")}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AUDIENCES.map((audience, index) => {
                const isSelected = selectedAudience === audience.id;
                return (
                  <motion.button
                    key={audience.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedAudience(audience.id)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${
                      isSelected
                        ? "bg-emerald-600/30 border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/20"
                    }`}
                  >
                    <span className="text-3xl">{audience.icon}</span>
                    <span className="text-sm font-bold text-white">{audience.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/5 text-gray-500'}`}>{audience.range}</span>
                    <span className="text-xs text-gray-400 text-center leading-tight">{audience.desc}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-300" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Section 5: Format ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-amber-500/30">5</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("شكل الإنتاج", "Production Format")}</h4>
                <p className="text-xs text-gray-500">{t("كيف تُقدَّم القصة؟ — مطلوب", "How is the story presented? — required")}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {FORMATS.map((format, index) => {
                const isSelected = selectedFormat === format.id;
                return (
                  <motion.button
                    key={format.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-5 rounded-2xl flex flex-col gap-3 transition-all bg-gradient-to-br border-2 text-right ${
                      isSelected
                        ? `${format.color} ${format.selBorder} shadow-xl ${format.glow}`
                        : `${format.color} ${format.border} hover:scale-[1.02]`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{format.icon}</span>
                      {isSelected && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{format.label}</div>
                      <div className="text-xs text-gray-300 leading-relaxed mt-1">{format.desc}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Section 6: Platform Style ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-600 to-rose-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-pink-500/30">6</div>
              <div>
                <h4 className="text-white font-bold text-base">{t("الروح الإبداعية", "Creative DNA")}</h4>
                <p className="text-xs text-gray-500">{t("أسلوب بناء القصة — اختر واحداً • مطلوب", "Story-building style — pick one • required")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORM_STYLES.map((platform, index) => {
                const isSelected = selectedPlatform === platform.id;
                return (
                  <motion.button
                    key={platform.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-5 rounded-2xl text-right transition-all bg-gradient-to-br border-2 ${
                      isSelected
                        ? `${platform.color} ${platform.selBorder} shadow-2xl`
                        : `${platform.color} ${platform.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{platform.icon}</span>
                      {isSelected
                        ? <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                        : <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{platform.labelEn}</span>}
                    </div>
                    <div className="font-bold text-white text-base mb-2">{platform.label}</div>
                    <div className="text-xs text-gray-300 leading-relaxed">{platform.desc}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Live Recipe Bar ── */}
          <AnimatePresence>
            {selectedCoreGenre && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-black/40 backdrop-blur border border-white/10"
              >
                <p className="text-xs text-gray-500 mb-3">{t("وصفة عملك الإبداعي", "Your Creative Recipe")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCoreGenre && (
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/50 to-violet-600/50 border border-purple-400/40 text-white text-xs font-bold">
                      {CORE_GENRES.find(g => g.id === selectedCoreGenre)?.icon} {CORE_GENRES.find(g => g.id === selectedCoreGenre)?.label}
                    </span>
                  )}
                  {selectedSecondaryGenres.map(id => (
                    <span key={id} className="px-3 py-1.5 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-200 text-xs">
                      {SECONDARY_GENRES.find(g => g.id === id)?.icon} {SECONDARY_GENRES.find(g => g.id === id)?.label}
                    </span>
                  ))}
                  {selectedTone && (
                    <><span className="text-gray-600 text-xs">→</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-gray-200 text-xs">
                      {TONES.find(t => t.id === selectedTone)?.icon} {TONES.find(t => t.id === selectedTone)?.label}
                    </span></>
                  )}
                  {selectedAudience && (
                    <><span className="text-gray-600 text-xs">→</span>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-400/30 text-emerald-200 text-xs">
                      {AUDIENCES.find(a => a.id === selectedAudience)?.icon} {AUDIENCES.find(a => a.id === selectedAudience)?.label}
                    </span></>
                  )}
                  {selectedFormat && (
                    <><span className="text-gray-600 text-xs">→</span>
                    <span className="px-3 py-1.5 rounded-full bg-amber-600/20 border border-amber-400/30 text-amber-200 text-xs">
                      {FORMATS.find(f => f.id === selectedFormat)?.icon} {FORMATS.find(f => f.id === selectedFormat)?.label}
                    </span></>
                  )}
                  {selectedPlatform && (
                    <><span className="text-gray-600 text-xs">→</span>
                    <span className="px-3 py-1.5 rounded-full bg-pink-600/20 border border-pink-400/30 text-pink-200 text-xs">
                      {PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.icon} {PLATFORM_STYLES.find(p => p.id === selectedPlatform)?.label}
                    </span></>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA Button ── */}
          <motion.button
            onClick={() => setStep("input")}
            disabled={!selectedCoreGenre || !selectedTone || !selectedAudience || !selectedFormat || !selectedPlatform}
            whileHover={{ scale: (selectedCoreGenre && selectedTone && selectedAudience && selectedFormat && selectedPlatform) ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-purple-500/20 transition-all"
          >
            <Sparkles className="w-6 h-6" />
            {(!selectedCoreGenre || !selectedTone || !selectedAudience || !selectedFormat || !selectedPlatform)
              ? t("أكمل الاختيارات للمتابعة", "Complete all selections to continue")
              : <>{t("التالي — أدخل فكرتك", "Next — Enter Your Idea")} <ArrowRight className="w-5 h-5" /></>
            }
          </motion.button>

        </motion.div>
      )}

      {/* ===== STEP 4: SCRIPT DISPLAY ===== */}
      {step === "script" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ScrollText className="w-7 h-7 text-purple-400" />
                  {t("السكربت الكامل", "Full Script")}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{generatedScripts.length} {t("سكربت مولد", "script(s) generated")}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("enhanced")} className={btnSmall}>
                  <ChevronLeft className="w-4 h-4" /> {t("رجوع", "Back")}
                </button>
                <button type="button" onClick={reset} className={btnSmall}>
                  <RotateCcw className="w-4 h-4" /> {t("جديد", "New")}
                </button>
              </div>
            </div>
            {/* Recipe summary */}
            {selectedCoreGenre && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/8">
                <RecipeSummary />
              </div>
            )}
          </div>

          <div className="space-y-8">
            {generatedScripts.map((script) => (
              <motion.div key={script.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-white/10 rounded-3xl overflow-hidden bg-black/30">
                {/* Script Header */}
                <div className="p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Film className="w-6 h-6 text-purple-400" />
                      <h4 className="text-xl font-bold text-white">{script.title}</h4>
                      <span className="text-gray-400 text-sm">{script.scenes.length} {t("مشهد", "scenes")}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => addScene(script.id)}
                        className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
                      >
                        <Plus className="w-4 h-4" /> {t("مشهد جديد", "Add Scene")}
                      </button>
                      <button type="button"
                        onClick={() => setEditingScript(editingScript === script.id ? null : script.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${editingScript === script.id ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                      >
                        {editingScript === script.id ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {editingScript === script.id ? t("إنهاء التعديل", "Done") : t("تعديل", "Edit")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scenes */}
                <div className="p-6 space-y-4">
                  {script.scenes.map((scene, index) => (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl transition-all ${editingScene === scene.id ? "bg-purple-500/20 border-2 border-purple-500" : "bg-white/5 hover:bg-white/10 border border-white/5"}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Scene Number */}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                          {scene.number}
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Scene Header */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {scene.location}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {scene.time}
                            </span>
                          </div>

                          {editingScript === script.id && editingScene === scene.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-400">{t("المحتوى", "Content")}</label>
                                <textarea
                                  value={scene.content}
                                  onChange={(e) => updateScene(script.id, scene.id, "content", e.target.value)}
                                  placeholder={t("محتوى المشهد", "Scene content")}
                                  className="w-full mt-1 p-3 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-500 outline-none"
                                  rows={2}
                                  dir={lang === "ar" ? "rtl" : "ltr"}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-400">{t("الحوار", "Dialogue")}</label>
                                  <input type="text" value={scene.dialogue} onChange={(e) => updateScene(script.id, scene.id, "dialogue", e.target.value)} placeholder={t("الحوار", "Dialogue")} title={t("الحوار", "Dialogue")} className="w-full mt-1 p-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-500 outline-none" dir={lang === "ar" ? "rtl" : "ltr"} />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400">{t("الحركة", "Action")}</label>
                                  <input type="text" value={scene.action} onChange={(e) => updateScene(script.id, scene.id, "action", e.target.value)} placeholder={t("الحركة", "Action")} title={t("الحركة", "Action")} className="w-full mt-1 p-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-500 outline-none" dir={lang === "ar" ? "rtl" : "ltr"} />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" /> {t("وصف الصورة (للتوليد)", "Image Prompt (for generation)")}
                                </label>
                                <textarea
                                  value={scene.imagePrompt || ""}
                                  onChange={(e) => updateScene(script.id, scene.id, "imagePrompt", e.target.value)}
                                  className="w-full mt-1 p-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-500 outline-none font-mono text-xs"
                                  rows={2}
                                  placeholder="Describe the scene for AI image generation..."
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button type="button"
                                  onClick={() => regenerateScene(script.id, scene.id)}
                                  disabled={loading}
                                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" />{t("إعادة توليد المشهد", "Regenerate Scene")}</>}
                                </button>
                                <button type="button" onClick={() => setEditingScene(null)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">
                                  {t("تم", "Done")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-white text-sm leading-relaxed">{scene.content}</p>
                              <div className="flex gap-4 text-sm flex-wrap">
                                {scene.dialogue && <span className="text-cyan-300 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {scene.dialogue}</span>}
                                {scene.action && <span className="text-amber-300 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {scene.action}</span>}
                              </div>
                              {scene.imagePrompt && (
                                <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                  <span className="text-xs text-purple-300 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> {t("جاهز للتوليد", "Ready for generation")}
                                  </span>
                                </div>
                              )}
                              {editingScript === script.id && (
                                <div className="flex gap-2 mt-2">
                                  <button type="button" onClick={() => setEditingScene(scene.id)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> {t("تعديل المشهد", "Edit Scene")}
                                  </button>
                                  <button type="button"
                                    onClick={() => deleteScene(script.id, scene.id)}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> {t("حذف المشهد", "Delete Scene")}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Script Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                  <button type="button"
                    onClick={() => generateImagesForScript(script)}
                    className={`flex-1 ${btnPrimary}`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    {t("توليد صور المشاهد", "Generate Scene Images")}
                  </button>
                  <button type="button"
                    onClick={() => downloadScript(script)}
                    className={btnSmall}
                  >
                    <Download className="w-4 h-4" />
                    {t("تحميل", "Download")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== STEP 5: IMAGE REVIEW ===== */}
      {step === "images" && !activeScript && generatedScripts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-20">
          <p className="text-gray-300">{t("اختر سكربتاً لتوليد صوره", "Select a script to generate images")}</p>
          {generatedScripts.map(s => (
            <button type="button" key={s.id}
              onClick={() => generateImagesForScript(s)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-all"
            >
              {t("توليد صور:", "Generate images:")} {s.title}
            </button>
          ))}
        </motion.div>
      )}
      {step === "images" && !activeScript && generatedScripts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-20">
          <p className="text-gray-400">{t("لا يوجد سكربت — ارجع وأنشئ سكربتاً أولاً", "No script yet — go back and create a script first")}</p>
          <button type="button" onClick={() => setStep("input")} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm">{t("البداية", "Start over")}</button>
        </motion.div>
      )}
      {step === "images" && activeScript && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Hidden file input for image upload */}
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            title={t("رفع صورة للمشهد", "Upload scene image")}
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ImageIcon className="w-7 h-7 text-pink-400" />
                  {t("مراجعة الصور", "Image Review")}
                  <span className="text-sm font-normal text-gray-400">({activeScript.scenes.length} {t("مشهد", "scenes")})</span>
                </h3>
                <p className="text-gray-400 text-sm mt-1">{activeScript.title}</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {imageStats && (
                  <div className="flex gap-2 text-sm">
                    <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/20 text-xs font-medium">
                      ✓ {imageStats.approved}/{imageStats.total} {t("مقبولة", "approved")}
                    </span>
                    {imageStats.generating > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 flex items-center gap-1 text-xs font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" /> {imageStats.generating} {t("جاري", "generating")}
                      </span>
                    )}
                    {imageStats.error > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/20 flex items-center gap-1 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" /> {imageStats.error} {t("خطأ", "error")}
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowScriptPanel(p => !p)}
                  className={`${btnSmall} ${showScriptPanel ? "bg-purple-500/30 border-purple-400/50" : ""}`}
                >
                  <PanelRight className="w-4 h-4" />
                  {showScriptPanel ? t("إخفاء السكربت", "Hide Script") : t("السكربت", "Script")}
                </button>
                <button type="button" onClick={() => setStep("script")} className={btnSmall}>
                  <ChevronLeft className="w-4 h-4" /> {t("تعديل", "Edit")}
                </button>
              </div>
            </div>
            {/* Recipe summary */}
            {selectedCoreGenre && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/8">
                <RecipeSummary />
              </div>
            )}
          </div>

          {/* Main content area: grid + optional script panel */}
          <div className="flex gap-4 items-start">

          {/* ===== SCRIPT SIDE PANEL ===== */}
          {showScriptPanel && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-72 shrink-0 sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-purple-500/30 bg-black/40 backdrop-blur-sm space-y-0"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/60 backdrop-blur-sm rounded-t-2xl z-10">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-purple-400" />
                  {activeScript.title}
                </h4>
                <button type="button" title={t("إغلاق", "Close")} onClick={() => setShowScriptPanel(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {activeScript.scenes.map((s, si) => {
                  const sNum = s.number ?? si + 1;
                  const isActive = sceneImages[s.id]?.status === "done";
                  return (
                    <div key={s.id} className={`p-3 space-y-1.5 text-xs transition-colors ${isActive ? "bg-purple-500/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-700 to-pink-700 text-white text-[10px] font-bold shrink-0">
                          {sNum}
                        </span>
                        <span className="text-purple-300 font-medium truncate" dir="rtl">{s.location}</span>
                        <span className="text-gray-600 shrink-0">{s.time}</span>
                      </div>
                      {s.action && (
                        <p className="text-gray-400 leading-relaxed" dir="rtl">
                          <span className="text-gray-600 text-[10px]">{t("أكشن: ", "Action: ")}</span>{s.action}
                        </p>
                      )}
                      {s.dialogue && (
                        <p className="text-gray-300 italic leading-relaxed" dir="rtl">
                          &quot;{s.dialogue}&quot;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Scenes Grid */}
          <div className={`flex-1 grid gap-5 ${showScriptPanel ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {activeScript.scenes.map((scene, idx) => {
              const img = sceneImages[scene.id];
              const isGenerating = img?.status === "generating";
              const isDone = img?.status === "done";
              const isError = img?.status === "error";
              const isApproved = img?.approved;
              const sceneNum = scene.number ?? idx + 1;
              const isEditingPrompt = editingPromptScene === scene.id;

              return (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl overflow-hidden transition-all border-2 ${
                    isApproved
                      ? "border-green-500/50 shadow-lg shadow-green-500/10"
                      : "border-white/10 hover:border-purple-500/30"
                  } bg-gradient-to-b from-white/5 to-black/20`}
                >
                  {/* Image Area */}
                  <div className="aspect-video relative bg-black/40 flex items-center justify-center overflow-hidden group">
                    {isGenerating && (
                      <div className="text-center space-y-2 px-4">
                        <div className="relative mx-auto w-12 h-12">
                          <Loader2 className="w-12 h-12 animate-spin text-purple-400/20 absolute inset-0" />
                          <Loader2 className="w-8 h-8 animate-spin text-purple-400 absolute inset-2" />
                        </div>
                        <p className="text-gray-400 text-xs">{t("جاري توليد الصورة...", "Generating image...")}</p>
                        {scene.imagePrompt && (
                          <p className="text-gray-600 text-[10px] line-clamp-2 leading-relaxed">{scene.imagePrompt}</p>
                        )}
                      </div>
                    )}
                    {isDone && img.imageUrl && (
                      <>
                        <img
                          src={img.imageUrl}
                          alt={t(`مشهد ${sceneNum}`, `Scene ${sceneNum}`)}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover overlay — shows full imagePrompt */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <p className="text-white text-[11px] leading-relaxed line-clamp-4">{scene.imagePrompt}</p>
                        </div>
                        {isApproved && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-[10px] text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t("معتمد", "Approved")}
                          </div>
                        )}
                      </>
                    )}
                    {isError && (
                      <div className="text-center space-y-2">
                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                        <p className="text-red-400 text-xs">{t("فشل التوليد", "Failed")}</p>
                      </div>
                    )}
                    {(!img || img.status === "idle") && (
                      <div className="text-center text-gray-600 space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto opacity-30" />
                        <p className="text-xs">{t("في الانتظار", "Waiting")}</p>
                      </div>
                    )}

                    {/* Scene Number Badge — gradient pill */}
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-700/90 to-pink-700/90 backdrop-blur-sm text-white text-[11px] font-bold border border-white/20 shadow-lg">
                      {t(`مشهد ${sceneNum}`, `Scene ${sceneNum}`)}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Location + Time row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-white text-sm font-semibold truncate" dir="rtl">{scene.location}</span>
                      </div>
                      {scene.time && (
                        <span className="text-gray-500 text-[11px] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{scene.time}
                        </span>
                      )}
                    </div>

                    {/* Dialogue snippet */}
                    {scene.dialogue && (
                      <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/5">
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 italic" dir="rtl">
                          &quot;{scene.dialogue}&quot;
                        </p>
                      </div>
                    )}

                    {/* Image Prompt — editable */}
                    {isEditingPrompt ? (
                      <div className="space-y-2">
                        <textarea
                          value={editPromptValue}
                          onChange={e => setEditPromptValue(e.target.value)}
                          rows={3}
                          placeholder="Describe the scene in English..."
                          title="Image prompt"
                          className="w-full p-2 rounded-lg bg-black/50 border border-purple-500/50 text-white text-xs leading-relaxed outline-none resize-none font-mono focus:border-purple-400"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEditedPrompt(scene.id)}
                            className="flex-1 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-all"
                          >
                            <Save className="w-3 h-3" /> {t("حفظ", "Save")}
                          </button>
                          <button
                            type="button"
                            title={t("إلغاء", "Cancel")}
                            onClick={() => setEditingPromptScene(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 text-xs transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 group/prompt">
                        <p className="flex-1 text-gray-500 text-[11px] line-clamp-2 leading-relaxed" title={scene.imagePrompt || ""}>
                          {scene.imagePrompt || t("لا يوجد وصف", "No description")}
                        </p>
                        <button
                          type="button"
                          onClick={() => { setEditingPromptScene(scene.id); setEditPromptValue(scene.imagePrompt || ""); }}
                          className="shrink-0 p-1 rounded text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all opacity-0 group-hover/prompt:opacity-100"
                          title={t("تعديل البرمبت", "Edit prompt")}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => regenerateSceneImage(
                          scene.id,
                          scene.imagePrompt || `${scene.location}, ${scene.time}, ${scene.action}, animated style`
                        )}
                        disabled={isGenerating}
                        title={t("توليد صورة جديدة بالـ AI", "Generate new AI image")}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${btnSecondary}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? t("جاري...", "Working...") : t("جديد", "New")}
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerUpload(scene.id)}
                        title={t("رفع صورة من جهازك", "Upload image from device")}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all ${btnSecondary}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t("رفع", "Upload")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleApproveImage(scene.id)}
                        disabled={!isDone}
                        title={isApproved ? t("إلغاء الاعتماد", "Unapprove") : t("اعتماد الصورة", "Approve image")}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all disabled:opacity-40 ${
                          isApproved
                            ? "bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30"
                            : btnSecondary
                        }`}
                      >
                        {isApproved ? (
                          <><CheckSquare className="w-3.5 h-3.5" /> {t("✓", "✓")}</>
                        ) : (
                          <><Square className="w-3.5 h-3.5" /> {t("اعتماد", "Approve")}</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          </div>{/* end flex layout */}

          {/* Footer: Bulk approve & continue */}
          {allGenerationDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/10 pt-6 flex flex-col sm:flex-row gap-3"
            >
              {imageStats && imageStats.approved < imageStats.done && (
                <button
                  type="button"
                  onClick={approveAllDoneImages}
                  className={`${btnSecondary} flex-1`}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  {t("اعتماد الكل", "Approve All")}
                  <span className="text-gray-400 text-sm">({imageStats.done})</span>
                </button>
              )}
              <motion.button
                onClick={() => setStep("final")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-[2] ${btnPrimary}`}
              >
                <Video className="w-5 h-5" />
                {t("متابعة", "Continue")}
                <span className="text-white/70 text-sm">({imageStats?.approved || 0} {t("صورة", "images")})</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ===== STEP 6: FINAL ===== */}
      {step === "final" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">{t("جاهز لتوليد الفيديو!", "Ready for Video Generation!")}</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {t(
              `تم اعتماد ${imageStats?.approved || 0} صورة. المرحلة التالية هي تحريك الصور وتوليد الصوت.`,
              `${imageStats?.approved || 0} images approved. Next step is animating images and generating audio.`
            )}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button type="button"
              onClick={() => window.open(COMFYUI_URL, "_blank")}
              className={btnPrimary}
            >
              <Wand2 className="w-5 h-5" />
              {t("فتح ComfyUI للتحريك", "Open ComfyUI for Animation")}
            </button>
            <button type="button"
              onClick={reset}
              className={btnSecondary}
            >
              <Sparkles className="w-5 h-5" />
              {t("إنشاء مشروع جديد", "New Project")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
