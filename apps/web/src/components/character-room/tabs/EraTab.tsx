"use client";
// ============================================================
// EraTab — الحقبة الزمنية
//
// Phase D: AI Auto-Dress
//   • Real ERA_CATALOG (59 eras) with group headers
//   • "ألبسني كأهل هذه الحقبة" button → POST /api/characters/auto-dress
//   • Suggestion panel: HS + HL + HC with Arabic labels + hex swatches
//   • "قبول الكل" → cb.setSegment for each key
// ============================================================

import React, { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, X } from "lucide-react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import type { EraCode } from "@ai-animation-factory/shared";
import { ERA_CATALOG, HAIR_STYLES, HAIR_LENGTHS, HAIR_COLORS } from "@ai-animation-factory/shared/data/character";

// ─── API URL ────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── ERA GROUPS ─────────────────────────────────────────────
// Each entry marks the first era code of a new group section.

const ERA_GROUP_STARTS: { label: string; code: string }[] = [
  { label: "ما قبل التاريخ",                    code: "ERA_CRETACEOUS"     },
  { label: "الشرق الأدنى القديم ومصر",           code: "ERA_SUMERIAN"       },
  { label: "اليونان وروما والبيزنط",             code: "ERA_ANCIENT_GREEK"  },
  { label: "آسيا القديمة والوسطى",              code: "ERA_ANCIENT_CHINA"  },
  { label: "الحضارات الأمريكية القديمة",         code: "ERA_MAYAN"          },
  { label: "الحضارة الإسلامية",                 code: "ERA_EARLY_ISLAM"    },
  { label: "أوروبا العصور الوسطى",               code: "ERA_DARK_AGES"      },
  { label: "العصر الحديث المبكر",               code: "ERA_RENAISSANCE"    },
  { label: "القرنان ١٨ و١٩",                     code: "ERA_1700"           },
  { label: "القرن العشرون",                      code: "ERA_1900"           },
  { label: "العصر الرقمي والحاضر",               code: "ERA_2000"           },
  { label: "المستقبل",                           code: "ERA_NEAR_FUTURE"    },
  { label: "الخيال والفنتازيا",                  code: "ERA_FANTASY_ANCIENT" },
];

const GROUP_STARTS = new Set(ERA_GROUP_STARTS.map((g) => g.code));
const GROUP_MAP    = new Map(ERA_GROUP_STARTS.map((g) => [g.code, g.label]));

// ─── SUGGESTION LABEL HELPERS ───────────────────────────────

function getHairLabel(key: "HS" | "HL" | "HC", code: string): { ar: string; hex?: string } | null {
  if (key === "HS") {
    const item = HAIR_STYLES.find((i) => i.code === code);
    return item ? { ar: item.visual.label.ar } : null;
  }
  if (key === "HL") {
    const item = HAIR_LENGTHS.find((i) => i.code === code);
    return item ? { ar: item.visual.label.ar } : null;
  }
  // HC — ColorCatalogItem has hex
  const item = HAIR_COLORS.find((i) => i.code === code);
  if (!item) return null;
  return { ar: item.visual.label.ar, hex: (item.visual as { hex?: string }).hex };
}

// ─── AUTO-DRESS TYPES ───────────────────────────────────────

interface AutoDressSuggestions { HS?: string; HL?: string; HC?: string }
type AutoDressStatus = "idle" | "loading" | "done" | "error";

// ─── PROPS ──────────────────────────────────────────────────

interface EraTabProps { cb: UseCharacterBuilder }

// ─── COMPONENT ──────────────────────────────────────────────

