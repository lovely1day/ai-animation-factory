"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Play,
  Wand2,
  Film,
  Clock,
  Zap,
  BarChart2,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ProviderInfo {
  id: string;
  enabled: boolean;
  usage: { calls: number; success: number; errors: number; lastUsed: string | null; lastError: string | null };
}

interface ProvidersData {
  providers: ProviderInfo[];
  ollama: { running: boolean; models: string[]; recommended: string };
  best_provider: string | null;
  total_calls: number;
}

type WorkflowStep = 'idea' | 'script' | 'images' | 'completed' | 'image_generation';
type WorkflowStatus = 'pending' | 'processing' | 'waiting_approval' | 'approved';
type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

interface Scene {
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  narration?: string;
  duration_seconds: number;
  image_url?: string;
  status?: string;
}

interface EpisodeData {
  step: WorkflowStep;
  status: WorkflowStatus;
  data: {
    script?: {
      title: string;
      description: string;
      scenes: Scene[];
    };
    scenes?: Scene[];
    script_approved?: boolean;
    images_approved?: boolean;
  };
  canEdit: boolean;
}

export default function CreatePage() {
  // Form state
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("adventure");
  const [targetAudience, setTargetAudience] = useState("general");

  // AI generation state
  const [generatingModel, setGeneratingModel] = useState<string | null>(null); // which model is loading
  const [lastEngine, setLastEngine] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [showProviders, setShowProviders] = useState(false);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('idea');
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Approval state
  const [editedScript, setEditedScript] = useState<EpisodeData['data']['script'] | null>(null);
  const [editedScenes, setEditedScenes] = useState<Scene[]>([]);
  const [activeSceneTab, setActiveSceneTab] = useState(0);
  const [regeneratingScenes, setRegeneratingScenes] = useState<Set<number>>(new Set());

  // Load provider status on mount
  useEffect(() => {
    fetch(`${API_URL}/api/generation/providers`)
      .then(r => r.json())
      .then(d => { if (d.success) setProviders(d.data); })
      .catch(() => {});
  }, []);

  // Refresh providers after each generation
  const refreshProviders = () => {
    fetch(`${API_URL}/api/generation/providers`)
      .then(r => r.json())
      .then(d => { if (d.success) setProviders(d.data); })
      .catch(() => {});
  };

  // AI Idea Generator — per model
  const handleGenerateIdea = async (ollamaModel: string) => {
    setGeneratingModel(ollamaModel);
    setLastEngine(null);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/generation/idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, target_audience: targetAudience, ollamaModel }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "فشل التوليد");
      const generated = data.data;
      setTitle(generated.title || "");
      setIdea(generated.description || "");
      setLastEngine(generated.engine || ollamaModel);
      refreshProviders();
    } catch (err: any) {
      setError(`خطأ في توليد الفكرة: ${err.message}`);
    } finally {
      setGeneratingModel(null);
    }
  };

  // Poll for updates
  useEffect(() => {
    if (!episodeId) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/episodes/${episodeId}`);
        const data = await res.json();
        
        if (data.success) {
          const pollData = data.data;
          const wfStep = pollData.workflow_step;
          const wfStatus = pollData.workflow_status;
          
          // Map to WorkflowStep
          let mappedStep: WorkflowStep = currentStep;
          if (wfStep === 'script' && wfStatus === 'waiting_approval') mappedStep = 'script';
          else if (wfStep === 'images' && wfStatus === 'waiting_approval') mappedStep = 'images';
          else if (['assembly', 'final'].includes(wfStep) || wfStatus === 'completed') mappedStep = 'completed';
          
          setCurrentStep(mappedStep);
          
          // Initialize edited data
          if (pollData.script_data && !editedScript) {
            setEditedScript(pollData.script_data);
          }
          if (pollData.scenes?.length > 0 && editedScenes.length === 0) {
            setEditedScenes(pollData.scenes);
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [episodeId, currentStep, editedScript, editedScenes.length]);

  const handleCreateEpisode = async () => {
    if (!title.trim() || !idea.trim()) {
      setError("الرجاء إدخال العنوان والفكرة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          idea,
          genre,
          target_audience: targetAudience,
          approval_steps: ["script", "images"],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في إنشاء الحلقة");
      }

      setEpisodeId(data.data.id);
      setCurrentStep('script');

      // Start pipeline (generates script directly without Redis)
      fetch(`${API_URL}/api/episodes/${data.data.id}/start`, { method: 'POST' })
        .then(() => refreshProviders())
        .catch(() => {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveScript = async (approved: boolean) => {
    if (!episodeId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approved ? 'approved' : 'rejected',
          modifications: approved ? editedScript : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("فشل في معالجة الموافقة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveImages = async (approved: boolean) => {
    if (!episodeId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: approved ? 'approved' : 'rejected' }),
      });

      if (!res.ok) {
        throw new Error("فشل في معالجة الموافقة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!episodeId) return;
    
    setRegeneratingScenes(prev => new Set(prev).add(sceneNumber));
    
    try {
      const scene = editedScenes.find(s => s.scene_number === sceneNumber);
      if (!scene) return;

      const res = await fetch(`${API_URL}/api/approval/episodes/${episodeId}/scenes/${sceneNumber}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visual_prompt: scene.visual_prompt }),
      });

      if (!res.ok) {
        throw new Error("فشل في إعادة التوليد");
      }
      
      setRegeneratingScenes(prev => { const s = new Set(prev); s.delete(sceneNumber); return s; });
    } catch (err: any) {
      setError(err.message);
      setRegeneratingScenes(prev => { const s = new Set(prev); s.delete(sceneNumber); return s; });
    }
  };

  const handleUpdateScenePrompt = (sceneNumber: number, newPrompt: string) => {
    setEditedScenes(prev => prev.map(s => 
      s.scene_number === sceneNumber ? { ...s, visual_prompt: newPrompt } : s
    ));
  };

  const handleUpdateSceneScript = (sceneNumber: number, field: keyof Scene, value: string) => {
    setEditedScenes(prev => prev.map(s => 
      s.scene_number === sceneNumber ? { ...s, [field]: value } : s
    ));
    
    if (editedScript) {
      setEditedScript({
        ...editedScript,
        scenes: editedScript.scenes.map(s => 
          s.scene_number === sceneNumber ? { ...s, [field]: value } : s
        )
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8" dir="ltr">
      {[
        { id: 'idea', label: 'الفكرة', icon: Sparkles },
        { id: 'script', label: 'السكربت', icon: FileText },
        { id: 'images', label: 'الصور', icon: ImageIcon },
        { id: 'completed', label: 'مكتمل', icon: CheckCircle2 },
      ].map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = ['script', 'images', 'completed'].indexOf(currentStep) > index;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-4 ring-purple-500/30'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-500 border border-white/20'
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="text-xs mt-2 text-gray-400">{step.label}</span>
            </div>
            {index < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderIdeaForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* ── Provider Status Panel ─────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProviders(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            <span>حالة مزودي الذكاء الاصطناعي</span>
            {providers && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs">
                {providers.providers.filter(p => p.enabled).length} نشط
              </span>
            )}
            {providers?.total_calls ? (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs">
                {providers.total_calls} طلب
              </span>
            ) : null}
          </div>
          {showProviders ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showProviders && providers && (
          <div className="px-4 pb-4 space-y-2 border-t border-white/5">
            {/* Cloud providers */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {providers.providers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    p.enabled
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-white/[0.03] border border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span className={p.enabled ? 'text-green-300' : 'text-gray-500'}>{p.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    {p.usage.calls > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        {p.usage.success}/{p.usage.calls}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Ollama */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              providers.ollama.running
                ? 'bg-blue-500/10 border border-blue-500/20'
                : 'bg-white/[0.03] border border-white/5 opacity-50'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${providers.ollama.running ? 'bg-blue-400' : 'bg-gray-600'}`} />
              <span className={providers.ollama.running ? 'text-blue-300' : 'text-gray-500'}>
                Ollama {providers.ollama.running ? `(${providers.ollama.models.length} نموذج)` : '(غير متاح)'}
              </span>
              {providers.best_provider && (
                <span className="mr-auto text-gray-500">
                  الأفضل: <span className="text-purple-300">{providers.best_provider}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Form ─────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-purple-400" />
          </div>
          إنشاء محتوى جديد
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">النوع</label>
              <select
                title="النوع"
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
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">الفئة المستهدفة</label>
              <select
                title="الفئة المستهدفة"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="children">أطفال</option>
                <option value="teens">مراهقين</option>
                <option value="adults">بالغين</option>
                <option value="general">عام</option>
              </select>
            </div>
          </div>

          {/* Ollama Model Buttons — كل زر = نموذج مختلف */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">اختر النموذج لتوليد الفكرة</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { model: "mistral",    label: "Mistral",   desc: "دقيق JSON",   color: "from-violet-600/80 to-purple-600/80 border-violet-500/30 hover:from-violet-500 hover:to-purple-500" },
                { model: "llama3",     label: "LLaMA 3",   desc: "إبداعي",      color: "from-blue-600/80 to-cyan-600/80 border-blue-500/30 hover:from-blue-500 hover:to-cyan-500" },
                { model: "qwen2.5:7b", label: "Qwen 2.5",  desc: "متوازن",      color: "from-emerald-600/80 to-teal-600/80 border-emerald-500/30 hover:from-emerald-500 hover:to-teal-500" },
              ].map(({ model, label, desc, color }) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => handleGenerateIdea(model)}
                  disabled={generatingModel !== null}
                  className={`flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${color} disabled:opacity-40 border text-white py-3 px-2 rounded-xl transition-all`}
                >
                  {generatingModel === model ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-[10px] text-white/60">{desc}</span>
                </button>
              ))}
            </div>
            {lastEngine && (
              <p className="text-[11px] text-center text-gray-500">
                ولّد بـ <span className="text-purple-400 font-mono">{lastEngine}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">عنوان المسلسل</label>
            <input
              type="text"
              title="عنوان المسلسل"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مغامرات الفضاء"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">الفكرة الرئيسية</label>
            <textarea
              title="الفكرة الرئيسية"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="صف فكرتك بالتفصيل..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateEpisode}
            disabled={loading || !title.trim() || !idea.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                إنشاء المشروع وتوليد السكربت
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderScriptApproval = () => {
    const script = editedScript || episodeData?.data?.script;
    if (!script) {
      return (
        <div className="text-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-gray-400">جاري كتابة السكربت...</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              مراجعة السكربت
            </h2>
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-sm">
              بانتظار الموافقة
            </div>
          </div>

          <div className="space-y-6">
            {/* Script Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="block text-sm text-gray-400 mb-2">العنوان</label>
              <input
                type="text"
                value={editedScript?.title || script.title}
                onChange={(e) => setEditedScript(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="w-full bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b-2 focus:border-purple-500"
              />
            </div>

            {/* Scenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">المشاهد ({editedScenes.length || script.scenes.length})</h3>
              
              {(editedScenes.length > 0 ? editedScenes : script.scenes).map((scene, index) => (
                <motion.div
                  key={scene.scene_number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                      {scene.scene_number}
                    </span>
                    <input
                      type="text"
                      value={scene.title}
                      onChange={(e) => handleUpdateSceneScript(scene.scene_number, 'title', e.target.value)}
                      className="flex-1 bg-transparent font-semibold text-white focus:outline-none focus:border-b-2 focus:border-purple-500"
                    />
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {scene.duration_seconds}ث
                    </span>
                  </div>
                  
                  <textarea
                    value={scene.description}
                    onChange={(e) => handleUpdateSceneScript(scene.scene_number, 'description', e.target.value)}
                    className="w-full bg-white/5 rounded-lg p-3 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    rows={2}
                  />
                  
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <label className="text-xs text-purple-400 mb-1 block">وصف الصورة (Prompt)</label>
                    <textarea
                      value={scene.visual_prompt}
                      onChange={(e) => handleUpdateSceneScript(scene.scene_number, 'visual_prompt', e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-300 focus:outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {scene.dialogue && (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <label className="text-xs text-blue-400 mb-1 block">الحوار</label>
                      <input
                        type="text"
                        value={scene.dialogue}
                        onChange={(e) => handleUpdateSceneScript(scene.scene_number, 'dialogue', e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-300 focus:outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Approval Actions */}
            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button
                onClick={() => handleApproveScript(false)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <XCircle className="w-5 h-5" />
                رفض وإعادة المحاولة
              </button>
              <button
                onClick={() => handleApproveScript(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                موافقة وإنشاء الصور
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderImagesApproval = () => {
    const scenes = episodeData?.data?.scenes || editedScenes;
    
    if (!scenes || scenes.length === 0) {
      return (
        <div className="text-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-gray-400">جاري إنشاء الصور...</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-pink-400" />
              </div>
              مراجعة الصور
            </h2>
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-sm">
              بانتظار الموافقة
            </div>
          </div>

          {/* Scene Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {scenes.map((scene, idx) => (
              <button
                key={scene.scene_number}
                onClick={() => setActiveSceneTab(idx)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeSceneTab === idx
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                مشهد {scene.scene_number}
                {regeneratingScenes.has(scene.scene_number) && (
                  <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                )}
              </button>
            ))}
          </div>

          {/* Active Scene */}
          {scenes[activeSceneTab] && (
            <motion.div
              key={activeSceneTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Image */}
              <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                {scenes[activeSceneTab].image_url ? (
                  <div className="relative aspect-video">
                    <img
                      src={scenes[activeSceneTab].image_url}
                      alt={`Scene ${scenes[activeSceneTab].scene_number}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 backdrop-blur-md rounded-full text-green-300 text-sm border border-green-500/30">
                      تم الإنشاء
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
                      <p className="text-gray-400">جاري إنشاء الصورة...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scene Info & Edit */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{scenes[activeSceneTab].title}</h3>
                  <p className="text-gray-400">{scenes[activeSceneTab].description}</p>
                </div>

                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <label className="text-sm text-purple-400 mb-2 block flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    تعديل وصف الصورة (Prompt)
                  </label>
                  <textarea
                    value={scenes[activeSceneTab].visual_prompt}
                    onChange={(e) => handleUpdateScenePrompt(scenes[activeSceneTab].scene_number, e.target.value)}
                    className="w-full bg-black/20 rounded-lg p-3 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    rows={4}
                  />
                  <button
                    onClick={() => handleRegenerateScene(scenes[activeSceneTab].scene_number)}
                    disabled={regeneratingScenes.has(scenes[activeSceneTab].scene_number)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${regeneratingScenes.has(scenes[activeSceneTab].scene_number) ? 'animate-spin' : ''}`} />
                    إعادة إنشاء الصورة
                  </button>
                </div>

                {scenes[activeSceneTab].dialogue && (
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <label className="text-sm text-blue-400 mb-2 block">الحوار</label>
                    <p className="text-gray-300">{scenes[activeSceneTab].dialogue}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Approval Actions */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-white/10">
            <button
              onClick={() => handleApproveImages(false)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <XCircle className="w-5 h-5" />
              رفض
            </button>
            <button
              onClick={() => handleApproveImages(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              موافقة واستكمال
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCompleted = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-3xl font-bold mb-4">اكتمل الإنشاء!</h2>
      <p className="text-gray-400 mb-8">تم إنشاء الحلقة بنجاح مع الموافقة على جميع المراحل</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => window.location.href = `/watch/${episodeId}`}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all"
        >
          <Play className="w-5 h-5" />
          مشاهدة الحلقة
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
        >
          <Sparkles className="w-5 h-5" />
          إنشاء جديد
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen text-white pt-20 pb-16 bg-transparent">
      {/* Background removed - using global animated background */}

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-5">
            <Sparkles className="w-4 h-4" />
            إنشاء محتوى بالذكاء الاصطناعي
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              حوّل أفكارك إلى مسلسل متحرك
            </span>
          </h1>
          <p className="text-gray-400">خطوة بخطوة مع مراجعة وموافقة في كل مرحلة</p>
        </motion.div>

        {/* Step Indicator */}
        {currentStep !== 'idea' && renderStepIndicator()}

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'idea' && renderIdeaForm()}
          {currentStep === 'script' && renderScriptApproval()}
          {currentStep === 'images' && renderImagesApproval()}
          {currentStep === 'completed' && renderCompleted()}
        </AnimatePresence>
      </div>
    </div>
  );
}
