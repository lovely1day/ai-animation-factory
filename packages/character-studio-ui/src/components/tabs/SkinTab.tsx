"use client";

// FILE: src/components/character-room/tabs/SkinTab.tsx

import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  SKIN_TONES,
  SKIN_UNDERTONES,
} from "@ai-animation-factory/shared";

interface SkinTabProps {
  cb: UseCharacterBuilder;
}

export function SkinTab({ cb }: SkinTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="لون البشرة" en="Skin Tone" />
        <SegmentSelector
          items={SKIN_TONES}
          selected={cb.getSegment("SK")}
          onSelect={(c) => cb.setSegment("SK", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="النغمة الداخلية" en="Undertone" />
        <SegmentSelector
          items={SKIN_UNDERTONES}
          selected={cb.getSegment("ST")}
          onSelect={(c) => cb.setSegment("ST", c)}
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
