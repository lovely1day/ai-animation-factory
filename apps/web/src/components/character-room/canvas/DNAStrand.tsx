"use client";
// ============================================================
// DNAStrand — animated DNA segment nodes
// Shows all 22 segments as two rows of colored dots.
// Filled = bright + colored. Empty = dim gray.
// Hover = tooltip with Arabic label + value.
// ============================================================

import React, { useState } from "react";
import type { CharacterBuilderSegments } from "@ai-animation-factory/shared/types/character-room.types";

// ─── SEGMENT ROWS ──────────────────────────────────────────
// Row 1: structural face + eyes
// Row 2: jaw + hair + skin + body + era

type SegKey = keyof CharacterBuilderSegments;

interface NodeDef {
  key: SegKey;
  ar: string;
  color: string;      // Tailwind bg class (must be safelisted — used conditionally)
  glowColor: string;  // CSS box-shadow color
}

const ROW_1: NodeDef[] = [
  { key: "G",  ar: "جنس",   color: "bg-violet-500",  glowColor: "rgba(139,92,246,0.7)"  },
  { key: "FS", ar: "وجه",   color: "bg-violet-500",  glowColor: "rgba(139,92,246,0.7)"  },
  { key: "FH", ar: "جبهة",  color: "bg-violet-400",  glowColor: "rgba(167,139,250,0.6)" },
  { key: "ES", ar: "عين",   color: "bg-sky-500",     glowColor: "rgba(14,165,233,0.7)"  },
  { key: "EZ", ar: "حجم",   color: "bg-sky-400",     glowColor: "rgba(56,189,248,0.6)"  },
  { key: "EC", ar: "لون ع", color: "bg-sky-500",     glowColor: "rgba(14,165,233,0.7)"  },
  { key: "EP", ar: "قزح",   color: "bg-blue-400",    glowColor: "rgba(96,165,250,0.6)"  },
  { key: "EB", ar: "حاجب",  color: "bg-blue-500",    glowColor: "rgba(59,130,246,0.7)"  },
  { key: "NS", ar: "أنف",   color: "bg-violet-400",  glowColor: "rgba(167,139,250,0.6)" },
  { key: "NB", ar: "جسر",   color: "bg-violet-400",  glowColor: "rgba(167,139,250,0.6)" },
  { key: "LS", ar: "شفاه",  color: "bg-pink-500",    glowColor: "rgba(236,72,153,0.7)"  },
];

const ROW_2: NodeDef[] = [
  { key: "CH", ar: "ذقن",   color: "bg-indigo-500",  glowColor: "rgba(99,102,241,0.7)"  },
  { key: "JW", ar: "فك",    color: "bg-indigo-500",  glowColor: "rgba(99,102,241,0.7)"  },
  { key: "NK", ar: "رقبة",  color: "bg-indigo-400",  glowColor: "rgba(129,140,248,0.6)" },
  { key: "HS", ar: "شعر",   color: "bg-amber-500",   glowColor: "rgba(245,158,11,0.7)"  },
  { key: "HL", ar: "طول ش", color: "bg-amber-400",   glowColor: "rgba(251,191,36,0.6)"  },
  { key: "HC", ar: "لون ش", color: "bg-amber-500",   glowColor: "rgba(245,158,11,0.7)"  },
  { key: "SK", ar: "بشرة",  color: "bg-rose-400",    glowColor: "rgba(251,113,133,0.7)" },
  { key: "ST", ar: "درجة",  color: "bg-rose-400",    glowColor: "rgba(251,113,133,0.6)" },
  { key: "BD", ar: "جسم",   color: "bg-emerald-500", glowColor: "rgba(16,185,129,0.7)"  },
  { key: "HT", ar: "طول",   color: "bg-emerald-400", glowColor: "rgba(52,211,153,0.6)"  },
  { key: "ERA",ar: "حقبة",  color: "bg-yellow-500",  glowColor: "rgba(234,179,8,0.8)"   },
];

const SEGMENT_LABELS: Partial<Record<SegKey, string>> = {
  G: "الجنس", FS: "شكل الوجه", FH: "الجبهة", ES: "شكل العين",
  EZ: "حجم العين", EC: "لون العين", EP: "القزحية", EB: "الحاجب",
  NS: "الأنف", NB: "جسر الأنف", LS: "الشفاه", CH: "الذقن",
  JW: "الفك", NK: "الرقبة", HS: "الشعر", HL: "طول الشعر",
  HC: "لون الشعر", SK: "البشرة", ST: "درجة البشرة", BD: "الجسم",
  HT: "الطول", ERA: "الحقبة",
};

// ─── PROPS ─────────────────────────────────────────────────

interface DNAStrandProps {
  segments: CharacterBuilderSegments;
}

// ─── NODE ──────────────────────────────────────────────────

function StrandNode({ def, value }: { def: NodeDef; value: string | undefined }) {
  const [hovered, setHovered] = useState(false);
  const filled = value !== undefined;

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip */}
      {hovered && filled && (
        <div className="absolute bottom-full mb-1.5 z-50 pointer-events-none
                        bg-[#1e1e30] border border-white/15 rounded-lg px-2 py-1
                        text-center whitespace-nowrap shadow-xl">
          <p className="text-[10px] text-white/80 font-medium">{SEGMENT_LABELS[def.key]}</p>
          <p className="text-[9px] text-white/40 font-mono">{value}</p>
        </div>
      )}

      {/* Node dot */}
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          w-3.5 h-3.5 rounded-full border transition-all duration-300 cursor-default
          ${filled
            ? `${def.color} border-transparent scale-100`
            : "bg-transparent border-white/15 scale-90"
          }
        `}
        /* eslint-disable-next-line react/forbid-component-props */
        style={filled ? { boxShadow: `0 0 6px ${def.glowColor}` } : undefined}
        aria-label={SEGMENT_LABELS[def.key]}
      />
    </div>
  );
}

// ─── STRAND ROW ────────────────────────────────────────────

function StrandRow({ nodes, segments }: { nodes: NodeDef[]; segments: CharacterBuilderSegments }) {
  const filledCount = nodes.filter((n) => segments[n.key] !== undefined).length;
  const progress = (filledCount / nodes.length) * 100;

  return (
    <div className="space-y-1">
      {/* Connecting line + nodes */}
      <div className="relative flex items-center gap-1">
        {/* Background line */}
        <div className="absolute inset-y-[6px] left-1.5 right-1.5 h-px bg-white/10" />
        {/* Filled line */}
        <div
          className="absolute inset-y-[6px] left-1.5 h-px bg-white/20 transition-all duration-500"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{ width: `calc(${progress}% - 6px)` }}
        />
        {/* Nodes */}
        {nodes.map((def) => (
          <StrandNode key={def.key} def={def} value={segments[def.key] as string | undefined} />
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENT ─────────────────────────────────────────────

export function DNAStrand({ segments }: DNAStrandProps) {
  const total = ROW_1.length + ROW_2.length;
  const filled = [...ROW_1, ...ROW_2].filter((n) => segments[n.key] !== undefined).length;

  return (
    <div className="space-y-2 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-violet-400 font-mono font-medium tracking-wider">DNA</span>
          <span className="text-[10px] text-white/25">{filled}/{total}</span>
        </div>
        {filled > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(filled, 5) }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-violet-400/60" />
            ))}
          </div>
        )}
      </div>

      {/* Strands */}
      <StrandRow nodes={ROW_1} segments={segments} />
      <StrandRow nodes={ROW_2} segments={segments} />
    </div>
  );
}
