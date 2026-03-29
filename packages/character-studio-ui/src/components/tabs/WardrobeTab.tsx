"use client";
import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import { TOP_STYLES, BOTTOM_STYLES, OUTFIT_STYLE, CLOTHING_COLOR } from "@ai-animation-factory/shared";

interface WardrobeTabProps { cb: UseCharacterBuilder }

export function WardrobeTab({ cb }: WardrobeTabProps) {
  const era = cb.getSegment("ERA");
  return (
    <div className="space-y-8" dir="rtl">
      {era && (
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-[11px] text-white/40 mb-1">الحقبة المختارة</p>
          <p className="text-sm text-violet-400 font-medium">{era}</p>
        </div>
      )}
      <section>
        <SectionTitle ar="القطعة العلوية" en="Top Style" />
        <SegmentSelector items={TOP_STYLES} selected={cb.getSegment("TS")} onSelect={(v) => cb.setSegment("TS", v)} displayMode="text" />
      </section>
      <section>
        <SectionTitle ar="القطعة السفلية" en="Bottom Style" />
        <SegmentSelector items={BOTTOM_STYLES} selected={cb.getSegment("BS")} onSelect={(v) => cb.setSegment("BS", v)} displayMode="text" />
      </section>
      <div className="border-t border-white/10 pt-6">
        <p className="text-[11px] text-white/25 mb-4 text-right">— الإطلالة الكاملة —</p>
      </div>
      <section>
        <SectionTitle ar="نمط الزي" en="Outfit Style" />
        <SegmentSelector items={OUTFIT_STYLE} selected={cb.getSegment("OS")} onSelect={(v) => cb.setSegment("OS", v)} displayMode="text" />
      </section>
      <section>
        <SectionTitle ar="لون الملابس" en="Clothing Color" />
        <SegmentSelector items={CLOTHING_COLOR} selected={cb.getSegment("CC")} onSelect={(v) => cb.setSegment("CC", v)} displayMode="color" />
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
