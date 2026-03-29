"use client";
import React from "react";
import { motion } from "framer-motion";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { ERA_CATALOG } from "@ai-animation-factory/shared";

interface EraTabProps { cb: UseCharacterBuilder }

export function EraTab({ cb }: EraTabProps) {
  const selected = cb.getSegment("ERA");

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-[11px] text-white/30 mb-4">اختر الحقبة الزمنية لشخصيتك</p>
      {ERA_CATALOG.map((era) => {
        const isSelected = selected === era.code;
        return (
          <motion.button
            key={era.code}
            onClick={() => cb.setSegment("ERA", era.code)}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-right transition-all ${
              isSelected
                ? "bg-violet-500/20 border-violet-500/50 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-medium">{era.visual.label.ar}</span>
              <span className="text-[10px] text-white/40">{era.visual.label.en}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/30 font-mono">{era.yearRange}</span>
              {isSelected && (
                <motion.div
                  layoutId="era-dot"
                  className="w-2 h-2 rounded-full bg-violet-400"
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