export function EraTab({ cb }: EraTabProps) {
  const selected = cb.getSegment("ERA") as EraCode | undefined;
  const gender   = cb.getSegment("G") as string | undefined;

  // Auto-Dress state
  const [adStatus,      setAdStatus]      = useState<AutoDressStatus>("idle");
  const [adSuggestions, setAdSuggestions] = useState<AutoDressSuggestions>({});
  const [adReason,      setAdReason]      = useState("");
  const [adError,       setAdError]       = useState("");

  const canAutoDress = Boolean(selected && gender);

  // ── Auto-Dress handler ──────────────────────────────────────

  async function handleAutoDress() {
    setAdStatus("loading");
    setAdSuggestions({});
    setAdReason("");
    setAdError("");

    try {
      const res  = await fetch(`${API_URL}/api/characters/auto-dress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dna: cb.exportDNA() }),
      });
      const data = await res.json() as {
        success?: boolean;
        suggestions?: AutoDressSuggestions;
        reason?: string;
        error?: string;
      };
      if (!res.ok || !data.success) throw new Error(data.error ?? "فشل الطلب");
      setAdSuggestions(data.suggestions ?? {});
      setAdReason(data.reason ?? "");
      setAdStatus("done");
    } catch (err: unknown) {
      setAdError(err instanceof Error ? err.message : "خطأ");
      setAdStatus("error");
    }
  }

  function acceptAll() {
    if (adSuggestions.HS) cb.setSegment("HS", adSuggestions.HS);
    if (adSuggestions.HL) cb.setSegment("HL", adSuggestions.HL);
    if (adSuggestions.HC) cb.setSegment("HC", adSuggestions.HC);
    setAdStatus("idle");
    setAdSuggestions({});
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4" dir="rtl">

      {/* ── Header + Auto-Dress button ─────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-sm font-semibold text-white">اختر الحقبة الزمنية</h3>
          <span className="text-[11px] text-white/30">تحدد الخلفية البيئية وأسلوب الشخصية</span>
        </div>

        <button
          type="button"
          onClick={handleAutoDress}
          disabled={!canAutoDress || adStatus === "loading"}
          title={!selected ? "اختر حقبة أولاً" : !gender ? "اختر الجنس أولاً" : "ألبسني كأهل هذه الحقبة"}
          className={`
            flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium
            border transition-all duration-200
            ${!canAutoDress || adStatus === "loading"
              ? "bg-white/5 text-white/25 border-white/5 cursor-not-allowed"
              : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30 hover:border-amber-500/50"
            }
          `}
        >
          {adStatus === "loading"
            ? <><Loader2 size={11} className="animate-spin" />جاري التحليل...</>
            : <><Sparkles size={11} />ألبسني كأهل العصر</>
          }
        </button>
      </div>

      {/* ── Auto-Dress result panel ────────────────────────── */}
      {adStatus === "done" && Object.keys(adSuggestions).length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 space-y-2.5">
          {/* Reason */}
          {adReason && (
            <p className="text-[11px] text-amber-200/70 leading-relaxed">{adReason}</p>
          )}

          {/* Suggestion rows */}
          <div className="space-y-1.5">
            {(["HS", "HL", "HC"] as const).map((key) => {
              const code     = adSuggestions[key];
              if (!code) return null;
              const resolved = getHairLabel(key, code);
              const keyLabel = key === "HS" ? "الشعر" : key === "HL" ? "طول الشعر" : "لون الشعر";
              return (
                <div key={key} className="flex items-center gap-2 text-[11px]">
                  <span className="text-white/40 shrink-0 w-16">{keyLabel}</span>
                  <span className="text-white/70 font-mono text-[10px] shrink-0">{code}</span>
                  {resolved && (
                    <>
                      {resolved.hex && (
                        // eslint-disable-next-line react/forbid-component-props
                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: resolved.hex }} />
                      )}
                      <span className="text-amber-200/80">{resolved.ar}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={acceptAll}
              className="flex items-center gap-1 px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50
                         text-amber-200 text-[11px] font-medium rounded-lg border border-amber-500/30
                         transition-colors"
            >
              <CheckCircle2 size={11} />
              قبول الكل
            </button>
            <button
              type="button"
              onClick={() => { setAdStatus("idle"); setAdSuggestions({}); }}
              className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10
                         text-white/40 hover:text-white/60 text-[11px] rounded-lg border border-white/10
                         transition-colors"
            >
              <X size={11} />
              تجاهل
            </button>
          </div>
        </div>
      )}

      {/* ── Error banner ───────────────────────────────────── */}
      {adStatus === "error" && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-red-400">{adError}</span>
          <button type="button" onClick={() => setAdStatus("idle")} aria-label="إغلاق">
            <X size={12} className="text-red-400/60 hover:text-red-400" />
          </button>
        </div>
      )}

      {/* ── Era grid ───────────────────────────────────────── */}
      <div className="space-y-3">
        {ERA_CATALOG.map((era) => {
          const isGroupStart = GROUP_STARTS.has(era.code);
          const groupLabel   = isGroupStart ? GROUP_MAP.get(era.code) : null;
          const isSelected   = selected === era.code;

          return (
            <React.Fragment key={era.code}>
              {/* Group header */}
              {isGroupStart && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider whitespace-nowrap" aria-hidden="true">
                    {groupLabel}
                  </span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
              )}

              {/* Era card (inline — renders inside the fragment, but we want a grid) */}
              {/* We use a wrapper approach: collect cards per group and render a grid.
                  Simpler: just render cards without the fragment wrapper for grid layout.
                  The group headers break the grid, so we use flex-wrap instead. */}
              <EraCard
                code={era.code as EraCode}
                labelAr={era.visual.label.ar}
                yearRange={era.yearRange}
                isSelected={isSelected}
                onSelect={() => cb.setEra(era.code as EraCode)}
              />
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}

// ─── ERA CARD ───────────────────────────────────────────────

interface EraCardProps {
  code: EraCode;
  labelAr: string;
  yearRange: string;
  isSelected: boolean;
  onSelect: () => void;
}

function EraCard({ labelAr, yearRange, isSelected, onSelect }: EraCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-right transition-all
        ${isSelected
          ? "border-violet-500 bg-violet-500/15"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
        }
      `}
    >
      {/* Selection indicator */}
      <div className={`
        w-2 h-2 rounded-full shrink-0 transition-all
        ${isSelected ? "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" : "bg-white/15"}
      `} />

      {/* Labels */}
      <div className="flex-1 min-w-0 text-right">
        <p className={`text-xs font-medium truncate ${isSelected ? "text-violet-200" : "text-white/70"}`}>
          {labelAr}
        </p>
        <p className="text-[10px] text-white/30 truncate">{yearRange}</p>
      </div>
    </button>
  );
}
