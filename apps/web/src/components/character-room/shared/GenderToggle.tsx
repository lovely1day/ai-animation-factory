"use client";
// ============================================================
// GenderToggle — M / F selector
// ============================================================

import React from "react";
import type { GenderCode } from "@ai-animation-factory/shared";

interface GenderToggleProps {
  value: GenderCode | undefined;
  onChange: (gender: GenderCode) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="flex gap-3">
      {(["M", "F"] as GenderCode[]).map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`
            flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150 border
            ${value === g
              ? g === "M"
                ? "bg-blue-600/20 border-blue-500 text-blue-300"
                : "bg-pink-600/20 border-pink-500 text-pink-300"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10"
            }
          `}
        >
          {g === "M" ? "♂  ذكر" : "♀  أنثى"}
        </button>
      ))}
    </div>
  );
}
