"use client";
/**
 * CharacterBuilderEmbed
 *
 * Lightweight DNA builder for the standalone character-studio app.
 * Uses @ai-animation-factory/shared for DNA encode/decode.
 *
 * The full CharacterRoom (LivingCanvas + 9 tabs) will be migrated here
 * in a follow-up session. For now this gives a fully functional DNA
 * editor + save flow.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Dna, Save, Copy, Check, RotateCcw, Upload, Loader2, User, Sparkles } from "lucide-react";
import { decodeDNA, encodeDNA } from "@ai-animation-factory/shared";

// ── DNA segment catalogue (subset for quick builder) ─────────────
const SEGMENTS = [
  {
    key: "G", label: "الجنس", options: [
      { code: "M", label: "ذكر" }, { code: "F", label: "أنثى" }
    ]
  },
  {
    key: "FS", label: "شكل الوجه", options: [
      { code: "FS001", label: "بيضاوي" }, { code: "FS002", label: "دائري" },
      { code: "FS003", label: "مربع" }, { code: "FS004", label: "قلبي" },
      { code: "FS005", label: "مستطيل" }, { code: "FS006", label: "ماسي" },
    ]
  },
  {
    key: "ES", label: "شكل العيون", options: [
      { code: "ES001", label: "لوزي" }, { code: "ES002", label: "دائري" },
      { code: "ES003", label: "مطوي" }, { code: "ES004", label: "مائل لأعلى" },
      { code: "ES005", label: "مائل لأسفل" }, { code: "ES006", label: "غائر" },
    ]
  },
  {
    key: "EC", label: "لون العيون", options: [
      { code: "EC001", label: "بني" }, { code: "EC002", label: "أسود" },
      { code: "EC003", label: "أزرق" }, { code: "EC004", label: "أخضر" },
      { code: "EC005", label: "بندقي" }, { code: "EC006", label: "رمادي" },
      { code: "EC007", label: "عسلي" },
    ]
  },
  {
    key: "HS", label: "نوع الشعر", options: [
      { code: "HS001", label: "مستقيم" }, { code: "HS002", label: "متموج" },
      { code: "HS003", label: "مجعد" }, { code: "HS004", label: "أفرو" },
      { code: "HS005", label: "ضفائر" }, { code: "HS006", label: "بوب" },
    ]
  },
  {
    key: "HL", label: "طول الشعر", options: [
      { code: "HL001", label: "أصلع" }, { code: "HL002", label: "قصير" },
      { code: "HL003", label: "متوسط" }, { code: "HL004", label: "طويل" },
      { code: "HL005", label: "طويل جداً" },
    ]
  },
  {
    key: "HC", label: "لون الشعر", options: [
      { code: "HC001", label: "أسود" }, { code: "HC002", label: "بني داكن" },
      { code: "HC003", label: "بني فاتح" }, { code: "HC004", label: "أشقر" },
      { code: "HC005", label: "أحمر" }, { code: "HC006", label: "رمادي" },
      { code: "HC007", label: "أبيض" },
    ]
  },
  {
    key: "SK", label: "لون البشرة", options: [
      { code: "SK001", label: "فاتح جداً" }, { code: "SK002", label: "فاتح" },
      { code: "SK003", label: "متوسط" }, { code: "SK004", label: "سمراء" },
      { code: "SK005", label: "بنية" }, { code: "SK006", label: "داكن" },
    ]
  },
  {
    key: "BT", label: "نوع الجسم", options: [
      { code: "BT001", label: "نحيف" }, { code: "BT002", label: "رياضي" },
      { code: "BT003", label: "متوسط" }, { code: "BT004", label: "منحنيات" },
      { code: "BT005", label: "ضخم" },
    ]
  },
  {
    key: "ERA", label: "الحقبة / الأسلوب", options: [
      { code: "ERA_MOD", label: "عصري" }, { code: "ERA_VIN", label: "كلاسيكي" },
      { code: "ERA_FUT", label: "مستقبلي" }, { code: "ERA_MED", label: "قروسطي" },
      { code: "ERA_1920", label: "عشرينيات" }, { code: "ERA_1950", label: "خمسينيات" },
      { code: "ERA_1980", label: "ثمانينيات" }, { code: "ERA_FAR", label: "مستقبل بعيد" },
    ]
  },
] as const;

// ── Component ─────────────────────────────────────────────────────
interface Props { characterId?: string; initialDNA?: string; }

export default function CharacterBuilderEmbed({ characterId, initialDNA }: Props) {
  const [name, setName]         = useState("شخصية جديدة");
  const [dna, setDna]           = useState(initialDNA ?? "v1|G:M");
  const [copied, setCopied]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(!!characterId);

  // Parse current segments
  const parsed = decodeDNA(dna);
  const segs: Record<string, string> = {};
  if (parsed) {
    for (const [k, v] of Object.entries(parsed.segments)) {
      if (v) segs[k] = v as string;
    }
  }

  // Load existing character
  useEffect(() => {
    if (!characterId) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(`${apiBase}/api/characters/${characterId}`)
      .then(r => r.json())
      .then(d => {
        if (d.character) {
          setName(d.character.name ?? "");
          setDna(d.character.dna ?? "v1|G:M");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [characterId]);

  // Load DNA from URL param (from extractor)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const urlDna = url.searchParams.get("dna");
    if (urlDna) setDna(decodeURIComponent(urlDna));
  }, []);

  const setSegment = useCallback((key: string, value: string) => {
    const current = decodeDNA(dna) ?? { version: "v1" as const, segments: {} };
    const newSegs = { ...current.segments, [key]: value };
    setDna(encodeDNA({ version: "v1", segments: newSegs as Record<string, string> }));
    setSaved(false);
  }, [dna]);

  const reset = () => { setDna("v1|G:M"); setSaved(false); };

  const copyDna = () => {
    navigator.clipboard.writeText(dna);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    setSaving(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    try {
      const url = characterId
        ? `${apiBase}/api/characters/${characterId}`
        : `${apiBase}/api/characters`;
      const method = characterId ? "PATCH" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dna }),
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-white/30">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">جاري تحميل الشخصية…</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left — Preview + DNA */}
      <div className="space-y-4">
        {/* SVG placeholder — LivingCanvas will replace this */}
        <div className="glass rounded-2xl aspect-[3/4] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-pink-900/10" />
          <div className="relative flex flex-col items-center gap-3 text-white/20">
            <User className="w-16 h-16" />
            <p className="text-xs">معاينة مباشرة</p>
            <p className="text-[10px] text-white/15">LivingCanvas — قريباً</p>
          </div>
        </div>

        {/* Name */}
        <input
          value={name}
          onChange={e => { setName(e.target.value); setSaved(false); }}
          placeholder="اسم الشخصية"
          dir="rtl"
          className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/40"
        />

        {/* DNA display */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Dna className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] text-white/50">DNA</span>
            </div>
            <button onClick={copyDna}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/70 transition-colors">
              {copied ? <><Check className="w-3 h-3 text-emerald-400" /> تم</> : <><Copy className="w-3 h-3" /> نسخ</>}
            </button>
          </div>
          <p className="text-[10px] font-mono text-violet-300/80 break-all leading-relaxed">{dna}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl btn-ghost text-xs flex-1 justify-center">
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة
          </button>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs flex-1 justify-center transition-all
              ${saved ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400" : "btn-primary"}`}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "…" : saved ? "محفوظ" : "حفظ"}
          </button>
        </div>
      </div>

      {/* Right — Segment selectors */}
      <div className="lg:col-span-2 space-y-4">
        {/* Import from extractor */}
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-white/40 flex-1">
            عندك صورة؟ <a href="/extract" className="text-amber-400 hover:text-amber-300">استخرج DNA تلقائياً</a> ثم ارجع هنا للتعديل
          </p>
          <a href="/extract"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors shrink-0">
            <Upload className="w-3 h-3" />
            رفع صورة
          </a>
        </div>

        {/* Segments grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SEGMENTS.map(seg => {
            const currentVal = segs[seg.key];
            return (
              <div key={seg.key} className="glass rounded-xl p-3">
                <p className="text-[11px] text-white/40 mb-2 flex items-center justify-between">
                  <span>{seg.label}</span>
                  <span className="font-mono text-white/20">{seg.key}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {seg.options.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => setSegment(seg.key, opt.code)}
                      className={`px-2 py-1 rounded-lg text-[11px] transition-all
                        ${currentVal === opt.code
                          ? "bg-violet-500/25 border border-violet-500/40 text-violet-300"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
