"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Lightbulb, BookOpen, Wand2, Check, RefreshCw,
  ChevronRight, ChevronLeft, Film, Users, Loader2, Download,
  Edit3, Save, X, Eye, CheckCircle2, ArrowRight,
  Clock, MapPin, ScrollText, RotateCcw,
  MessageSquare, Zap, Video, Image as ImageIcon, Trash2, Plus,
  CheckSquare, Square, AlertCircle
} from "lucide-react";
import { useLang } from "@/contexts/language-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const COMFYUI_URL = process.env.NEXT_PUBLIC_COMFYUI_URL || "http://localhost:8188";

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

async function submitToComfyUI(prompt: string): Promise<string | null> {
  try {
    const workflow = buildComfyWorkflow(prompt);
    const res = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { prompt_id: string };
    return data.prompt_id || null;
  } catch {
    return null;
  }
}

async function pollComfyStatus(promptId: string): Promise<{ status: "pending" | "completed" | "failed"; imageUrl?: string }> {
  try {
    const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    if (!res.ok) return { status: "pending" };
    const history = await res.json() as Record<string, any>;
    const data = history[promptId];
    if (!data) return { status: "pending" };
    if (data.status?.status_str === "error") return { status: "failed" };
    if (data.status?.completed) {
      for (const nodeId in data.outputs) {
        const imgs = data.outputs[nodeId]?.images;
        if (imgs?.length > 0) {
          const img = imgs[0];
          const url = `${COMFYUI_URL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || "")}&type=${img.type}`;
          return { status: "completed", imageUrl: url };
        }
      }
      return { status: "completed" };
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
  title: string;
  concept: string;
  tone: string;
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

export function IdeaGenerator() {
  const { t, lang } = useLang();

  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStepState] = useState<"input" | "enhanced" | "variations" | "script" | "images" | "final">("input");
  const [mounted, setMounted] = useState(false);
  const [aiMode, setAiMode] = useState<"ollama+gemini" | "gemini" | "ollama" | "kimi">("gemini");

  // Update URL when step changes (client-side only)
  const setStep = (newStep: "input" | "enhanced" | "variations" | "script" | "images" | "final") => {
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
      const stepFromUrl = params.get("step") as "input" | "enhanced" | "variations" | "script" | "images" | "final" | null;
      if (stepFromUrl && ["input", "enhanced", "variations", "script", "images", "final"].includes(stepFromUrl)) {
        setStepState(stepFromUrl);
      }
    }
  }, []);

  // Results
  const [enhancedIdea, setEnhancedIdea] = useState<EnhancedIdea | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);
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

  useEffect(() => {
    setMounted(true);
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

  const enhanceIdea = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ollama/enhance-idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, provider: aiMode }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const raw = data.data || data;
      const enhanced: EnhancedIdea = {
        title: raw.title || idea,
        concept: raw.concept || idea,
        genre: raw.genre || "مغامرة",
        targetAge: raw.targetAge || raw.target_age || "عائلي",
        characters: (raw.characters || []).map((c: any) => ({
          name: c.name || "",
          role: c.role || "",
          age: c.age || "",
          desc: c.desc || c.personality || c.goal || "",
        })),
      };
      setEnhancedIdea(enhanced);
      setEditedConcept(enhanced.concept);
      setEditedTitle(enhanced.title);
      setEditedGenre(enhanced.genre);
      setEditedTargetAge(enhanced.targetAge);
      setEditedCharacters(enhanced.characters);
      setStep("enhanced");
    } catch (err) {
      console.error("enhanceIdea error:", err);
      const fallback: EnhancedIdea = {
        title: idea,
        concept: idea,
        genre: "مغامرة",
        targetAge: "عائلي",
        characters: [],
      };
      setEnhancedIdea(fallback);
      setEditedConcept(fallback.concept);
      setStep("enhanced");
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 2: Variations ====================

  const generateVariations = async () => {
    if (!enhancedIdea) return;
    setLoading(true);

    const currentIdea = editingIdea
      ? { ...enhancedIdea, title: editedTitle, concept: editedConcept, genre: editedGenre }
      : enhancedIdea;

    try {
      const response = await fetch(`${API_URL}/api/ollama/generate-variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enhancedIdea: currentIdea, provider: aiMode }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const vars: Variation[] = (data.variations || []).map((v: any) => ({
        id: v.id,
        title: v.title || "",
        concept: v.concept || "",
        tone: v.tone || "",
        uniqueElement: v.uniqueElement || v.unique_element || "",
      }));
      setVariations(vars);
    } catch (err) {
      console.error("generateVariations error:", err);
      const base = currentIdea.concept.slice(0, 120);
      setVariations([
        { id: 1, title: "النسخة الكوميدية", concept: `${base}... أسلوب كوميدي خفيف.`, tone: "كوميدي", uniqueElement: "مواقف طريفة" },
        { id: 2, title: "النسخة الدرامية", concept: `${base}... أسلوب درامي عاطفي.`, tone: "درامي", uniqueElement: "عمق عاطفي" },
        { id: 3, title: "النسخة المثيرة", concept: `${base}... أسلوب أكشن مشوق.`, tone: "أكشن", uniqueElement: "إثارة وتشويق" },
      ]);
    } finally {
      setSelectedVariations([]);
      setStep("variations");
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
    setGeneratedScripts([]);
    setEditingScript(null);
    setEditingScene(null);
    setEditingIdea(false);
    setEditedConcept("");
    setSceneImages({});
    setActiveScript(null);
    setPendingPolls([]);
    setStep("input");
  };

  // ==================== STEP 3: Scripts ====================

  const generateScripts = async () => {
    if (selectedVariations.length === 0 || !enhancedIdea) return;

    setLoading(true);

    try {
      const ideas = selectedVariations.map(varId => {
        const variation = variations.find(v => v.id === varId);
        return {
          title: variation?.title || enhancedIdea.title,
          concept: variation?.concept || enhancedIdea.concept,
          genre: enhancedIdea.genre
        };
      });

      const response = await fetch(`${API_URL}/api/ollama/generate-scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas, provider: aiMode }),
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
    setLoading(true);
    try {
      const script = generatedScripts.find(s => s.id === scriptId);
      const scene = script?.scenes.find(s => s.id === sceneId);
      if (!scene || !enhancedIdea) return;

      const res = await fetch(`${API_URL}/api/ollama/regenerate-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptTitle: script?.title,
          sceneNumber: scene.number,
          location: scene.location,
          time: scene.time,
          genre: enhancedIdea.genre,
        }),
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {[
          { id: "input", label: t("الفكرة", "Idea") },
          { id: "enhanced", label: t("التحسين", "Enhanced") },
          { id: "variations", label: t("النسخ", "Versions") },
          { id: "script", label: t("السكربت", "Script") },
          { id: "images", label: t("الصور", "Images") },
          { id: "final", label: t("النهائي", "Final") },
        ].map((s, index) => {
          const stepOrder = ["input", "enhanced", "variations", "script", "images", "final"];
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t("أعطني فكرتك", "Give Me Your Idea")}</h2>
            <p className="text-gray-400">{t("سأحسنها ثم أعطيك 3 نسخ مختلفة", "I'll enhance it then give you 3 different versions")}</p>
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

          {/* AI Mode Toggle */}
          <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            {([
              { value: "ollama+gemini", icon: "🔄", label: t("Ollama + Gemini", "Ollama + Gemini") },
              { value: "gemini",        icon: "✨", label: t("Gemini",           "Gemini") },
              { value: "kimi",          icon: "🌙", label: t("Kimi",             "Kimi") },
              { value: "ollama",        icon: "🤖", label: t("Ollama",           "Ollama") },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAiMode(opt.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  aiMode === opt.value
                    ? "bg-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          <motion.button
            onClick={enhanceIdea}
            disabled={loading || !idea.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-purple-500/25"
          >
            {loading ? (
              <><Loader2 className="w-7 h-7 animate-spin" />{t("جاري تحسين الفكرة...", "Enhancing your idea...")}</>
            ) : (
              <><Sparkles className="w-7 h-7" />{t("حسّن فكرتي", "Enhance My Idea")}</>
            )}
          </motion.button>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t("النوع", "Genre")}</label>
                      <select
                        value={editedGenre}
                        onChange={(e) => setEditedGenre(e.target.value)}
                        title={t("النوع", "Genre")}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                      >
                        {["مغامرة","كوميديا","دراما","خيال علمي","فانتازيا","رعب","أكشن","مغامرة / خيال / كوميديا"].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t("الفئة المستهدفة", "Target Audience")}</label>
                      <select
                        value={editedTargetAge}
                        onChange={(e) => setEditedTargetAge(e.target.value)}
                        title={t("الفئة المستهدفة", "Target Audience")}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                      >
                        {["أطفال (2-6 سنوات)","أطفال (7-12 سنة)","مراهقين (13-17 سنة)","شباب (18-25 سنة)","عائلي (10+ سنة)","عائلي (كل الأعمار)"].map(a => (
                          <option key={a} value={a}>{a}</option>
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
                    <button type="button" onClick={saveEdit} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-6 rounded-xl transition-all">
                      <Save className="w-5 h-5" /> {t("حفظ التغييرات", "Save Changes")}
                    </button>
                    <button type="button" onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all">
                      <X className="w-5 h-5" /> {t("إلغاء", "Cancel")}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">{enhancedIdea.concept}</p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300">{enhancedIdea.genre}</span>
                  <span className="px-4 py-2 rounded-full bg-pink-500/20 text-pink-300">{enhancedIdea.targetAge}</span>
                </div>
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
                  <button type="button" onClick={startEdit} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2">
                    <Edit3 className="w-4 h-4" /> {t("تعديل", "Edit")}
                  </button>
                  <button type="button" onClick={() => {
                    const content = `العنوان: ${enhancedIdea.title}\n\n${enhancedIdea.concept}\n\nالنوع: ${enhancedIdea.genre}\nالفئة: ${enhancedIdea.targetAge}`;
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `${enhancedIdea.title}.txt`; a.click();
                  }} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> {t("حفظ", "Save")}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={reset} className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all">{t("إلغاء", "Cancel")}</button>
            <button type="button" onClick={() => setStep("input")} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2">
              <ChevronLeft className="w-5 h-5" /> {t("السابق", "Back")}
            </button>
            <motion.button
              onClick={generateVariations}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Lightbulb className="w-6 h-6" />{t("أعطني 3 نسخ مختلفة", "Give Me 3 Different Versions")}<ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ===== STEP 3: VARIATIONS ===== */}
      {step === "variations" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-purple-400" />
                {t("اختر النسخ التي تناسبك (حتى 3)", "Choose Your Preferred Versions (up to 3)")}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{selectedVariations.length} / 3 {t("مختار", "selected")}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {variations.map((variation, index) => {
              const isSelected = selectedVariations.includes(variation.id);
              return (
                <motion.div
                  key={variation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleVariation(variation.id)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all ${isSelected ? "bg-purple-500/20 border-2 border-purple-500" : "bg-black/30 border border-white/10 hover:border-white/30"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${index === 0 ? "bg-yellow-500/20 text-yellow-300" : index === 1 ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"}`}>
                      {isSelected ? <Check className="w-6 h-6" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-2">{variation.title}</h4>
                      <p className="text-gray-300 mb-3">{variation.concept}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">{variation.tone}</span>
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-sm">{variation.uniqueElement}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep("enhanced")} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2">
              <ChevronLeft className="w-5 h-5" /> {t("السابق", "Back")}
            </button>
            <motion.button
              onClick={generateScripts}
              disabled={selectedVariations.length === 0 || loading}
              whileHover={{ scale: selectedVariations.length > 0 ? 1.02 : 1 }}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ScrollText className="w-6 h-6" />{t("توليد سكربت كامل", "Generate Full Script")}<ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ===== STEP 4: SCRIPT DISPLAY ===== */}
      {step === "script" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <ScrollText className="w-7 h-7 text-purple-400" />
                {t("السكربت الكامل", "Full Script")}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{generatedScripts.length} {t("سكربت مولد", "script(s) generated")}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("variations")} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> {t("رجوع", "Back")}
              </button>
              <button type="button" onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> {t("جديد", "New")}
              </button>
            </div>
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
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {t("توليد صور المشاهد عبر ComfyUI", "Generate Scene Images via ComfyUI")}
                  </button>
                  <button type="button"
                    onClick={() => downloadScript(script)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm flex items-center gap-2 transition-all"
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
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <ImageIcon className="w-7 h-7 text-pink-400" />
                {t("مراجعة الصور", "Image Review")}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{activeScript.title}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {imageStats && (
                <div className="flex gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/20">
                    ✓ {imageStats.done}/{imageStats.total}
                  </span>
                  {imageStats.generating > 0 && (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {imageStats.generating}
                    </span>
                  )}
                  {imageStats.error > 0 && (
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {imageStats.error}
                    </span>
                  )}
                </div>
              )}
              <button type="button" onClick={() => setStep("script")} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> {t("تعديل السكربت", "Edit Script")}
              </button>
            </div>
          </div>

          {/* Scene Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {activeScript.scenes.map((scene, idx) => {
              const img = sceneImages[scene.id];
              return (
                <button type="button"
                  key={scene.id}
                  onClick={() => setActiveSceneTab(idx)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm flex items-center gap-1.5 ${activeSceneTab === idx ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                >
                  {img?.status === "generating" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {img?.status === "done" && img.approved && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {img?.status === "done" && !img.approved && <Eye className="w-3 h-3 text-blue-400" />}
                  {img?.status === "error" && <AlertCircle className="w-3 h-3 text-red-400" />}
                  {t("مشهد", "Scene")} {scene.number}
                </button>
              );
            })}
          </div>

          {/* Active Scene */}
          <AnimatePresence mode="wait">
            {activeScript.scenes[activeSceneTab] && (() => {
              const scene = activeScript.scenes[activeSceneTab];
              const img = sceneImages[scene.id];
              return (
                <motion.div key={activeSceneTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-6">
                  {/* Image Area */}
                  <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="aspect-video relative flex items-center justify-center">
                      {img?.status === "generating" && (
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">{t("جاري الإنشاء عبر ComfyUI...", "Generating via ComfyUI...")}</p>
                        </div>
                      )}
                      {img?.status === "done" && img.imageUrl && (
                        <>
                          <img src={img.imageUrl} alt={`Scene ${scene.number}`} className="w-full h-full object-cover" />
                          {img.approved && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {t("مقبولة", "Approved")}
                            </div>
                          )}
                        </>
                      )}
                      {img?.status === "error" && (
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                          <p className="text-red-400 text-sm">{t("فشل التوليد", "Generation Failed")}</p>
                        </div>
                      )}
                      {(!img || img.status === "idle") && (
                        <div className="text-center text-gray-500">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{t("في الانتظار", "Waiting")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scene Info & Controls */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm">{scene.number}</span>
                        <span className="text-white font-semibold">{scene.location}</span>
                        <span className="text-gray-500 text-xs">{scene.time}</span>
                      </div>
                      {scene.dialogue && (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          "{scene.dialogue}"
                        </div>
                      )}
                    </div>

                    {/* Image Prompt Editor */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {t("وصف الصورة (Image Prompt)", "Image Prompt")}
                      </label>
                      <textarea
                        value={scene.imagePrompt || ""}
                        onChange={(e) => {
                          if (!activeScript) return;
                          const scriptInList = generatedScripts.find(s => s.id === activeScript.id);
                          if (scriptInList) updateScene(activeScript.id, scene.id, "imagePrompt", e.target.value);
                          setActiveScript(prev => prev ? {
                            ...prev,
                            scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, imagePrompt: e.target.value } : s)
                          } : prev);
                        }}
                        className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white text-xs resize-none focus:outline-none focus:border-purple-500 font-mono"
                        rows={3}
                        placeholder="Describe the scene visually for image generation..."
                        dir="ltr"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => regenerateSceneImage(scene.id, scene.imagePrompt || `${scene.location}, ${scene.time}, ${scene.action}, animated style`)}
                        disabled={img?.status === "generating"}
                        className="flex-1 py-2.5 text-sm rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                      >
                        <RefreshCw className={`w-4 h-4 ${img?.status === "generating" ? "animate-spin" : ""}`} />
                        {t("إعادة التوليد", "Regenerate")}
                      </button>
                      <button type="button"
                        onClick={() => toggleApproveImage(scene.id)}
                        disabled={img?.status !== "done"}
                        className={`flex-1 py-2.5 text-sm rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all border ${img?.approved ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-white/5 text-gray-300 hover:bg-white/10 border-white/10"}`}
                      >
                        {img?.approved ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {img?.approved ? t("مقبولة ✓", "Approved ✓") : t("قبول", "Approve")}
                      </button>
                    </div>

                    {/* Navigate between scenes */}
                    <div className="flex gap-2 pt-2">
                      <button type="button" disabled={activeSceneTab === 0} onClick={() => setActiveSceneTab(i => i - 1)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 flex items-center justify-center gap-1">
                        <ChevronRight className="w-4 h-4" /> {t("السابق", "Prev")}
                      </button>
                      <button type="button" disabled={activeSceneTab === activeScript.scenes.length - 1} onClick={() => setActiveSceneTab(i => i + 1)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 flex items-center justify-center gap-1">
                        {t("التالي", "Next")} <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Bulk approve & continue */}
          {allGenerationDone && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/10 pt-6 space-y-3">
              {imageStats && imageStats.approved < imageStats.done && (
                <button type="button"
                  onClick={approveAllDoneImages}
                  className="w-full py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t("قبول جميع الصور", "Approve All Images")} ({imageStats.done} {t("صورة", "images")})
                </button>
              )}
              <motion.button
                onClick={() => setStep("final")}
                whileHover={{ scale: 1.02 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
              >
                <Video className="w-6 h-6" />
                {t(`متابعة لتوليد الفيديو (${imageStats?.approved || 0} صورة مقبولة)`, `Continue to Video Generation (${imageStats?.approved || 0} approved)`)}
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
          <div className="flex justify-center gap-4 flex-wrap">
            <button type="button"
              onClick={() => window.open("http://localhost:8188", "_blank")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <Wand2 className="w-5 h-5" />
              {t("فتح ComfyUI للتحريك", "Open ComfyUI for Animation")}
            </button>
            <button type="button"
              onClick={reset}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
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
