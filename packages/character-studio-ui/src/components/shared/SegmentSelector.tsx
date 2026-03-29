"use client";
import React from "react";
import { motion } from "framer-motion";
import type { CatalogItem, ColorCatalogItem } from "@ai-animation-factory/shared";

interface SegmentSelectorProps {
  items: readonly CatalogItem[] | readonly ColorCatalogItem[];
  selected?: string;
  onSelect: (code: string) => void;
  displayMode?: "icon" | "color" | "text";
  columns?: number;
}

export function SegmentSelector({
  items,
  selected,
  onSelect,
  displayMode = "icon",
  columns,
}: SegmentSelectorProps) {
  const cols = columns ?? (displayMode === "text" ? 2 : displayMode === "color" ? 5 : 4);
  const gridClass =
    cols === 2 ? "grid-cols-2"
    : cols === 3 ? "grid-cols-3"
    : cols === 4 ? "grid-cols-4"
    : cols === 5 ? "grid-cols-5"
    : "grid-cols-4";

  return (
    <div className={`grid gap-2 ${gridClass}`} dir="rtl">
      {items.map((item) => {
        const isSelected = selected === item.code;
        const colorItem = "hex" in item.visual ? (item as ColorCatalogItem) : null;

        return (
          <motion.button
            key={item.code}
            onClick={() => onSelect(item.code)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative flex items-center gap-2 rounded-xl border transition-all duration-200
              ${displayMode === "text"
                ? "px-3 py-2.5 flex-row justify-start"
                : "flex-col justify-center p-3"}
              ${isSelected
                ? "border-violet-500 bg-violet-500/20 shadow-md shadow-violet-500/20"
                : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }
              ${displayMode === "color" ? "aspect-square" : ""}
            `}
          >
            {displayMode === "color" && colorItem && (
              <div
                className="w-9 h-9 rounded-full border-2 border-white/20 shadow-inner flex-shrink-0"
                style={{ backgroundColor: colorItem.visual.hex }}
              />
            )}

            {displayMode === "icon" && (
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                {item.visual.svg ? (
                  <img
                    src={item.visual.svg}
                    alt={item.visual.label.en}
                    className="w-6 h-6 object-contain opacity-80"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-base opacity-40">◯</span>
                )}
              </div>
            )}

            {displayMode === "text" && (
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isSelected ? "bg-violet-400" : "bg-white/20"
                }`}
              />
            )}

            <span
              className={`leading-tight text-center ${
                displayMode === "text"
                  ? "text-xs text-right flex-1"
                  : "text-[11px]"
              } ${isSelected ? "text-white font-medium" : "text-white/70"}`}
            >
              {item.visual.label.ar}
            </span>

            {isSelected && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
