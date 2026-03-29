"use client";
import React from "react";
import { motion } from "framer-motion";
import type { GenderCode } from "@ai-animation-factory/shared";

interface GenderToggleProps {
  value?: GenderCode;
  onChange: (gender: GenderCode) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="flex gap-4" dir="rtl">
      <motion.button
        onClick={() => onChange("M")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl
          border-2 transition-all duration-200
          ${value === "M"
            ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          }
        `}
      >
        <span className="text-2xl">{"\u{1F468}"}</span>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{"\u0630\u0643\u0631"}</p>
          <p className="text-[10px] text-white/40">Male</p>
        </div>
      </motion.button>

      <motion.button
        onClick={() => onChange("F")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl
          border-2 transition-all duration-200
          ${value === "F"
            ? "border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/20"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          }
        `}
      >
        <span className="text-2xl">{"\u{1F469}"}</span>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{"\u0623\u0646\u062B\u0649"}</p>
          <p className="text-[10px] text-white/40">Female</p>
        </div>
      </motion.button>
    </div>
  );
}
