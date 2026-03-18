"use client";
// MakeupTab — مكياج (LK, LC, EK, EL, BL)

import React, { useState } from "react";
import type { UseCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { SegmentSelector } from "../shared/SegmentSelector";
import {
  LIPSTICK_STYLES,
  LIPSTICK_COLORS,
  EYE_SHADOW,
  EYE_LINER,
  BLUSH,
} from "@ai-animation-factory/shared/data/character";

interface MakeupTabProps { cb: UseCharacterBuilder }

export function MakeupTab({ cb }: MakeupTabProps) {
  // Local state for makeup selections (not part of DNA)
  const [lipstickStyle, setLipstickStyle] = useState<string | undefined>(undefined);
  const [lipstickColor, setLipstickColor] = useState<string | undefined>(undefined);
  const [eyeShadow, setEyeShadow] = useState<string | undefined>(undefined);
  const [eyeLiner, setEyeLiner] = useState<string | undefined>(undefined);
  const [blush, setBlush] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-8" dir="rtl">

      <section>
        <SectionTitle ar="لون أحمر الشفاه" en="Lipstick Color" />
        <SegmentSelector
          items={LIPSTICK_COLORS}
          selected={lipstickColor}
          onSelect={setLipstickColor}
          displayMode="color"
        />
      </section>

      <section>
        <SectionTitle ar="أسلوب أحمر الشفاه" en="Lipstick Style" />
        <SegmentSelector
          items={LIPSTICK_STYLES}
          selected={lipstickStyle}
          onSelect={setLipstickStyle}
          displayMode="icon"
        />
      </section>

      <div className="border-t border-white/10 pt-8">
        <p className="text-[11px] text-white/25 mb-6 text-right">— العيون —</p>
      </div>

      <section>
        <SectionTitle ar="ظلال العيون" en="Eye Shadow" />
        <SegmentSelector
          items={EYE_SHADOW}
          selected={eyeShadow}
          onSelect={setEyeShadow}
          displayMode="icon"
        />
      </section>

      <section>
        <SectionTitle ar="محدد العيون" en="Eye Liner" />
        <SegmentSelector
          items={EYE_LINER}
          selected={eyeLiner}
          onSelect={setEyeLiner}
          displayMode="icon"
        />
      </section>

      <div className="border-t border-white/10 pt-8">
        <p className="text-[11px] text-white/25 mb-6 text-right">— الخدود —</p>
      </div>

      <section>
        <SectionTitle ar="أحمر الخدود" en="Blush" />
        <SegmentSelector
          items={BLUSH}
          selected={blush}
          onSelect={setBlush}
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
