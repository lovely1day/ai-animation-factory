"use client";

// FILE: src/components/character-room/tabs/FaceTab.tsx

import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import { GenderToggle } from "../shared/GenderToggle";
import {
  FACE_SHAPES,
  FOREHEAD_TYPES,
  NOSE_SHAPES,
  NOSE_BRIDGES,
  LIP_SHAPES,
} from "@ai-animation-factory/shared";

interface FaceTabProps {
  cb: UseCharacterBuilder;
}

export function FaceTab({ cb }: FaceTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="الجنس" en="Gender" />
        <GenderToggle
          value={cb.getSegment("G") as "M" | "F" | undefined}
          onChange={(g) => cb.setGender(g)}
        />
      </section>

      <section>
        <SectionTitle ar="شكل الوجه" en="Face Shape" />
        <SegmentSelector
          items={FACE_SHAPES}
          selected={cb.getSegment("FS")}
          onSelect={(c) => cb.setSegment("FS", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="الجبهة" en="Forehead" />
        <SegmentSelector
          items={FOREHEAD_TYPES}
          selected={cb.getSegment("FH")}
          onSelect={(c) => cb.setSegment("FH", c)}
          displayMode="icon"
        />
      </section>

      <div className="border-t border-white/10 pt-8">
        <p className="text-[11px] text-white/25 mb-6 text-right">— الأنف والشفاه —</p>
      </div>

      <section>
        <SectionTitle ar="شكل الأنف" en="Nose Shape" />
        <SegmentSelector
          items={NOSE_SHAPES}
          selected={cb.getSegment("NS")}
          onSelect={(c) => cb.setSegment("NS", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="جسر الأنف" en="Nose Bridge" />
        <SegmentSelector
          items={NOSE_BRIDGES}
          selected={cb.getSegment("NB")}
          onSelect={(c) => cb.setSegment("NB", c)}
          displayMode="text"
          columns={3}
        />
      </section>

      <section>
        <SectionTitle ar="شكل الشفاه" en="Lip Shape" />
        <SegmentSelector
          items={LIP_SHAPES}
          selected={cb.getSegment("LS")}
          onSelect={(c) => cb.setSegment("LS", c)}
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
