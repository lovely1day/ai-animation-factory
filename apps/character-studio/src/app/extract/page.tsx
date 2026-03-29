"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Dna, Sparkles, Copy, Check, AlertCircle,
  Image as ImageIcon, Loader2, ChevronDown, ChevronUp,
  Wand2, RefreshCw, ArrowRight
} from "lucide-react";
import Link from "next/link";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface CharacterCard {
  name: string;
  gender: string;
  era: string;
  yearRange: string;
  features: string[];
  dna: string;
}

interface ExtractResult {
  subjectType: "human" | "animal" | "vehicle" | "place" | "object" | "creature";
  subjectTypeLabel: string;
  dna: string;
  dnaJson: Record<string, string>;
  prompts: {
    comfyui: { positive: string; negative: string };
    midjourney: string;
    gemini: string;
    dalle: string;
    chatgpt: string;
    grok: string;
    stableDiffusion: string;
    flux: string;
    universal: string;
  };
  negativePrompt: string;
  characterCard: CharacterCard;
  description: string;
  keyFeatures: string[];
  regenerationNotes: string;
}

// ────────────────────────────────────────────────────────────────
// Copy button
// ────────────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-[11px] text-white/50 hover:text-white transition-all">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "تم!" : (label ?? "نسخ")}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────
// Prompt card
// ────────────────────────────────────────────────────────────────
function PromptCard({
  tool, prompt, color, copyText
}: { tool: string; prompt: string; color: string; copyText?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${color}`}>{tool}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={copyText ?? prompt} />
          {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <p className="text-xs text-white/60 font-mono leading-relaxed bg-white/[0.03] rounded-lg p-3 text-left" dir="ltr">
                {prompt}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// DNA JSON viewer
// ────────────────────────────────────────────────────────────────
function DnaViewer({ dna, dnaJson }: { dna: string; dnaJson: Record<string, string> }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">DNA String</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={dna} label="نسخ DNA" />
          {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {/* DNA string */}
              <p className="text-xs font-mono text-violet-300 bg-violet-500/[0.08] rounded-lg px-3 py-2 break-all" dir="ltr">
                {dna}
              </p>
              {/* DNA table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {Object.entries(dnaJson).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                    <span className="text-[10px] text-white/30 font-mono w-8 shrink-0">{k}</span>
                    <span className="text-[10px] text-white/70 font-mono truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────
export default function ExtractPage() {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ExtractResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/extract-dna", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الاستخراج");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const PROMPT_COLORS: Record<string, string> = {
    "ComfyUI": "text-violet-400 bg-violet-500/10",
    "Midjourney": "text-blue-400 bg-blue-500/10",
    "Gemini / Imagen": "text-sky-400 bg-sky-500/10",
    "DALL·E": "text-pink-400 bg-pink-500/10",
    "ChatGPT / GPT-4o": "text-emerald-400 bg-emerald-500/10",
    "Grok / Aurora": "text-orange-400 bg-orange-500/10",
    "Stable Diffusion / SDXL": "text-indigo-400 bg-indigo-500/10",
    "FLUX": "text-cyan-400 bg-cyan-500/10",
    "Universal": "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />
          الكتالوج
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-xs text-amber-400">✦ DNA Extractor</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Dna className="w-6 h-6 text-amber-400" />
          DNA Extractor
        </h1>
        <p className="text-sm text-white/40 mt-1">
          ارفع أي صورة (إنسان، حيوان، سيارة، مكان…) — احصل على DNA + برومبتات لكل الأدوات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Upload + image preview */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
              ${dragOver ? "border-amber-400/60 bg-amber-500/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full max-h-80 object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-xs text-white/70">اضغط لتغيير الصورة</p>
                </div>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center gap-3 text-white/30">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/50">اسحب صورة هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-white/25 mt-1">PNG، JPG، WEBP — أي شيء</p>
                </div>
              </div>
            )}
          </div>

          {/* Extract button */}
          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={extract}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-medium text-sm transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الاستخراج…</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> استخرج DNA</>
                )}
              </button>
              {!loading && result && (
                <button
                  onClick={() => { setResult(null); setPreview(null); setFile(null); }}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl btn-ghost text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  صورة جديدة
                </button>
              )}
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Subject type badge */}
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">تم الاستخراج</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {result.subjectTypeLabel}
                </span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{result.description}</p>
              {result.keyFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {result.keyFeatures.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-white/40">{f}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right — Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="glass rounded-2xl h-80 flex flex-col items-center justify-center gap-3 text-white/20">
              <Dna className="w-10 h-10" />
              <p className="text-sm">النتائج ستظهر هنا بعد الاستخراج</p>
            </div>
          )}

          {loading && (
            <div className="glass rounded-2xl h-80 flex flex-col items-center justify-center gap-4 text-white/40">
              <div className="relative">
                <Dna className="w-10 h-10 text-amber-400/30" />
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin absolute -top-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60">Claude يحلل الصورة…</p>
                <p className="text-xs text-white/30 mt-1">يستخرج DNA + برومبتات لكل الأدوات</p>
              </div>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {/* DNA */}
              <DnaViewer dna={result.dna} dnaJson={result.dnaJson} />

              {/* Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-white/30 px-1">برومبتات جاهزة لكل أداة</p>
                {/* ComfyUI — positive + negative منفصلان */}
                <PromptCard
                  tool="ComfyUI"
                  prompt={`[Positive]\n${result.prompts.comfyui.positive}\n\n[Negative]\n${result.prompts.comfyui.negative}`}
                  copyText={result.prompts.comfyui.positive}
                  color={PROMPT_COLORS["ComfyUI"]}
                />
                <PromptCard tool="Midjourney" prompt={result.prompts.midjourney} color={PROMPT_COLORS["Midjourney"]} />
                <PromptCard tool="Gemini / Imagen" prompt={result.prompts.gemini} color={PROMPT_COLORS["Gemini / Imagen"]} />
                <PromptCard tool="DALL·E" prompt={result.prompts.dalle} color={PROMPT_COLORS["DALL·E"]} />
                <PromptCard tool="ChatGPT / GPT-4o" prompt={result.prompts.chatgpt} color={PROMPT_COLORS["ChatGPT / GPT-4o"]} />
                <PromptCard tool="Grok / Aurora" prompt={result.prompts.grok} color={PROMPT_COLORS["Grok / Aurora"]} />
                <PromptCard tool="Stable Diffusion / SDXL" prompt={result.prompts.stableDiffusion} color={PROMPT_COLORS["Stable Diffusion / SDXL"]} />
                <PromptCard tool="FLUX" prompt={result.prompts.flux} color={PROMPT_COLORS["FLUX"]} />
                <PromptCard tool="Universal" prompt={result.prompts.universal} color={PROMPT_COLORS["Universal"]} />
              </div>

              {/* Negative prompt */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Negative Prompt</span>
                  <CopyBtn text={result.negativePrompt} />
                </div>
                <p className="text-[11px] font-mono text-red-400/70 leading-relaxed" dir="ltr">
                  {result.negativePrompt}
                </p>
              </div>

              {/* Character Card */}
              {result.characterCard && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-white/40 font-medium">Character Card</p>
                    <CopyBtn text={JSON.stringify(result.characterCard, null, 2)} label="نسخ JSON" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "الاسم", value: result.characterCard.name },
                      { label: "الجنس", value: result.characterCard.gender },
                      { label: "الحقبة", value: result.characterCard.era },
                      { label: "الفترة", value: result.characterCard.yearRange },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/[0.03] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-white/30">{label}</p>
                        <p className="text-xs text-white/70 font-mono mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {result.characterCard.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {result.characterCard.features.slice(0, 6).map((f, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300/70">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Regeneration notes */}
              {result.regenerationNotes && (
                <div className="glass rounded-xl p-4 border-amber-500/20">
                  <p className="text-xs text-amber-400/70 font-medium mb-1">💡 ملاحظات لإعادة التوليد</p>
                  <p className="text-xs text-white/40 leading-relaxed">{result.regenerationNotes}</p>
                </div>
              )}

              {/* Load into studio */}
              {result.dna && result.dna.startsWith("v1|") && (
                <Link href={`/studio?dna=${encodeURIComponent(result.dna)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm transition-all">
                  <Sparkles className="w-4 h-4" />
                  افتح في Studio لتعديل الـ DNA
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
