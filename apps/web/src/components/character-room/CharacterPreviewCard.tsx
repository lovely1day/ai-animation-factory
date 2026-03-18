"use client";
// ============================================================
// CharacterPreviewCard — Left panel preview
// Shows real catalog labels + color swatches + Generate Preview
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { User, Dna, CheckCircle2, Circle, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import type { CatalogItem } from "@ai-animation-factory/shared/types/character-room.types";
import {
  FACE_SHAPES, FOREHEAD_TYPES,
  EYE_SHAPES, EYE_SIZES, EYE_COLORS, IRIS_PATTERNS, EYEBROW_SHAPES,
  NOSE_SHAPES, NOSE_BRIDGES, LIP_SHAPES,
  CHIN_SHAPES, JAW_TYPES, NECK_TYPES,
  HAIR_STYLES, HAIR_LENGTHS, HAIR_COLORS,
  SKIN_TONES, SKIN_UNDERTONES,
  BODY_TYPES,
  ERA_CATALOG,
} from "@ai-animation-factory/shared/data/character";

// ─── API URL ────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── CATALOG LOOKUP MAP ────────────────────────────────────

const CATALOG_MAP: Record<string, readonly CatalogItem[]> = {
  FS: FACE_SHAPES,   FH: FOREHEAD_TYPES,
  ES: EYE_SHAPES,    EZ: EYE_SIZES,
  EC: EYE_COLORS as unknown as readonly CatalogItem[],
  EP: IRIS_PATTERNS, EB: EYEBROW_SHAPES,
  NS: NOSE_SHAPES,   NB: NOSE_BRIDGES,  LS: LIP_SHAPES,
  CH: CHIN_SHAPES,   JW: JAW_TYPES,     NK: NECK_TYPES,
  HS: HAIR_STYLES,   HL: HAIR_LENGTHS,
  HC: HAIR_COLORS as unknown as readonly CatalogItem[],
  SK: SKIN_TONES as unknown as readonly CatalogItem[],
  ST: SKIN_UNDERTONES as unknown as readonly CatalogItem[],
  BD: BODY_TYPES,
};

const COLOR_SEGMENTS = new Set(["EC", "HC", "SK", "ST"]);

// ─── LABEL HELPER ──────────────────────────────────────────

interface LabelResult { ar: string; hex?: string }

function getLabel(key: string, code: string | undefined): LabelResult | null {
  if (!code) return null;
  if (key === "G")   return { ar: code === "M" ? "ذكر" : "أنثى" };
  if (key === "HT")  return { ar: `${code} سم` };
  if (key === "ERA") {
    const era = ERA_CATALOG.find((e) => e.code === code);
    return era ? { ar: era.visual.label.ar } : null;
  }
  const catalog = CATALOG_MAP[key];
  if (!catalog) return null;
  const item = catalog.find((c) => c.code === code);
  if (!item) return null;
  return {
    ar: item.visual.label.ar,
    hex: COLOR_SEGMENTS.has(key) ? (item.visual as { hex?: string }).hex : undefined,
  };
}

// ─── COMPLETION CONFIG ─────────────────────────────────────

const REQUIRED_SEGMENTS = ["G", "FS", "ES", "EC", "HC", "SK", "BD"] as const;
const OPTIONAL_SEGMENTS = [
  "FH", "EZ", "EP", "EB", "NS", "NB", "LS",
  "CH", "JW", "NK", "HL", "ST", "HT", "ERA",
] as const;

const SEGMENT_LABELS: Record<string, string> = {
  G:  "الجنس",   FS: "شكل الوجه", FH: "الجبهة",
  ES: "العيون",  EZ: "حجم العين", EC: "لون العين",
  EP: "القزحية", EB: "الحاجب",   NS: "الأنف",
  NB: "جسر الأنف", LS: "الشفاه",  CH: "الذقن",
  JW: "الفك",   NK: "الرقبة",   HS: "الشعر",
  HL: "طول الشعر", HC: "لون الشعر", SK: "البشرة",
  ST: "درجة البشرة", BD: "الجسم", HT: "الطول",
  ERA: "الحقبة",
};

// ─── PREVIEW STATE ─────────────────────────────────────────

type PreviewStatus = "idle" | "loading" | "done" | "error";

// ─── PROPS ─────────────────────────────────────────────────

interface CharacterPreviewCardProps {
  cb: UseCharacterBuilder;
}

// ─── COMPONENT ─────────────────────────────────────────────

export function CharacterPreviewCard({ cb }: CharacterPreviewCardProps) {
  const { segments, exportDNA, name } = cb;

  // Preview state
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("idle");
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [previewError, setPreviewError]   = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptIdRef = useRef<string | null>(null);

  // Clear preview when DNA changes significantly
  const dnaString = exportDNA();
  const prevDnaRef = useRef(dnaString);
  useEffect(() => {
    if (prevDnaRef.current !== dnaString && previewStatus === "done") {
      setPreviewStatus("idle");
      setPreviewUrl(null);
    }
    prevDnaRef.current = dnaString;
  }, [dnaString, previewStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Generate handler ──────────────────────────────────────

  async function handleGenerate() {
    if (pollRef.current) clearInterval(pollRef.current);
    setPreviewStatus("loading");
    setPreviewUrl(null);
    setPreviewError(null);

    try {
      const submitRes = await fetch(`${API_URL}/api/characters/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dna: dnaString }),
      });
      const submitData = await submitRes.json() as { success?: boolean; prompt_id?: string; error?: string };

      if (!submitRes.ok || !submitData.prompt_id) {
        throw new Error(submitData.error || "فشل إرسال الطلب");
      }

      promptIdRef.current = submitData.prompt_id;
      startPolling(submitData.prompt_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      setPreviewError(msg);
      setPreviewStatus("error");
    }
  }

  // ── Polling ───────────────────────────────────────────────

  function startPolling(promptId: string) {
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 2 min max (2s interval)

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(pollRef.current!);
        setPreviewError("انتهت المهلة — جرب مجدداً");
        setPreviewStatus("error");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/characters/preview/${promptId}`);
        const data = await res.json() as {
          status: "pending" | "completed" | "failed";
          image_url?: string | null;
          error?: string | null;
        };

        if (data.status === "completed" && data.image_url) {
          clearInterval(pollRef.current!);
          setPreviewUrl(data.image_url);
          setPreviewStatus("done");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setPreviewError(data.error ?? "فشل التوليد");
          setPreviewStatus("error");
        }
        // still "pending" → keep polling
      } catch {
        // network hiccup — keep polling
      }
    }, 2000);
  }

  // ── Completion % ─────────────────────────────────────────

  const requiredFilled = REQUIRED_SEGMENTS.filter(
    (k) => segments[k as keyof typeof segments] !== undefined
  ).length;
  const optionalFilled = OPTIONAL_SEGMENTS.filter(
    (k) => segments[k as keyof typeof segments] !== undefined
  ).length;
  const totalFilled   = requiredFilled + optionalFilled;
  const totalSegments = REQUIRED_SEGMENTS.length + OPTIONAL_SEGMENTS.length;
  const completionPct = Math.round((totalFilled / totalSegments) * 100);

  const shortDNA = dnaString.length > 42 ? dnaString.slice(0, 42) + "…" : dnaString;
  const canGenerate = previewStatus !== "loading";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Avatar / Preview image ─────────────────────── */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-violet-900/30 to-[#0c0c10]
                      border border-white/10 aspect-[3/4] flex items-center justify-center">

        {/* Generated image */}
        {previewStatus === "done" && previewUrl && (
          <Image
            src={previewUrl}
            alt={name || "معاينة الشخصية"}
            fill
            className="object-cover object-top"
            unoptimized
          />
        )}

        {/* Loading overlay */}
        {previewStatus === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          bg-black/60 backdrop-blur-sm gap-3">
            <Loader2 size={28} className="text-violet-400 animate-spin" />
            <span className="text-[11px] text-white/60">جاري التوليد...</span>
          </div>
        )}

        {/* Error overlay */}
        {previewStatus === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          bg-black/60 backdrop-blur-sm gap-2 px-3 text-center">
            <span className="text-[11px] text-red-400">{previewError}</span>
          </div>
        )}

        {/* Idle placeholder */}
        {previewStatus === "idle" && (
          <div className="flex flex-col items-center gap-2 text-white/20">
            <User size={48} strokeWidth={1} />
            <span className="text-xs">معاينة الشخصية</span>
          </div>
        )}

        {/* Completion badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm
                        border border-white/10 rounded-full px-2 py-0.5
                        flex items-center gap-1.5 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-[11px] text-white/70">{completionPct}%</span>
        </div>
      </div>

      {/* ── Name ───────────────────────────────────────── */}
      {name && (
        <p className="text-center text-sm font-medium text-white/80 truncate px-2">
          {name}
        </p>
      )}

      {/* ── Generate / Regenerate button ───────────────── */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`
          flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium
          transition-all duration-200
          ${previewStatus === "loading"
            ? "bg-white/5 text-white/30 cursor-not-allowed"
            : previewStatus === "done"
              ? "bg-white/10 hover:bg-violet-600/30 text-white/60 hover:text-white border border-white/10"
              : "bg-violet-600 hover:bg-violet-500 text-white"
          }
        `}
      >
        {previewStatus === "loading" ? (
          <><Loader2 size={13} className="animate-spin" />جاري التوليد...</>
        ) : previewStatus === "done" ? (
          <><RotateCcw size={13} />إعادة التوليد</>
        ) : (
          <><Sparkles size={13} />توليد معاينة</>
        )}
      </button>

      {/* ── Completion bar ─────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-white/40">
          <span>اكتمال الشخصية</span>
          <span>{totalFilled} / {totalSegments}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          {/* eslint-disable-next-line react/forbid-component-props */}
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* ── Required segments checklist ────────────────── */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-white/30 uppercase tracking-wider">أساسية</p>
        {REQUIRED_SEGMENTS.map((key) => {
          const rawVal = segments[key as keyof typeof segments] as string | undefined;
          const filled = rawVal !== undefined;
          const resolved = filled ? getLabel(key, rawVal) : null;

          return (
            <div key={key} className="flex items-center gap-2 min-w-0">
              {filled
                ? <CheckCircle2 size={12} className="text-violet-400 shrink-0" />
                : <Circle       size={12} className="text-white/20 shrink-0" />
              }
              <span className={`text-[11px] shrink-0 ${filled ? "text-white/60" : "text-white/25"}`}>
                {SEGMENT_LABELS[key]}
              </span>
              {resolved && (
                <span className="mr-auto flex items-center gap-1 min-w-0">
                  {resolved.hex && (
                    // eslint-disable-next-line react/forbid-component-props, @typescript-eslint/no-unsafe-assignment
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                      style={{ background: resolved.hex }}
                    />
                  )}
                  <span className="text-[10px] text-white/50 truncate" dir="rtl">
                    {resolved.ar}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Optional highlights (filled only) ──────────── */}
      {optionalFilled > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-white/30 uppercase tracking-wider">
            إضافية ({optionalFilled})
          </p>
          {OPTIONAL_SEGMENTS.filter(
            (k) => segments[k as keyof typeof segments] !== undefined
          ).slice(0, 5).map((key) => {
            const rawVal = segments[key as keyof typeof segments] as string | undefined;
            const resolved = getLabel(key, rawVal);
            return (
              <div key={key} className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={12} className="text-fuchsia-400/60 shrink-0" />
                <span className="text-[11px] text-white/40 shrink-0">{SEGMENT_LABELS[key]}</span>
                {resolved && (
                  <span className="mr-auto flex items-center gap-1 min-w-0">
                    {resolved.hex && (
                      // eslint-disable-next-line react/forbid-component-props, @typescript-eslint/no-unsafe-assignment
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ background: resolved.hex }}
                      />
                    )}
                    <span className="text-[10px] text-white/40 truncate" dir="rtl">
                      {resolved.ar}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
          {optionalFilled > 5 && (
            <p className="text-[10px] text-white/20 text-center">
              +{optionalFilled - 5} أخرى...
            </p>
          )}
        </div>
      )}

      {/* ── DNA string ─────────────────────────────────── */}
      <div className="mt-auto">
        <div className="bg-black/30 border border-white/10 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <Dna size={11} className="text-violet-400 shrink-0" />
            <span className="text-[10px] text-violet-400 font-medium">DNA</span>
          </div>
          <p className="text-[9px] font-mono text-white/30 break-all leading-relaxed">
            {shortDNA}
          </p>
        </div>
      </div>

    </div>
  );
}
