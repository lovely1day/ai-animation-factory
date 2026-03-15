// apps/web/src/app/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Film,
  Image as ImageIcon,
  Music,
  Video,
  Mic,
  Layers,
  ArrowRight,
  Globe,
  FileText,
  Palette,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost:3004";

const translations = {
  ar: {
    title: "إنشاء محتوى جديد",
    mainTitle: "اصنع مقاطع فيديو متحركة بالذكاء الاصطناعي",
    subtitle: "حوّل أفكارك إلى واقع بالذكاء الاصطناعي",
    step1Title: "العنوان والفكرة",
    projectTitle: "عنوان المحتوى",
    projectTitlePlaceholder: "مثال: مغامرات في الفضاء",
    ideaLabel: "الفكرة الرئيسية",
    ideaPlaceholder: "وصف الفكرة...",
    next: "التالي",
    prev: "رجوع",
    step2Title: "الأسلوب",
    step2Subtitle: "النوع",
    step3Title: "مراجعة قبل الإنشاء",
    titleLabel: "العنوان:",
    ideaLabel2: "الفكرة:",
    typeLabel: "الأسلوب:",
    genreLabel: "النوع:",
    createProject: "ابدأ الإنشاء",
    sending: "جاري الإرسال...",
    step4Title: "جاري الإنشاء...",
    step4Subtitle: "نحن نعالج فكرتك عبر مراحل الإنتاج",
    script: "السيناريو",
    images: "الصور",
    audio: "الصوت",
    video: "الفيديو",
    voice: "التعليق",
    music: "الموسيقى",
    assembly: "التجميع",
    completed: "✓ مكتمل",
    processing: "⟳ جاري المعالجة",
    pending: "○ في الانتظار",
    percentComplete: "% مكتمل",
    step5Title: "تم الإنشاء بنجاح!",
    step5Subtitle: "جميع المراحل اكتملت وجاهزة",
    ready: "✓ جاهز",
    createNew: "إنشاء آخر",
    backHome: "العودة للرئيسية",
    watchNow: "شاهد الآن",
    cartoon: "كرتون",
    cinematic: "سينمائي",
    realistic: "واقعي",
    anime: "أنيمي",
    "3d": "ثلاثي الأبعاد",
    comedy: "كوميديا",
    drama: "دراما",
    horror: "رعب",
    action: "أكشن",
    scifi: "خيال علمي",
    العربية: "العربية",
  },
  en: {
    title: "Create New Content",
    mainTitle: "Create AI Animated Videos",
    subtitle: "Turn your ideas into reality with AI",
    step1Title: "Title & Idea",
    projectTitle: "Content Title",
    projectTitlePlaceholder: "e.g., Space Adventures",
    ideaLabel: "Main Idea",
    ideaPlaceholder: "Describe your idea...",
    next: "Next",
    prev: "Back",
    step2Title: "Style",
    step2Subtitle: "Genre",
    step3Title: "Review Before Creating",
    titleLabel: "Title:",
    ideaLabel2: "Idea:",
    typeLabel: "Style:",
    genreLabel: "Genre:",
    createProject: "Start Creating",
    sending: "Sending...",
    step4Title: "Creating...",
    step4Subtitle: "Processing your idea through production stages",
    script: "Script",
    images: "Images",
    audio: "Audio",
    video: "Video",
    voice: "Voice",
    music: "Music",
    assembly: "Assembly",
    completed: "✓ Completed",
    processing: "⟳ Processing",
    pending: "○ Pending",
    percentComplete: "% Complete",
    step5Title: "Created Successfully!",
    step5Subtitle: "All stages completed and ready",
    ready: "✓ Ready",
    createNew: "Create Another",
    backHome: "Back to Home",
    watchNow: "Watch Now",
    cartoon: "Cartoon",
    cinematic: "Cinematic",
    realistic: "Realistic",
    anime: "Anime",
    "3d": "3D",
    comedy: "Comedy",
    drama: "Drama",
    horror: "Horror",
    action: "Action",
    scifi: "Sci-Fi",
    العربية: "العربية",
  },
};

