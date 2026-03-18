"use client";
// ============================================================
// CharacterRoom — Main Character Builder UI
// Version: 1.0.0
//
// Layout:
//   ┌──────────────────────────────────────────────┐
//   │  Header: name input + DNA bar + undo/redo     │
//   ├──────────────────┬───────────────────────────┤
//   │  Preview (left)  │  Tabs + Options (right)   │
//   │  CharacterPreview│  FaceTab / HairTab / ...  │
//   └──────────────────┴───────────────────────────┘
// ============================================================

import React, { useState } from "react";
import { Undo2, Redo2, Save, Copy, RotateCcw, ChevronDown } from "lucide-react";
import { useCharacterBuilder } from "@/hooks/useCharacterBuilder";
import { LivingCanvas } from "./LivingCanvas";
import { FaceTab }     from "./tabs/FaceTab";
import { EyeTab }      from "./tabs/EyeTab";
import { JawTab }      from "./tabs/JawTab";
import { HairTab }     from "./tabs/HairTab";
import { SkinTab }     from "./tabs/SkinTab";
import { BodyTab }     from "./tabs/BodyTab";
import { MakeupTab }   from "./tabs/MakeupTab";
import { WardrobeTab } from "./tabs/WardrobeTab";
import { EraTab }      from "./tabs/EraTab";

// ─── TABS CONFIG ───────────────────────────────────────────

const TABS = [
  { id: "face",     labelAr: "الوجه",    labelEn: "Face"     },
  { id: "eye",      labelAr: "العيون",   labelEn: "Eyes"     },
  { id: "jaw",      labelAr: "الفك",     labelEn: "Jaw"      },
  { id: "hair",     labelAr: "الشعر",    labelEn: "Hair"     },
  { id: "skin",     labelAr: "البشرة",   labelEn: "Skin"     },
  { id: "body",     labelAr: "الجسم",    labelEn: "Body"     },
  { id: "makeup",   labelAr: "المكياج",  labelEn: "Makeup"   },
  { id: "wardrobe", labelAr: "الملابس",  labelEn: "Wardrobe" },
  { id: "era",      labelAr: "الحقبة",   labelEn: "Era"      },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── PROPS ─────────────────────────────────────────────────

interface CharacterRoomProps {
  initialDNA?: string;
  onSave?: (profile: { name: string; dna: string }) => void;
}

// ─── COMPONENT ─────────────────────────────────────────────

export function CharacterRoom({ initialDNA, onSave }: CharacterRoomProps) {
  const cb = useCharacterBuilder(
    initialDNA ? { segments: {} } : undefined
  );

  const [copied, setCopied] = useState(false);

  // Load initial DNA if provided
  React.useEffect(() => {
    if (initialDNA) cb.loadFromDNA(initialDNA);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDNA]);

  // ── Handlers ────────────────────────────────────────────

  function handleCopyDNA() {
    navigator.clipboard.writeText(cb.exportDNA());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSave() {
    if (!cb.name.trim()) return;
    onSave?.({ name: cb.name, dna: cb.exportDNA() });
    cb.markClean();
  }

  // ── Active tab component ─────────────────────────────────

  function renderActiveTab() {
    switch (cb.activeTab) {
      case "face":     return <FaceTab     cb={cb} />;
      case "eye":      return <EyeTab      cb={cb} />;
      case "jaw":      return <JawTab      cb={cb} />;
      case "hair":     return <HairTab     cb={cb} />;
      case "skin":     return <SkinTab     cb={cb} />;
      case "body":     return <BodyTab     cb={cb} />;
      case "makeup":   return <MakeupTab   cb={cb} />;
      case "wardrobe": return <WardrobeTab cb={cb} />;
      case "era":      return <EraTab      cb={cb} />;
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#0f0f13] text-white rounded-2xl overflow-hidden border border-white/10">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-[#141418]">

        {/* Name input */}
        <input
          type="text"
          value={cb.name}
          onChange={(e) => cb.setName(e.target.value)}
          placeholder="اسم الشخصية..."
          dir="rtl"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm
                     placeholder:text-white/30 focus:outline-none focus:border-violet-500/60
                     transition-colors"
        />

        {/* DNA display */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/10
                        rounded-lg px-3 py-1.5 max-w-[240px] overflow-hidden">
          <span className="text-[10px] text-violet-400 font-mono shrink-0">DNA</span>
          <span className="text-[10px] text-white/40 font-mono truncate">
            {cb.exportDNA().slice(3, 40)}…
          </span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cb.undo}
            disabled={!cb.canUndo}
            title="تراجع"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10
                       disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={cb.redo}
            disabled={!cb.canRedo}
            title="إعادة"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10
                       disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Copy DNA */}
        <button
          type="button"
          onClick={handleCopyDNA}
          title="نسخ DNA"
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Copy size={15} />
          {copied && (
            <span className="absolute ml-6 text-[10px] text-green-400">نُسخ</span>
          )}
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={cb.reset}
          title="إعادة تعيين"
          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <RotateCcw size={15} />
        </button>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!cb.isDirty || !cb.name.trim()}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500
                     disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Save size={13} />
          حفظ
        </button>

      </header>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Preview */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-white/10
                          bg-[#0c0c10] p-4 gap-4 shrink-0 overflow-y-auto">
          <LivingCanvas cb={cb} />
        </aside>

        {/* Right: Tabs + Options */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Tab bar */}
          <nav className="flex items-center gap-1 px-3 pt-3 pb-0 overflow-x-auto scrollbar-hide shrink-0">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => cb.setActiveTab(tab.id)}
                className={`
                  shrink-0 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
                  ${cb.activeTab === tab.id
                    ? "bg-[#1e1e26] text-white border border-white/10 border-b-[#1e1e26]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }
                `}
              >
                {tab.labelAr}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto bg-[#1e1e26] rounded-tr-xl p-4 lg:p-6">
            {renderActiveTab()}
          </div>

        </div>
      </div>
    </div>
  );
}
