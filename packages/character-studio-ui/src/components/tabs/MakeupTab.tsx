"use client";
import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import { LIPSTICK_COLORS, LIPSTICK_STYLES, EYE_SHADOW, EYE_LINER, BLUSH } from "@ai-animation-factory/shared";

interface MakeupTabProps { cb: UseCharacterBuilder }

export function MakeupTab({ cb }: MakeupTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="لون أحمر الشفاه" en="Lipstick Color" />
        <SegmentSelector items={LIPSTICK_COLORS} selected={cb.getSegment("LK")} onSelect={(v) => cb.setSegment("LK", v)} displayMode="color" />
      </section>
      <section>
        <SectionTitle ar="أسلوب الشفاه" en="Lipstick Style" />
        <SegmentSelector items={LIPSTICK_STYLES} selected={cb.getSegment("LC")} onSelect={(v) => cb.setSegment("LC", v)} displayMode="text" />
      </section>
      <div className="border-t border-white/10 pt-6">
        <p className="text-[11px] text-white/25 mb-4 text-right">— العيون —</p>
      </div>
      <section>
        <SectionTitle ar="ظلال العيون" en="Eye Shadow" />
        <SegmentSelector items={EYE_SHADOW} selected={cb.getSegment("EK")} onSelect={(v) => cb.setSegment("EK", v)} displayMode="text" />
      </section>
      <section>
        <SectionTitle ar="محدد العيون" en="Eye Liner" />
        <SegmentSelector items={EYE_LINER} selected={cb.getSegment("EL")} onSelect={(v) => cb.setSegment("EL", v)} displayMode="text" />
      </section>
      <div className="border-t border-white/10 pt-6">
        <p className="text-[11px] text-white/25 mb-4 text-right">— الخدود —</p>
      </div>
      <section>
        <SectionTitle ar="أحمر الخدود" en="Blush" />
        <SegmentSelector items={BLUSH} selected={cb.getSegment("BL")} onSelect={(v) => cb.setSegment("BL", v)} displayMode="color" />
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