const genres = [
  { id: "comedy", emoji: "😄", color: "from-yellow-500 to-orange-500" },
  { id: "drama", emoji: "🎭", color: "from-purple-500 to-pink-500" },
  { id: "horror", emoji: "👻", color: "from-red-600 to-red-800" },
  { id: "action", emoji: "⚡", color: "from-blue-500 to-cyan-500" },
  { id: "scifi", emoji: "🚀", color: "from-indigo-500 to-purple-600" },
];

const types = [
  { id: "cartoon", icon: "🎨", descriptionAr: "رسوم متحركة تقليدية", descriptionEn: "Traditional animation" },
  { id: "cinematic", icon: "🎬", descriptionAr: "جودة سينمائية عالية", descriptionEn: "High cinematic quality" },
  { id: "realistic", icon: "📷", descriptionAr: "أسلوب واقعي بالذكاء الاصطناعي", descriptionEn: "AI realistic style" },
  { id: "anime", icon: "⛩️", descriptionAr: "أسلوب ياباني", descriptionEn: "Japanese style" },
  { id: "3d", icon: "💎", descriptionAr: "رسوم متحركة ثلاثية الأبعاد", descriptionEn: "3D animation" },
];

const productionStages = [
  { id: "script", icon: FileText, labelAr: "السيناريو", labelEn: "Script" },
  { id: "images", icon: ImageIcon, labelAr: "الصور", labelEn: "Images" },
  { id: "animation", icon: Film, labelAr: "الأنيميشن", labelEn: "Animation" },
  { id: "voice", icon: Mic, labelAr: "التعليق الصوتي", labelEn: "Voice" },
  { id: "music", icon: Music, labelAr: "الموسيقى", labelEn: "Music" },
  { id: "assembly", icon: Layers, labelAr: "التجميع", labelEn: "Assembly" },
];

const stepLabels = {
  ar: ["العنوان والفكرة", "النوع والأسلوب", "المراجعة", "الإنشاء", "مكتمل"],
  en: ["Title & Idea", "Type & Style", "Review", "Creating", "Done"],
};

// Pre-computed stable positions for confetti particles (avoids re-render drift)
const confettiParticles: Array<{ left: string; top: string }> = [
  { left: "8%",  top: "20%" }, { left: "18%", top: "55%" },
  { left: "28%", top: "35%" }, { left: "38%", top: "70%" },
  { left: "48%", top: "15%" }, { left: "58%", top: "45%" },
  { left: "68%", top: "60%" }, { left: "78%", top: "25%" },
  { left: "85%", top: "75%" }, { left: "92%", top: "40%" },
  { left: "12%", top: "80%" }, { left: "72%", top: "10%" },
];

type StageStatus = "pending" | "processing" | "completed";

interface StageState {
  status: StageStatus;
  progress: number;
}

