"use client";
// BodyTab — جسم: BD, HT + gender-specific segments

import React from "react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  BODY_TYPES,
  MALE_CHEST, MALE_MUSCLE, MALE_ABS,
  FEMALE_BREAST, FEMALE_HIP, FEMALE_BUTT,
} from "@ai-animation-factory/shared/data/character";

interface BodyTabProps { cb: UseCharacterBuilder }

export function BodyTab({ cb }: BodyTabProps) {
  const gender = cb.getSegment("G") as "M" | "F" | undefined;
  const height = cb.getSegment("HT");

  return (
    <div className="space-y-8" dir="rtl">

      {/* Body Type */}
      <section>
        <SectionTitle ar="نوع الجسم" en="Body Type" />
        <SegmentSelector
          items={BODY_TYPES}
          selected={cb.getSegment("BD")}
          onSelect={(c) => cb.setSegment("BD", c)}
          displayMode="icon"
        />
      </section>

      {/* Height */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">الطول</h3>
          <span className="text-[11px] text-white/30">Height</span>
          <span className="mr-auto text-sm text-violet-400 font-mono">
            {height ?? "170"} cm
          </span>
        </div>
        <input
          type="range" min={140} max={220} step={1}
          value={height ? parseInt(height) : 170}
          onChange={(e) => cb.setHeight(parseInt(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-[10px] text-white/25 mt-1">
          <span>140</span><span>170</span><span>200</span><span>220</span>
        </div>
      </section>

      {/* Gender-specific — Male */}
      {gender === "M" && (
        <>
          <section>
            <SectionTitle ar="الصدر / الصدرية" en="Chest" />
            <SegmentSelector
              items={MALE_CHEST}
              selected={cb.getSegment("CHEST" as any)}
              onSelect={(c) => cb.setSegment("CHEST" as any, c)}
              displayMode="icon"
            />
          </section>
          <section>
            <SectionTitle ar="العضلات" en="Muscle" />
            <SegmentSelector
              items={MALE_MUSCLE}
              selected={cb.getSegment("MUSCLE" as any)}
              onSelect={(c) => cb.setSegment("MUSCLE" as any, c)}
              displayMode="icon"
            />
          </section>
          <section>
            <SectionTitle ar="عضلات البطن" en="Abs" />
            <SegmentSelector
              items={MALE_ABS}
              selected={cb.getSegment("ABS" as any)}
              onSelect={(c) => cb.setSegment("ABS" as any, c)}
              displayMode="text"
              columns={3}
            />
          </section>
        </>
      )}

      {/* Gender-specific — Female */}
      {gender === "F" && (
        <>
          <section>
            <SectionTitle ar="الصدر" en="Bust" />
            <SegmentSelector
              items={FEMALE_BREAST}
              selected={cb.getSegment("BREAST" as any)}
              onSelect={(c) => cb.setSegment("BREAST" as any, c)}
              displayMode="text"
              columns={3}
            />
          </section>
          <section>
            <SectionTitle ar="الوركين" en="Hips" />
            <SegmentSelector
              items={FEMALE_HIP}
              selected={cb.getSegment("HIP" as any)}
              onSelect={(c) => cb.setSegment("HIP" as any, c)}
              displayMode="text"
              columns={4}
            />
          </section>
          <section>
            <SectionTitle ar="المؤخرة" en="Butt" />
            <SegmentSelector
              items={FEMALE_BUTT}
              selected={cb.getSegment("BUTT" as any)}
              onSelect={(c) => cb.setSegment("BUTT" as any, c)}
              displayMode="text"
              columns={3}
            />
          </section>
        </>
      )}

      {!gender && (
        <p className="text-center text-white/30 text-xs py-4 border border-dashed border-white/10 rounded-xl">
          اختر الجنس في تاب الوجه لرؤية خيارات الجسم التفصيلية
        </p>
      )}

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
