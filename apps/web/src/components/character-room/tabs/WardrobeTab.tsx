"use client";
// WardrobeTab — ملابس (TS, BS, OS, CC)

import React, { useState } from "react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  TOP_STYLES,
  BOTTOM_STYLES,
  OUTFIT_STYLE,
  CLOTHING_COLOR,
} from "@ai-animation-factory/shared/data/character";

interface WardrobeTabProps { cb: UseCharacterBuilder }

export function WardrobeTab({ cb }: WardrobeTabProps) {
  // Local state for wardrobe selections (not part of DNA)
  const [topStyle, setTopStyle] = useState<string | undefined>(undefined);
  const [bottomStyle, setBottomStyle] = useState<string | undefined>(undefined);
  const [outfitStyle, setOutfitStyle] = useState<string | undefined>(undefined);
  const [clothingColor, setClothingColor] = useState<string | undefined>(undefined);

  const era = cb.getSegment("ERA");

  return (
    <div className="space-y-8" dir="rtl">

      {era && (
        <section className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-[11px] text-white/40 mb-2">الحقبة المختارة</p>
          <p className="text-sm text-violet-400 font-medium">{era}</p>
          <p className="text-[11px] text-white/30 mt-1">
            الملابس ستُحدَّد تلقائياً بناءً على الحقبة
          </p>
        </section>
      )}

      <section>
        <SectionTitle ar="القطعة العلوية" en="Top Style" />
        <SegmentSelector
          items={TOP_STYLES}
          selected={topStyle}
          onSelect={setTopStyle}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="القطعة السفلية" en="Bottom Style" />
        <SegmentSelector
          items={BOTTOM_STYLES}
          selected={bottomStyle}
          onSelect={setBottomStyle}
          displayMode="icon"
        />
      </section>

      <div className="border-t border-white/10 pt-8">
        <p className="text-[11px] text-white/25 mb-6 text-right">— الإطلالة الكاملة —</p>
      </div>

      <section>
        <SectionTitle ar="نمط الزي" en="Outfit Style" />
        <SegmentSelector
          items={OUTFIT_STYLE}
          selected={outfitStyle}
          onSelect={setOutfitStyle}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="لون الملابس" en="Clothing Color" />
        <SegmentSelector
          items={CLOTHING_COLOR}
          selected={clothingColor}
          onSelect={setClothingColor}
          displayMode="color"
        />
      </section>

    </div>
  );
}

function SectionTitle({ ar, en }: { ar: string; en: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <h3 className="text-sm font-semibold text-white">{ar}</h3>
      <span className="text-[11px] text-white/30">{en}</span>
    </div>
  );
}
