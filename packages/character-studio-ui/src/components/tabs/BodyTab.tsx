"use client";

// FILE: src/components/character-room/tabs/BodyTab.tsx

import React from "react";
import type { UseCharacterBuilder } from "../../hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import { BODY_TYPES } from "@ai-animation-factory/shared";

interface BodyTabProps {
  cb: UseCharacterBuilder;
}

export function BodyTab({ cb }: BodyTabProps) {
  return (
    <div className="space-y-8" dir="rtl">
      <section>
        <SectionTitle ar="نوع الجسم" en="Body Type" />
        <SegmentSelector
          items={BODY_TYPES}
          selected={cb.getSegment("BD")}
          onSelect={(c) => cb.setSegment("BD", c)}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="الطول (سم)" en="Height (cm)" />
        <HeightInput cb={cb} />
      </section>
    </div>
  );
}

function HeightInput({ cb }: { cb: UseCharacterBuilder }) {
  const heightValue = cb.getSegment("HT");
  const [value, setValue] = React.useState(heightValue || "170");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (newValue && !isNaN(Number(newValue))) {
      cb.setSegment("HT", newValue);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min="100"
        max="250"
        value={value}
        onChange={handleChange}
        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
      />
      <div className="w-20">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center text-sm focus:outline-none focus:border-violet-500"
          min="100"
          max="250"
        />
      </div>
      <span className="text-white/40 text-sm">سم</span>
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
