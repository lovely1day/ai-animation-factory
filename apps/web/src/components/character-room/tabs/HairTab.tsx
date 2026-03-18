"use client";
// HairTab — شعر: HS, HL, HC

import React from "react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  HAIR_STYLES,
  HAIR_LENGTHS,
  HAIR_COLORS,
} from "@ai-animation-factory/shared/data/character";

interface HairTabProps { cb: UseCharacterBuilder }

export function HairTab({ cb }: HairTabProps) {
  return (
    <div className="space-y-8" dir="rtl">

      <section>
        <SectionTitle ar="لون الشعر" en="Hair Color" />
        <SegmentSelector
          items={HAIR_COLORS}
          selected={cb.getSegment("HC")}
          onSelect={(c) => cb.setSegment("HC", c)}
          displayMode="color"
        />
      </section>

      <section>
        <SectionTitle ar="تسريحة الشعر" en="Hair Style" />
        <SegmentSelector
          items={HAIR_STYLES}
          selected={cb.getSegment("HS")}
          onSelect={(c) => cb.setSegment("HS", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="طول الشعر" en="Hair Length" />
        <SegmentSelector
          items={HAIR_LENGTHS}
          selected={cb.getSegment("HL")}
          onSelect={(c) => cb.setSegment("HL", c)}
          displayMode="text"
          columns={4}
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
