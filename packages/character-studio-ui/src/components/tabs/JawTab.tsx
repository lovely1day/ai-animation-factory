"use client";

// FILE: src/components/character-room/tabs/JawTab.tsx

import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  CHIN_SHAPES,
  JAW_TYPES,
  NECK_TYPES,
} from "@ai-animation-factory/shared";

interface JawTabProps {
  cb: UseCharacterBuilder;
}

export function JawTab({ cb }: JawTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="شكل الذقن" en="Chin Shape" />
        <SegmentSelector
          items={CHIN_SHAPES}
          selected={cb.getSegment("CH")}
          onSelect={(c) => cb.setSegment("CH", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="نوع الفك" en="Jaw Type" />
        <SegmentSelector
          items={JAW_TYPES}
          selected={cb.getSegment("JW")}
          onSelect={(c) => cb.setSegment("JW", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="نوع الرقبة" en="Neck Type" />
        <SegmentSelector
          items={NECK_TYPES}
          selected={cb.getSegment("NK")}
          onSelect={(c) => cb.setSegment("NK", c)}
          displayMode="icon"
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
