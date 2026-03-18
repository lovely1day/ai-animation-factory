"use client";
// ============================================================
// SegmentSelector — Generic visual option picker
// Used by ALL tabs for selecting face/hair/color/etc. options
//
// displayMode:
//   "icon"  → SVG card grid (face shapes, hair styles...)
//   "color" → Hex swatch grid (eye color, hair color...)
//   "text"  → Text label cards (body type, height...)
// ============================================================

import React from "react";
import Image from "next/image";
import type { CatalogItem, ColorCatalogItem, Code } from "@ai-animation-factory/shared";
import { Check } from "lucide-react";

// ─── PROPS ─────────────────────────────────────────────────

type DisplayMode = "icon" | "color" | "text";

interface SegmentSelectorProps {
  items: readonly (CatalogItem | ColorCatalogItem)[];
  selected: Code | undefined;
  onSelect: (code: Code) => void;
  displayMode?: DisplayMode;
  columns?: number;
}

// ─── COMPONENT ─────────────────────────────────────────────

export function SegmentSelector({
  items,
  selected,
  onSelect,
  displayMode = "icon",
  columns,
}: SegmentSelectorProps) {

  const gridCols = columns
    ? `grid-cols-${columns}`
    : displayMode === "color"
      ? "grid-cols-8 sm:grid-cols-10"
      : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5";

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {items.map((item) => {
        const isSelected = item.code === selected;
        const colorItem = item as ColorCatalogItem;
        const hasHex = "hex" in colorItem.visual && colorItem.visual.hex;

        return (
          <button
            key={item.code}
            onClick={() => onSelect(item.code)}
            title={item.visual.label.ar}
            className={`
              relative group rounded-xl border transition-all duration-150
              ${isSelected
                ? "border-violet-500 bg-violet-500/15 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }
              ${displayMode === "color" ? "aspect-square" : "flex flex-col items-center p-2 gap-1.5"}
            `}
          >
            {/* Color swatch */}
            {displayMode === "color" && hasHex && (
              <div
                className="w-full h-full rounded-xl"
                style={{ backgroundColor: colorItem.visual.hex }}
              />
            )}

            {/* SVG icon */}
            {displayMode === "icon" && item.visual.svg && (
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src={item.visual.svg}
                  alt={item.visual.label.en}
                  width={40}
                  height={40}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    // Fallback: show first letter if SVG not found
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Text label */}
            {(displayMode === "text" || displayMode === "icon") && (
              <span className={`text-[10px] text-center leading-tight transition-colors
                ${isSelected ? "text-violet-300" : "text-white/50 group-hover:text-white/70"}`}>
                {item.visual.label.ar}
              </span>
            )}

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-1 right-1 bg-violet-500 rounded-full p-0.5">
                <Check size={8} strokeWidth={3} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
