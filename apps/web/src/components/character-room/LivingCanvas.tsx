"use client";
// ============================================================
// LivingCanvas — Phase B Living Canvas
//
// Layout:
//   ┌─────────────────────────────────┐
//   │  Era-tinted background          │
//   │   ┌─────────────────────────┐   │
//   │   │  Avatar + SVG Hotspots  │   │
//   │   └─────────────────────────┘   │
//   │  Name + Generate button         │
//   │  DNA Strand                     │
//   │  Completion bar                 │
//   └─────────────────────────────────┘
//
// SVG Hotspots (4 zones):
//   HAIR  → "hair" tab
//   FACE  → "face" tab
//   JAW   → "jaw"  tab
//   BODY  → "body" tab
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { User, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { DNAStrand }       from "./canvas/DNAStrand";
import { EraEnvironment }  from "./canvas/EraEnvironment";

// ─── HOTSPOT ZONES ─────────────────────────────────────────
// SVG viewBox="0 0 100 133" (matches 3:4 ratio)

type TabId = "face" | "eye" | "jaw" | "hair" | "skin" | "body" | "makeup" | "wardrobe" | "era";

interface HotspotZone {
  id: string;
  labelAr: string;
  tab: TabId;
  // SVG rect
  x: number; y: number; w: number; h: number; rx: number;
  // Hover color (rgba)
  hoverColor: string;
}

const HOTSPOT_ZONES: HotspotZone[] = [
  { id: "hair",  labelAr: "الشعر",  tab: "hair",  x: 12, y: 1,  w: 76, h: 24, rx: 38,  hoverColor: "rgba(245,158,11,0.22)" },
  { id: "face",  labelAr: "الوجه",  tab: "face",  x: 17, y: 22, w: 66, h: 20, rx: 10,  hoverColor: "rgba(139,92,246,0.22)" },
  { id: "jaw",   labelAr: "الفك",   tab: "jaw",   x: 20, y: 40, w: 60, h: 13, rx: 8,   hoverColor: "rgba(99,102,241,0.22)" },
  { id: "body",  labelAr: "الجسم",  tab: "body",  x: 10, y: 52, w: 80, h: 45, rx: 14,  hoverColor: "rgba(16,185,129,0.20)" },
];

// ─── API URL ────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── GENERATE PREVIEW HOOK ─────────────────────────────────

type PreviewStatus = "idle" | "loading" | "done" | "error";

function useGeneratePreview(dnaString: string) {
  const [status,    setStatus]    = useState<PreviewStatus>("idle");
  const [imageUrl,  setImageUrl]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDnaRef  = useRef(dnaString);

  // Reset preview when DNA changes after a successful generation
  useEffect(() => {
    if (prevDnaRef.current !== dnaString && status === "done") {
      setStatus("idle");
      setImageUrl(null);
    }
    prevDnaRef.current = dnaString;
  }, [dnaString, status]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function generate() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus("loading");
    setImageUrl(null);
    setError(null);

    try {
      const res  = await fetch(`${API_URL}/api/characters/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dna: dnaString }),
      });
      const data = await res.json() as { success?: boolean; prompt_id?: string; error?: string };
      if (!res.ok || !data.prompt_id) throw new Error(data.error ?? "فشل الإرسال");
      startPolling(data.prompt_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ");
      setStatus("error");
    }
  }

  function startPolling(promptId: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      if (++attempts > 60) {
        clearInterval(pollRef.current!);
        setError("انتهت المهلة");
        setStatus("error");
        return;
      }
      try {
        const res  = await fetch(`${API_URL}/api/characters/preview/${promptId}`);
        const data = await res.json() as { status: string; image_url?: string | null; error?: string | null };
        if (data.status === "completed" && data.image_url) {
          clearInterval(pollRef.current!);
          setImageUrl(data.image_url);
          setStatus("done");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setError(data.error ?? "فشل التوليد");
          setStatus("error");
        }
      } catch { /* keep polling */ }
    }, 2000);
  }

  return { status, imageUrl, error, generate };
}

// ─── PROPS ─────────────────────────────────────────────────

interface LivingCanvasProps {
  cb: UseCharacterBuilder;
}

// ─── COMPONENT ─────────────────────────────────────────────

export function LivingCanvas({ cb }: LivingCanvasProps) {
  const { segments, exportDNA, name, setActiveTab } = cb;

  const dnaString = exportDNA();
  const eraCode   = segments.ERA as string | undefined;

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const { status, imageUrl, error, generate } = useGeneratePreview(dnaString);

  // Completion
  const REQUIRED = ["G", "FS", "ES", "EC", "HC", "SK", "BD"] as const;
  const ALL_KEYS  = ["G","FS","FH","ES","EZ","EC","EP","EB","NS","NB","LS","CH","JW","NK","HS","HL","HC","SK","ST","BD","HT","ERA"] as const;
  const filled    = ALL_KEYS.filter((k) => segments[k as keyof typeof segments] !== undefined).length;
  const pct       = Math.round((filled / ALL_KEYS.length) * 100);
  const reqFilled = REQUIRED.filter((k) => segments[k] !== undefined).length;

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-3 relative">

      {/* ── Avatar frame with era background ──────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[3/4]
                      bg-[#0c0c10]">

        {/* Era Environment — atmospheric background layers */}
        <EraEnvironment eraCode={eraCode} />

        {/* Depth vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10]/80 via-transparent to-transparent z-[1]" />

        {/* Generated image */}
        {status === "done" && imageUrl && (
          <Image
            src={imageUrl}
            alt={name || "معاينة"}
            fill
            className="object-cover object-top z-[1]"
            unoptimized
          />
        )}

        {/* Idle placeholder */}
        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center z-[1]">
            <User size={52} strokeWidth={0.8} className="text-white/15" />
          </div>
        )}

        {/* Loading overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center
                          bg-black/50 backdrop-blur-sm gap-3">
            <Loader2 size={30} className="text-violet-400 animate-spin" />
            <span className="text-[11px] text-white/50">جاري التوليد...</span>
          </div>
        )}

        {/* Error overlay */}
        {status === "error" && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center
                          bg-black/50 backdrop-blur-sm px-4 gap-2">
            <span className="text-[11px] text-red-400 text-center">{error}</span>
          </div>
        )}

        {/* ── SVG Hotspot overlay ──────────────────────── */}
        <svg
          viewBox="0 0 100 133"
          className="absolute inset-0 w-full h-full z-[3] cursor-pointer"
          aria-hidden="true"
        >
          {HOTSPOT_ZONES.map((zone) => (
            <rect
              key={zone.id}
              x={zone.x} y={zone.y}
              width={zone.w} height={zone.h}
              rx={zone.rx}
              fill={hoveredZone === zone.id ? zone.hoverColor : "transparent"}
              stroke={hoveredZone === zone.id ? "rgba(255,255,255,0.15)" : "transparent"}
              strokeWidth="0.5"
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => setActiveTab(zone.tab)}
            />
          ))}
        </svg>

        {/* Hotspot label tooltip */}
        {hoveredZone && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[4]
                          bg-black/70 backdrop-blur-sm border border-white/15
                          rounded-full px-3 py-1 pointer-events-none">
            <span className="text-[11px] text-white/80 whitespace-nowrap">
              {HOTSPOT_ZONES.find((z) => z.id === hoveredZone)?.labelAr}
            </span>
          </div>
        )}

        {/* Completion badge */}
        <div className="absolute top-2 right-2 z-[4] bg-black/60 backdrop-blur-sm
                        border border-white/10 rounded-full px-2 py-0.5
                        flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${pct === 100 ? "bg-green-400" : "bg-violet-400"}`} />
          <span className="text-[11px] text-white/70">{pct}%</span>
        </div>

        {/* Era badge (bottom-left) */}
        {eraCode && (
          <button
            type="button"
            onClick={() => setActiveTab("era")}
            className="absolute bottom-2 left-2 z-[4] bg-black/60 backdrop-blur-sm
                       border border-white/10 rounded-full px-2 py-0.5
                       text-[10px] text-amber-400/80 hover:text-amber-300
                       transition-colors cursor-pointer"
          >
            {ERA_LABELS[eraCode] ?? eraCode.replace("ERA_", "")}
          </button>
        )}
      </div>

      {/* ── Name ─────────────────────────────────────── */}
      {name && (
        <p className="text-center text-sm font-medium text-white/80 truncate px-2 -mt-1">
          {name}
        </p>
      )}

      {/* ── Generate button ───────────────────────────── */}
      <button
        type="button"
        onClick={generate}
        disabled={status === "loading"}
        className={`
          flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-medium
          transition-all duration-200 border
          ${status === "loading"
            ? "bg-white/5 text-white/30 border-white/5 cursor-not-allowed"
            : status === "done"
              ? "bg-white/5 hover:bg-violet-600/20 text-white/50 hover:text-white border-white/10"
              : reqFilled < 3
                ? "bg-white/5 text-white/30 border-white/5 border-dashed cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white border-transparent shadow-lg shadow-violet-900/40"
          }
        `}
      >
        {status === "loading" ? (
          <><Loader2 size={13} className="animate-spin" />جاري التوليد...</>
        ) : status === "done" ? (
          <><RotateCcw size={13} />إعادة التوليد</>
        ) : (
          <><Sparkles size={13} />{reqFilled < 3 ? "أكمل الأساسيات أولاً" : "توليد معاينة"}</>
        )}
      </button>

      {/* ── Completion bar ────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/25">
          <span>اكتمال الشخصية</span>
          <span>{filled} / {ALL_KEYS.length}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          {/* eslint-disable-next-line react/forbid-component-props */}
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── DNA Strand ────────────────────────────────── */}
      <div className="bg-black/20 rounded-xl border border-white/5 p-3">
        <DNAStrand segments={segments} />
      </div>

    </div>
  );
}

// ─── ERA SHORT LABELS ──────────────────────────────────────
// Short Arabic labels for the era badge (6 chars max)

const ERA_LABELS: Record<string, string> = {
  ERA_CRETACEOUS: "طباشيري", ERA_ICE_AGE: "جليدي", ERA_PREHISTORIC: "قديم",
  ERA_ATLANTIS: "أطلنطس",
  ERA_SUMERIAN: "سومر", ERA_BABYLONIAN: "بابل", ERA_ASSYRIAN: "آشور", ERA_PERSIAN: "فارس",
  ERA_EGYPT_OLD: "مصر ق", ERA_EGYPT_NEW: "مصر ج",
  ERA_ANCIENT_GREEK: "يونان", ERA_ROMAN_REPUBLIC: "رومان", ERA_ROMAN_EMPIRE: "روما",
  ERA_BYZANTINE: "بيزنط",
  ERA_ANCIENT_CHINA: "صين ق", ERA_TANG_DYNASTY: "تانغ", ERA_MING_DYNASTY: "مينغ",
  ERA_FEUDAL_JAPAN: "ياباني", ERA_ANCIENT_INDIA: "هند ق", ERA_MONGOL: "مغول",
  ERA_MAYAN: "مايا", ERA_AZTEC: "أزتيك", ERA_INCA: "إنكا",
  ERA_EARLY_ISLAM: "صدر إسلام", ERA_ISLAMIC_GOLDEN: "ذهبي", ERA_OTTOMAN: "عثماني",
  ERA_ANDALUSIAN: "أندلس",
  ERA_DARK_AGES: "مظلمة", ERA_VIKING: "فايكنغ", ERA_HIGH_MEDIEVAL: "وسطى",
  ERA_CRUSADES: "صليبي", ERA_LATE_MEDIEVAL: "أواخر و",
  ERA_RENAISSANCE: "نهضة", ERA_EXPLORATION: "استكشاف", ERA_BAROQUE: "باروك",
  ERA_1700: "١٧٠٠م", ERA_1800: "١٨٠٠م", ERA_1850: "١٨٥٠م", ERA_1900: "١٩٠٠م",
  ERA_1920: "عشرينيات", ERA_1930: "ثلاثينيات", ERA_1940: "أربعينيات",
  ERA_1950: "خمسينيات", ERA_1960: "ستينيات", ERA_1970: "سبعينيات",
  ERA_1980: "ثمانينيات", ERA_1990: "تسعينيات", ERA_2000: "ألفينيات",
  ERA_2010: "عشرة", ERA_2024: "الحاضر",
  ERA_NEAR_FUTURE: "مستقبل ق", ERA_FAR_FUTURE: "مستقبل ب", ERA_SPACE_AGE: "فضاء",
  ERA_FANTASY_ANCIENT: "فنتازيا ق", ERA_FANTASY_MEDIEVAL: "فنتازيا و",
  ERA_FANTASY_STEAMPUNK: "ستيمبنك", ERA_FANTASY_CYBERPUNK: "سايبر",
  ERA_FANTASY_POST_APOC: "كارثة", ERA_FANTASY_MYTHOLOGICAL: "أساطير",
};
