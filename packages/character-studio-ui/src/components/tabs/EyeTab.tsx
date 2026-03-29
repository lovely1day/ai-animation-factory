"use client";

// FILE: src/components/character-room/tabs/EyeTab.tsx

import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  EYE_SHAPES,
  EYE_SIZES,
  EYE_COLORS,
  IRIS_PATTERNS,
  EYEBROW_SHAPES,
} from "@ai-animation-factory/shared";

interface EyeTabProps {
  cb: UseCharacterBuilder;
}

export function EyeTab({ cb }: EyeTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="لون العين" en="Eye Color" />
        <SegmentSelector
          items={EYE_COLORS}
          selected={cb.getSegment("EC")}
          onSelect={(c) => cb.setSegment("EC", c)}
          displayMode="color"
        />
      </section>

      <section>
        <SectionTitle ar="شكل العين" en="Eye Shape" />
        <SegmentSelector
          items={EYE_SHAPES}
          selected={cb.getSegment("ES")}
          onSelect={(c) => cb.setSegment("ES", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="حجم العين" en="Eye Size" />
        <SegmentSelector
          items={EYE_SIZES}
          selected={cb.getSegment("EZ")}
          onSelect={(c) => cb.setSegment("EZ", c)}
          displayMode="icon"
        />
      </section>

      <div className="border-t border-white/10 pt-8">
        <p className="text-[11px] text-white/25 mb-6 text-right">— تفاصيل إضافية —</p>
      </div>

      <section>
        <SectionTitle ar="نمط القزحية" en="Iris Pattern" />
        <SegmentSelector
          items={IRIS_PATTERNS}
          selected={cb.getSegment("EP")}
          onSelect={(c) => cb.setSegment("EP", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="شكل الحاجب" en="Eyebrow Shape" />
        <SegmentSelector
          items={EYEBROW_SHAPES}
          selected={cb.getSegment("EB")}
          onSelect={(c) => cb.setSegment("EB", c)}
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