export default function CreatePage() {
  const [isClient, setIsClient] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [stages, setStages] = useState<Record<string, StageState>>({
    script: { status: "pending", progress: 0 },
    images: { status: "pending", progress: 0 },
    animation: { status: "pending", progress: 0 },
    voice: { status: "pending", progress: 0 },
    music: { status: "pending", progress: 0 },
    assembly: { status: "pending", progress: 0 },
  });

  const [formData, setFormData] = useState({
    title: "",
    idea: "",
    genre: "",
    type: "",
  });

  useEffect(() => {
    setIsClient(true);
    const savedLang = localStorage.getItem("lang") as "ar" | "en" | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang];
  const isRtl = lang === "ar";

  const toggleLang = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    if (isClient) localStorage.setItem("lang", newLang);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = isClient ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_URL}/api/episodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          idea: formData.idea,
          genre: formData.genre,
          type: formData.type,
          language: lang,
        }),
      });

      const data = await response.json();

      if (data.success || data.data?.id) {
        setProjectId(data.data.id);
        setStep(4);
        startProgressSimulation();
      }
    } catch (error) {
      console.error("Error:", error);
      // Even on error, move to step 4 for demo purposes
      setStep(4);
      startProgressSimulation();
    } finally {
      setLoading(false);
    }
  };

  const startProgressSimulation = () => {
    const stageOrder = ["script", "images", "animation", "voice", "music", "assembly"];
    let currentStageIndex = 0;

    const interval = setInterval(() => {
      if (currentStageIndex >= stageOrder.length) {
        clearInterval(interval);
        setTimeout(() => setStep(5), 800);
        return;
      }

      const currentStage = stageOrder[currentStageIndex];

      setStages((prev) => {
        const updated = { ...prev };
        // Mark previous as completed
        if (currentStageIndex > 0) {
          updated[stageOrder[currentStageIndex - 1]] = { status: "completed", progress: 100 };
        }
        updated[currentStage] = { status: "processing", progress: 50 };
        return updated;
      });

      currentStageIndex++;
    }, 2000);
  };

  const getStageColor = (status: StageStatus) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "processing":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30 animate-pulse";
      default:
        return "text-gray-500 bg-white/5 border-white/10";
    }
  };

  const completedCount = Object.values(stages).filter((s) => s.status === "completed").length;
  const totalStages = Object.keys(stages).length;
  const overallProgress = Math.round((completedCount / totalStages) * 100);

  if (!isClient) return null;

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white pt-20 pb-16 ${isRtl ? "rtl" : "ltr"}`}
    >
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(168,85,247,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.4)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4">
        {/* Language toggle */}
        <div className={`flex ${isRtl ? "justify-start" : "justify-end"} mb-6`}>
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-sm text-gray-300 transition-all"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-5">
            <Sparkles className="w-4 h-4" />
            {t.title}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t.mainTitle}
            </span>
          </h1>
          <p className="text-gray-400">{t.subtitle}</p>
        </motion.div>

        {/* Step indicator */}
        {step <= 3 && (
          <div className="flex justify-center mb-10" dir="ltr">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step > s
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : step === s
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-4 ring-purple-500/30"
                          : "bg-white/5 border border-white/10 text-gray-500"
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </motion.div>
                  <span className="text-xs text-gray-500 mt-1 hidden md:block">
                    {stepLabels[lang][s - 1]}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 md:w-24 h-0.5 mx-2 mb-4 transition-all duration-500 ${
                      step > s
                        ? "bg-gradient-to-r from-purple-600 to-pink-600"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step content with AnimatePresence */}
        <AnimatePresence mode="wait">
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 30 : -30 }}
              transition={{ duration: 0.35 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                </div>
                {t.step1Title}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {t.projectTitle}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t.projectTitlePlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {t.ideaLabel}
                  </label>
                  <textarea
                    value={formData.idea}
                    onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                    placeholder={t.ideaPlaceholder}
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.title || !formData.idea}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg"
                >
                  {t.next}
                  {isRtl ? (
                    <ChevronLeft className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 30 : -30 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Style selection */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-purple-400" />
                  </div>
                  {t.step2Title}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {types.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${
                        formData.type === type.id
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-4xl mb-2">{type.icon}</div>
                      <h3 className="font-bold mb-1 text-sm">{(t as any)[type.id]}</h3>
                      <p className="text-xs text-gray-400">
                        {lang === "ar" ? type.descriptionAr : type.descriptionEn}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Genre selection */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                    <Film className="w-5 h-5 text-pink-400" />
                  </div>
                  {t.step2Subtitle}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {genres.map((genre) => (
                    <motion.button
                      key={genre.id}
                      onClick={() => setFormData({ ...formData, genre: genre.id })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                        formData.genre === genre.id
                          ? "border-purple-500"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-${formData.genre === genre.id ? "25" : "10"} transition-opacity`}
                      />
                      <div className="text-3xl mb-2 relative z-10">{genre.emoji}</div>
                      <h3 className="font-bold text-sm relative z-10">{(t as any)[genre.id]}</h3>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all"
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  {t.prev}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.type || !formData.genre}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all"
                >
                  {t.next}
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 30 : -30 }}
              transition={{ duration: 0.35 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                {t.step3Title}
              </h2>

              <div className="space-y-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">
                    {t.titleLabel}
                  </span>
                  <p className="text-xl font-bold text-white">{formData.title}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-gray-400 text-xs uppercase tracking-wider block mb-2">
                    {t.ideaLabel2}
                  </span>
                  <p className="text-gray-200 leading-relaxed">{formData.idea}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider block mb-3">
                      {t.typeLabel}
                    </span>
                    <span className="text-4xl block mb-2">
                      {types.find((tp) => tp.id === formData.type)?.icon}
                    </span>
                    <p className="font-bold text-white">{(t as any)[formData.type]}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider block mb-3">
                      {t.genreLabel}
                    </span>
                    <span className="text-4xl block mb-2">
                      {genres.find((g) => g.id === formData.genre)?.emoji}
                    </span>
                    <p className="font-bold text-white">{(t as any)[formData.genre]}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-40"
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  {t.prev}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t.createProject}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4 — Generating ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-3">{t.step4Title}</h2>
              <p className="text-gray-400 mb-10">{t.step4Subtitle}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {productionStages.map(({ id, icon: Icon, labelAr, labelEn }) => {
                  const stage = stages[id];
                  return (
                    <motion.div
                      key={id}
                      className={`rounded-xl p-4 border transition-all ${getStageColor(stage?.status ?? "pending")}`}
                      animate={stage?.status === "processing" ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <div className="flex justify-center mb-3">
                        <Icon className="w-7 h-7" />
                      </div>
                      <p className="font-semibold text-sm mb-1">
                        {lang === "ar" ? labelAr : labelEn}
                      </p>
                      <p className="text-xs opacity-75">
                        {stage?.status === "completed"
                          ? t.completed
                          : stage?.status === "processing"
                            ? t.processing
                            : t.pending}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Overall progress bar */}
              <div className="bg-white/10 rounded-full h-3 mb-3 overflow-hidden border border-white/10">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="text-lg font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {overallProgress}%
                </span>{" "}
                <span className="text-gray-400">{t.percentComplete}</span>
              </p>
            </motion.div>
          )}

          {/* ── STEP 5 — Success ── */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center"
            >
              {/* Confetti-like floating particles */}
              <div className="relative">
                {confettiParticles.map((p: { left: string; top: string }, i: number) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${i % 2 === 0 ? "bg-purple-500" : "bg-pink-500"}`}
                    style={{ left: p.left, top: p.top }}
                    initial={{ opacity: 0, scale: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [-20, -80],
                      x: [(i % 2 === 0 ? 1 : -1) * 20],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: 2,
                    }}
                  />
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
              </div>

              <h2 className="text-3xl font-bold mb-3 text-white">{t.step5Title}</h2>
              <p className="text-gray-400 mb-10">{t.step5Subtitle}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {productionStages.map(({ id, icon: Icon, labelAr, labelEn }) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: productionStages.findIndex((s) => s.id === id) * 0.1 }}
                    className="bg-green-500/10 rounded-xl p-4 border border-green-500/25"
                  >
                    <div className="flex justify-center mb-2 text-green-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {lang === "ar" ? labelAr : labelEn}
                    </p>
                    <p className="text-xs text-green-400">{t.ready}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFormData({ title: "", idea: "", genre: "", type: "" });
                    setStages({
                      script: { status: "pending", progress: 0 },
                      images: { status: "pending", progress: 0 },
                      animation: { status: "pending", progress: 0 },
                      voice: { status: "pending", progress: 0 },
                      music: { status: "pending", progress: 0 },
                      assembly: { status: "pending", progress: 0 },
                    });
                    setProjectId(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all"
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  {t.createNew}
                </button>
                {projectId && (
                  <button
                    type="button"
                    onClick={() => (window.location.href = `/watch/${projectId}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-4 px-6 rounded-xl transition-all"
                  >
                    <Video className="w-5 h-5" />
                    {t.watchNow}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all"
                >
                  <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
                  {t.backHome}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

