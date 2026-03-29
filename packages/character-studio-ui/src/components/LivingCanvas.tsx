"use client";
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UseCharacterBuilder } from "../hooks/useCharacterBuilder";
import { ERA_CATALOG } from "@ai-animation-factory/shared";

interface LivingCanvasProps { cb: UseCharacterBuilder }

// ── Color maps ───────────────────────────────────────────────
const SKIN_HEX: Record<string, string> = {
  SK001: "#FDDBB4", SK002: "#F5C18A", SK003: "#D49A6A",
  SK004: "#A0694A", SK005: "#7B4A2D", SK006: "#4A2810",
};
const HAIR_HEX: Record<string, string> = {
  HC001: "#0A0500", HC002: "#2C1503", HC003: "#5C2E0A",
  HC004: "#8B5E3C", HC005: "#B8844A", HC006: "#D4A84B",
  HC007: "#E8C88A", HC008: "#F5E6C8", HC009: "#C0392B",
  HC010: "#E67E22", HC011: "#F1C40F", HC012: "#2980B9",
  HC013: "#8E44AD", HC014: "#27AE60", HC015: "#ECF0F1",
  HC016: "#95A5A6", HC017: "#5D6D7E",
};
const EYE_HEX: Record<string, string> = {
  EC001: "#3B2510", EC002: "#1A3A6B", EC003: "#1E7A1E",
  EC004: "#8B6A3A", EC005: "#7B2D8B", EC006: "#1A7A7A",
  EC007: "#B8B8B8", EC008: "#0A0A0A",
  EC009: "#00CED1", EC010: "#A52A2A", EC011: "#C0C0C0", EC012: "#1C1C1C",
};
const CLOTH_HEX: Record<string, string> = {
  CC001: "#1A1A1A", CC002: "#F0F0F0", CC003: "#1E3A5F",
  CC004: "#707070", CC005: "#D4C4B0", CC006: "#C41230",
  CC007: "#6B0020", CC008: "#1A6B1A", CC009: "#2E4DB5",
  CC010: "#C49010", CC011: "#9E3A0A", CC012: "#E060A0",
  CC013: "#6B008B", CC014: "#008080", CC015: "#7B3A0A",
  CC016: "#6B6B00",
};

// ── DNA-driven shape lookup tables ───────────────────────────
// Face shape: head rx/ry + jaw Y offset
const FACE_DIMS: Record<string, { rx: number; ry: number; jawOffset: number }> = {
  FS001: { rx: 37, ry: 44, jawOffset: 0  },  // Oval
  FS002: { rx: 42, ry: 40, jawOffset: 2  },  // Round
  FS003: { rx: 40, ry: 38, jawOffset: 4  },  // Square
  FS004: { rx: 35, ry: 43, jawOffset: -3 },  // Heart (narrow chin)
  FS005: { rx: 32, ry: 46, jawOffset: -2 },  // Diamond
  FS006: { rx: 34, ry: 47, jawOffset: 1  },  // Rectangle
  FS007: { rx: 40, ry: 42, jawOffset: 5  },  // Triangle (wide jaw)
};

// Jaw width multiplier on top of face rx
const JAW_W: Record<string, number> = {
  JW001: -5, JW002: 0, JW003: 6,
};

// Body width by body type
const BODY_W: Record<string, number> = {
  BT001: 58, BT002: 68, BT003: 76, BT004: 86, BT005: 98,
};

// Eye radius (iris)
const EYE_R: Record<string, number> = {
  EZ001: 4.5, EZ002: 6, EZ003: 7.5, EZ004: 9,
};

// Eyebrow stroke width
const BROW_W: Record<string, number> = {
  EB001: 1.5, EB002: 2.5, EB003: 4.0, EB004: 2.5, EB005: 2.5,
};

// Eye shadow colors
const EYE_SHADOW_HEX: Record<string, string> = {
  EK002: "#1A3A7A", EK003: "#6B1A5A", EK004: "#0A4A1A",
  EK005: "#7A3010", EK006: "#1A1A1A",
};
const BLUSH_HEX: Record<string, string> = {
  BL002: "#FFCBA4", BL003: "#E89C9C", BL004: "#FF7F7F",
  BL005: "#8B3A3A", BL006: "#CD853F",
  // BL001 = None — intentionally omitted
};

// ── Era clothing overrides ───────────────────────────────────
type EraStyle = "modern" | "robe" | "armor" | "toga" | "kimono" | "space";
const ERA_CLOTHING: Record<string, { color: string; style: EraStyle; detail: string | null; hat?: string }> = {
  ERA_PREHISTORIC:    { color: "#8B6914", style: "robe",   detail: null,      },
  ERA_ANCIENT_EGYPT:  { color: "#F0E8C8", style: "robe",   detail: "#D4A017", hat: "egypt"  },
  ERA_ANCIENT_GREECE: { color: "#F0F0EC", style: "toga",   detail: "#C49010", },
  ERA_ROMAN_EMPIRE:   { color: "#8B1010", style: "armor",  detail: "#C49010", hat: "laurel" },
  ERA_VIKING:         { color: "#3C2A15", style: "armor",  detail: "#708090", },
  ERA_MEDIEVAL:       { color: "#2C3E50", style: "armor",  detail: "#8090A0", },
  ERA_ISLAMIC_GOLDEN: { color: "#1A4A3A", style: "robe",   detail: "#D4A017", },
  ERA_RENAISSANCE:    { color: "#4A1A6B", style: "modern", detail: "#D4A017", },
  ERA_OTTOMAN:        { color: "#8B1A1A", style: "robe",   detail: "#D4A017", },
  ERA_SAMURAI:        { color: "#1A2A3A", style: "kimono", detail: "#C41230", },
  ERA_INDUSTRIAL:     { color: "#2C2C2C", style: "modern", detail: "#C49010", },
  ERA_WILD_WEST:      { color: "#8B6914", style: "modern", detail: "#C49010", },
  ERA_1900S:          { color: "#1A1A2A", style: "modern", detail: "#F0F0F0", },
  ERA_1920:           { color: "#1A1A1A", style: "modern", detail: "#FCD34D", },
  ERA_1950:           { color: "#2A5A8A", style: "modern", detail: "#F0F0F0", },
  ERA_1980:           { color: "#8B008B", style: "modern", detail: "#E879F9", },
  ERA_2024:           { color: "#111827", style: "modern", detail: "#8B5CF6", },
  ERA_FUTURE:         { color: "#0A1A2A", style: "space",  detail: "#06B6D4", },
  ERA_FAR_FUTURE:     { color: "#1A0A2A", style: "space",  detail: "#A78BFA", },
};

const ERA_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  ERA_PREHISTORIC:    { from: "#1C1208", to: "#2C1E0A", accent: "#C49A3C" },
  ERA_ANCIENT_EGYPT:  { from: "#2C1A00", to: "#1A0C00", accent: "#D4A017" },
  ERA_ANCIENT_GREECE: { from: "#0A1628", to: "#0A0F1E", accent: "#60A5FA" },
  ERA_ROMAN_EMPIRE:   { from: "#2C0A0A", to: "#1A0500", accent: "#EF4444" },
  ERA_VIKING:         { from: "#0A1020", to: "#050810", accent: "#94A3B8" },
  ERA_MEDIEVAL:       { from: "#1A1005", to: "#100A02", accent: "#D97706" },
  ERA_ISLAMIC_GOLDEN: { from: "#0A1A18", to: "#051210", accent: "#F59E0B" },
  ERA_RENAISSANCE:    { from: "#1A0F05", to: "#100800", accent: "#FB923C" },
  ERA_OTTOMAN:        { from: "#1A0505", to: "#100000", accent: "#DC2626" },
  ERA_SAMURAI:        { from: "#150005", to: "#0A0002", accent: "#F87171" },
  ERA_INDUSTRIAL:     { from: "#0A0C10", to: "#050608", accent: "#9CA3AF" },
  ERA_WILD_WEST:      { from: "#1C1205", to: "#120B00", accent: "#F59E0B" },
  ERA_1900S:          { from: "#1A1205", to: "#100B00", accent: "#D4A017" },
  ERA_1920:           { from: "#1A1000", to: "#100A00", accent: "#FCD34D" },
  ERA_1950:           { from: "#001A20", to: "#000F15", accent: "#22D3EE" },
  ERA_1980:           { from: "#1A0020", to: "#100015", accent: "#E879F9" },
  ERA_2024:           { from: "#0A0A10", to: "#050508", accent: "#8B5CF6" },
  ERA_FUTURE:         { from: "#00101A", to: "#000810", accent: "#06B6D4" },
  ERA_FAR_FUTURE:     { from: "#060010", to: "#030008", accent: "#A78BFA" },
};

function getEraTheme(eraCode?: string) {
  if (!eraCode) return { from: "#0F0F12", to: "#07070A", accent: "#7C3AED" };
  return ERA_THEMES[eraCode] ?? { from: "#0F0F12", to: "#07070A", accent: "#7C3AED" };
}

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Main LivingCanvas ─────────────────────────────────────────
export function LivingCanvas({ cb }: LivingCanvasProps) {
  const gender    = cb.getSegment("G")   ?? "M";
  const skinCode  = cb.getSegment("SK")  ?? "SK002";
  const hairCode  = cb.getSegment("HC")  ?? "HC002";
  const eyeCode   = cb.getSegment("EC")  ?? "EC001";
  const eraCode   = cb.getSegment("ERA");
  const clothCode = cb.getSegment("CC");
  const hairStyle = cb.getSegment("HS");
  const hairLen   = cb.getSegment("HL");
  const lipColor  = cb.getSegment("LC");
  const blush     = cb.getSegment("BL");

  // ── New segments ──
  const fsCode = cb.getSegment("FS") ?? "FS001";
  const nsCode = cb.getSegment("NS") ?? "NS001";
  const lsCode = cb.getSegment("LS") ?? "LS001";
  const esCode = cb.getSegment("ES") ?? "ES001";
  const ezCode = cb.getSegment("EZ") ?? "EZ002";
  const ebCode = cb.getSegment("EB") ?? "EB002";
  const btCode = cb.getSegment("BD") ?? "BT003";
  const jwCode = cb.getSegment("JW") ?? "JW002";
  const ekCode = cb.getSegment("EK");
  const elCode = cb.getSegment("EL");

  // ── Computed values ──
  const skinColor   = SKIN_HEX[skinCode]  ?? "#F5C18A";
  const hairColor   = HAIR_HEX[hairCode]  ?? "#2C1503";
  const eyeColor    = EYE_HEX[eyeCode]   ?? "#3B2510";
  const eraClothing = eraCode ? ERA_CLOTHING[eraCode] : null;
  const clothColor  = eraClothing
    ? eraClothing.color
    : clothCode ? (CLOTH_HEX[clothCode] ?? "#374151") : "#374151";
  const eraStyle  = eraClothing?.style  ?? "modern";
  const eraDetail = eraClothing?.detail ?? null;
  const eraHat    = eraClothing?.hat    ?? null;

  const lipColorHex = lipColor
    ? (lipColor === "LC001" ? "#D4A574" : lipColor === "LC002" ? "#E8B4B8"
      : lipColor === "LC003" ? "#C41E3A" : lipColor === "LC004" ? "#8B0000"
      : lipColor === "LC005" ? "#FF7F50" : lipColor === "LC006" ? "#8B3A62"
      : lipColor === "LC007" ? "#660066" : lipColor === "LC008" ? "#590212"
      : lipColor === "LC009" ? "#FFB6C1" : lipColor === "LC010" ? "#FF1493"
      : "#C41E3A")
    : (gender === "F" ? "#E8A090" : skinColor);

  const blushHex = blush ? (BLUSH_HEX[blush] ?? null) : null;
  const eyeShadowHex = ekCode ? (EYE_SHADOW_HEX[ekCode] ?? null) : null;
  const hasEyeliner  = !!(elCode && elCode !== "EL001");

  const faceDims = FACE_DIMS[fsCode] ?? FACE_DIMS["FS001"];
  const jawExtra = JAW_W[jwCode] ?? 0;
  const bodyW    = BODY_W[btCode] ?? 76;
  const eyeR     = EYE_R[ezCode] ?? 6;
  const browW    = BROW_W[ebCode] ?? 2.5;
  const browArched   = ebCode === "EB004";
  const browStraight = ebCode === "EB005";

  const theme    = useMemo(() => getEraTheme(eraCode), [eraCode]);
  const eraLabel = eraCode ? ERA_CATALOG.find(e => e.code === eraCode)?.visual.label.ar ?? "" : "";

  const isFemale  = gender === "F";
  const isLongHair = isFemale || ["HL004", "HL005"].includes(hairLen ?? "");
  const isBald    = hairStyle === "HS001";

  const segCount = Object.keys(cb.segments).filter(k => k !== "G").length;
  const pct = Math.round((segCount / 31) * 100);

  const animKey = [skinCode, hairCode, eyeCode, gender, eraCode, clothCode,
    fsCode, nsCode, lsCode, esCode, ezCode, ebCode, btCode, jwCode].join("-");

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${theme.accent}12 0%, transparent 70%)`,
          opacity: 0.35,
        }}
      />

      <AnimatePresence mode="wait">
        {eraCode && (
          <motion.div
            key={eraCode}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-3 left-0 right-0 flex justify-center z-20"
          >
            <span
              className="px-3 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-sm"
              style={{ borderColor: `${theme.accent}50`, color: theme.accent, background: `${theme.accent}15` }}
            >
              {eraLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <motion.div
          key={animKey}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-20"
            style={{ background: theme.accent, transform: "scale(0.7) translateY(20%)" }}
          />
          <CharacterSVG
            skinColor={skinColor}
            hairColor={hairColor}
            eyeColor={eyeColor}
            clothColor={clothColor}
            lipColor={lipColorHex}
            blushColor={blushHex}
            accentColor={theme.accent}
            isFemale={isFemale}
            isLongHair={isLongHair}
            isBald={isBald}
            eraStyle={eraStyle}
            eraDetail={eraDetail}
            eraHat={eraHat}
            faceDims={faceDims}
            jawExtra={jawExtra}
            nsCode={nsCode}
            lsCode={lsCode}
            esCode={esCode}
            eyeR={eyeR}
            browW={browW}
            browArched={browArched}
            browStraight={browStraight}
            bodyW={bodyW}
            eyeShadowHex={eyeShadowHex}
            hasEyeliner={hasEyeliner}
          />
        </motion.div>
      </div>

      <div className="relative z-10 mx-3 mb-3 p-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/8">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-white/30 font-mono">DNA</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: theme.accent }}>{pct}%</span>
        </div>
        <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.accent}80, ${theme.accent})` }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[8px] text-white/15 font-mono mt-1.5 truncate">{cb.exportDNA()}</p>
      </div>
    </div>
  );
}

// ── SVG Character ─────────────────────────────────────────────
interface SVGProps {
  skinColor: string; hairColor: string; eyeColor: string;
  clothColor: string; lipColor: string; blushColor: string | null;
  accentColor: string; isFemale: boolean; isLongHair: boolean;
  isBald: boolean; eraStyle: EraStyle; eraDetail: string | null;
  eraHat: string | null;
  // new
  faceDims: { rx: number; ry: number; jawOffset: number };
  jawExtra: number;
  nsCode: string; lsCode: string; esCode: string;
  eyeR: number; browW: number; browArched: boolean; browStraight: boolean;
  bodyW: number; eyeShadowHex: string | null; hasEyeliner: boolean;
}

function CharacterSVG({
  skinColor, hairColor, eyeColor, clothColor,
  lipColor, blushColor, accentColor,
  isFemale, isLongHair, isBald,
  eraStyle, eraDetail, eraHat,
  faceDims, jawExtra, nsCode, lsCode, esCode,
  eyeR, browW, browArched, browStraight,
  bodyW, eyeShadowHex, hasEyeliner,
}: SVGProps) {
  const skinShadow  = darken(skinColor, 22);
  const skinDeep    = darken(skinColor, 40);
  const clothShadow = darken(clothColor, 30);
  const cx = 90;

  // Body geometry
  const bHalf   = bodyW / 2;
  const bLeft   = cx - bHalf;
  const bRight  = cx + bHalf;

  // Face geometry from FS + JW
  const { rx: headRx, ry: headRy, jawOffset } = faceDims;
  const jawRx = headRx + jawExtra;

  // Eye positions
  const eyeLx = cx - headRx * 0.52;
  const eyeRx = cx + headRx * 0.52;
  const eyeY  = 108;

  // Brow positions
  const browLx1 = eyeLx - eyeR - 4;
  const browLx2 = eyeLx + eyeR + 2;
  const browRx1 = eyeRx - eyeR - 2;
  const browRx2 = eyeRx + eyeR + 4;

  // Nose and lip vertical positions scale with face ry
  const nosY  = eyeY + headRy * 0.38;
  const lipY  = nosY + headRy * 0.22;

  return (
    <svg width="180" height="300" viewBox="0 0 180 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Skin radial gradient — adds depth */}
        <radialGradient id="skinGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={skinColor} stopOpacity="1" />
          <stop offset="100%" stopColor={skinShadow} stopOpacity="1" />
        </radialGradient>
        {/* Soft shadow under chin */}
        <radialGradient id="chinShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={skinDeep} stopOpacity="0.35" />
          <stop offset="100%" stopColor={skinDeep} stopOpacity="0" />
        </radialGradient>
        {/* Body shading */}
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="black" stopOpacity="0.12" />
          <stop offset="40%"  stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.08" />
        </linearGradient>
        {/* Hair sheen */}
        <radialGradient id="hairSheen" cx="38%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Eye iris gradient */}
        <radialGradient id="irisGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={eyeColor} stopOpacity="1" />
          <stop offset="100%" stopColor={darken(eyeColor, 30)} stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx={cx} cy="290" rx="52" ry="7" fill={accentColor} opacity="0.12" />

      {/* ── Body ── */}
      {renderBody(eraStyle, cx, bLeft, bRight, bHalf, clothColor, clothShadow, eraDetail, isFemale, skinColor)}

      {/* Body shading overlay */}
      <rect x={bLeft} y="158" width={bodyW} height="85" rx="10" fill="url(#bodyGrad)" />

      {/* ── Neck ── */}
      <rect x={cx - 14} y="140" width="28" height="24" rx="5" fill="url(#skinGrad)" />
      <rect x={cx - 14} y="140" width="7"  height="24" rx="4" fill={skinShadow} opacity="0.25" />

      {/* ── Head ── */}
      {/* Jaw / lower face — slightly wider for some shapes */}
      <ellipse cx={cx} cy={112 + jawOffset} rx={jawRx} ry={headRy * 0.55}
        fill="url(#skinGrad)" opacity="0.95" />
      {/* Main head */}
      <ellipse cx={cx} cy="108" rx={headRx} ry={headRy} fill="url(#skinGrad)" />
      {/* Cheek glow */}
      <ellipse cx={cx - headRx * 0.55} cy="115" rx={headRx * 0.28} ry="14"
        fill={skinColor} opacity="0.4" />
      <ellipse cx={cx + headRx * 0.55} cy="115" rx={headRx * 0.28} ry="14"
        fill={skinColor} opacity="0.3" />
      {/* Chin shadow */}
      <ellipse cx={cx} cy={108 + headRy * 0.75} rx={headRx * 0.55} ry="12"
        fill="url(#chinShadow)" />

      {/* ── Ears ── */}
      <ellipse cx={cx - headRx - 1} cy="112" rx="7" ry="9" fill="url(#skinGrad)" />
      <ellipse cx={cx + headRx + 1} cy="112" rx="7" ry="9" fill="url(#skinGrad)" />
      <ellipse cx={cx - headRx - 1} cy="112" rx="4" ry="5.5" fill={skinShadow} opacity="0.35" />
      <ellipse cx={cx + headRx + 1} cy="112" rx="4" ry="5.5" fill={skinShadow} opacity="0.35" />

      {/* ── Hair ── */}
      {!isBald && renderHair(isFemale, isLongHair, cx, headRx, hairColor)}

      {/* ── Era head accessory ── */}
      {eraHat === "egypt" && eraDetail && renderEgyptHat(cx, headRx, eraDetail)}
      {eraHat === "laurel" && eraDetail && renderLaurelWreath(cx, eraDetail)}

      {/* ── Eye shadow (makeup) ── */}
      {eyeShadowHex && (
        <>
          <ellipse cx={eyeLx} cy={eyeY - 2} rx={eyeR + 5} ry={eyeR * 0.7}
            fill={eyeShadowHex} opacity="0.35" />
          <ellipse cx={eyeRx} cy={eyeY - 2} rx={eyeR + 5} ry={eyeR * 0.7}
            fill={eyeShadowHex} opacity="0.35" />
        </>
      )}

      {/* ── Eyebrows ── */}
      {renderBrows(browArched, browStraight, browW, hairColor,
        eyeLx, eyeRx, eyeY, eyeR, browLx1, browLx2, browRx1, browRx2)}

      {/* ── Eyes ── */}
      {renderEyes(esCode, eyeLx, eyeRx, eyeY, eyeR, eyeColor, skinShadow,
        isFemale, hairColor, hasEyeliner)}

      {/* ── Nose ── */}
      {renderNose(nsCode, cx, nosY, skinShadow)}

      {/* ── Blush ── */}
      {blushColor && (
        <>
          <ellipse cx={cx - headRx * 0.62} cy={nosY - 2} rx="11" ry="7"
            fill={blushColor} opacity="0.22" />
          <ellipse cx={cx + headRx * 0.62} cy={nosY - 2} rx="11" ry="7"
            fill={blushColor} opacity="0.22" />
        </>
      )}

      {/* ── Lips ── */}
      {renderLips(lsCode, cx, lipY, lipColor, skinShadow)}

      {/* Era accent glow ring */}
      <ellipse cx={cx} cy="108" rx={headRx + 4} ry={headRy + 4}
        stroke={accentColor} strokeWidth="1" fill="none" opacity="0.12" />

      {/* ── Arms ── */}
      {renderArms(eraStyle, cx, bLeft, bRight, clothColor, skinColor, eraDetail)}

      {/* Hands */}
      <ellipse cx={bLeft - 18} cy="232" rx="13" ry="11" fill="url(#skinGrad)" />
      <ellipse cx={bRight + 18} cy="232" rx="13" ry="11" fill="url(#skinGrad)" />

      {/* ── Legs ── */}
      {renderLegs(eraStyle, cx, bLeft, bRight, clothColor, isFemale, eraDetail)}
    </svg>
  );
}

// ── Render helpers ────────────────────────────────────────────

function renderBody(
  eraStyle: EraStyle, cx: number, bLeft: number, bRight: number,
  bHalf: number, clothColor: string, clothShadow: string,
  eraDetail: string | null, isFemale: boolean, skinColor: string
) {
  const w = bHalf * 2;
  if (eraStyle === "toga") return (
    <>
      <path d={`M${bLeft} 158 Q${bLeft - 3} 195 ${bLeft} 245 Q${cx} 255 ${bRight} 245 Q${bRight + 3} 195 ${bRight} 158Z`}
        fill={clothColor} opacity="0.95" />
      <path d={`M${bLeft} 158 Q${bLeft + 15} 168 ${cx} 162 Q${cx + 15} 168 ${bRight} 158`}
        fill={clothShadow} opacity="0.4" />
      {eraDetail && <circle cx={bRight - 4} cy="162" r="5" fill={eraDetail} opacity="0.9" />}
    </>
  );
  if (eraStyle === "robe") return (
    <>
      <path d={`M${bLeft - 4} 158 Q${bLeft - 8} 200 ${bLeft - 6} 245 Q${cx} 252 ${bRight + 6} 245 Q${bRight + 8} 200 ${bRight + 4} 158Z`}
        fill={clothColor} opacity="0.95" />
      <line x1={cx} y1="158" x2={cx} y2="245" stroke={clothShadow} strokeWidth="2" opacity="0.35" />
      {eraDetail && <rect x={bLeft} y="198" width={w} height="8" rx="4" fill={eraDetail} opacity="0.65" />}
    </>
  );
  if (eraStyle === "armor") return (
    <>
      <rect x={bLeft} y="158" width={w} height="85" rx="8" fill={clothColor} />
      <path d={`M${bLeft + 12} 162 Q${cx} 175 ${bRight - 12} 162 L${bRight - 15} 220 Q${cx} 228 ${bLeft + 15} 220Z`}
        fill={darken(clothColor, 15)} opacity="0.8" />
      <line x1={cx} y1="162" x2={cx} y2="220" stroke={eraDetail ?? "#708090"} strokeWidth="2" opacity="0.6" />
    </>
  );
  if (eraStyle === "kimono") return (
    <>
      <rect x={bLeft} y="158" width={w} height="85" rx="8" fill={clothColor} />
      <path d={`M${bLeft + 16} 158 L${cx} 185 L${bRight - 16} 158`} fill={eraDetail ?? clothShadow} opacity="0.8" />
      {eraDetail && <rect x={bLeft + 2} y="205" width={w - 4} height="12" rx="3" fill={eraDetail} opacity="0.65" />}
    </>
  );
  if (eraStyle === "space") return (
    <>
      <rect x={bLeft - 2} y="155" width={w + 4} height="90" rx="12" fill={clothColor} />
      <path d={`M${bLeft + 16} 155 Q${cx} 148 ${bRight - 16} 155 L${bRight - 20} 170 Q${cx} 165 ${bLeft + 20} 170Z`}
        fill={darken(clothColor, 20)} opacity="0.9" />
      {eraDetail && <>
        <line x1={cx} y1="170" x2={cx} y2="240" stroke={eraDetail} strokeWidth="2" opacity="0.5" />
        <rect x={cx - 18} y="188" width="36" height="18" rx="4" fill={eraDetail} opacity="0.18" />
      </>}
    </>
  );
  // modern / default
  return (
    <>
      <rect x={bLeft} y="158" width={w} height="85" rx="10" fill={clothColor} />
      <path d={`M${bLeft + 18} 158 L${cx} 175 L${bRight - 18} 158`} fill={clothShadow} opacity="0.55" />
      {eraDetail && <line x1={cx} y1="175" x2={cx} y2="240" stroke={eraDetail} strokeWidth="1.5" opacity="0.25" />}
    </>
  );
}

function renderHair(isFemale: boolean, isLongHair: boolean, cx: number, headRx: number, hairColor: string) {
  return (
    <>
      {/* Hair cap */}
      <ellipse cx={cx} cy="80" rx={headRx + 2} ry="27" fill={hairColor} />
      {isLongHair ? (
        <>
          <path d={`M${cx - headRx} 88 Q${cx - headRx - 12} 130 ${cx - headRx - 8} 202`}
            stroke={hairColor} strokeWidth="20" strokeLinecap="round" fill="none" />
          <path d={`M${cx + headRx} 88 Q${cx + headRx + 12} 130 ${cx + headRx + 8} 202`}
            stroke={hairColor} strokeWidth="20" strokeLinecap="round" fill="none" />
          {/* Highlight */}
          <path d={`M${cx - headRx + 4} 92 Q${cx - headRx - 6} 130 ${cx - headRx - 2} 190`}
            stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.12" />
        </>
      ) : (
        <>
          <rect x={cx - headRx - 2} y="86" width="14" height="28" rx="7" fill={hairColor} />
          <rect x={cx + headRx - 12} y="86" width="14" height="28" rx="7" fill={hairColor} />
        </>
      )}
      {/* Sheen */}
      <ellipse cx={cx - 7} cy="72" rx="16" ry="9" fill="url(#hairSheen)" />
      {isFemale && (
        <line x1={cx} y1="66" x2={cx} y2="80" stroke={darken(hairColor, 18)} strokeWidth="1.5" opacity="0.45" />
      )}
    </>
  );
}

function renderEgyptHat(cx: number, headRx: number, detail: string) {
  return (
    <>
      <rect x={cx - headRx} y="70" width={headRx * 2} height="10" rx="4" fill={detail} opacity="0.85" />
      <path d={`M${cx - headRx} 70 Q${cx - headRx - 7} 100 ${cx - headRx - 2} 140`}
        stroke={detail} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d={`M${cx + headRx} 70 Q${cx + headRx + 7} 100 ${cx + headRx + 2} 140`}
        stroke={detail} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx={cx} cy="55" r="4" fill={detail} opacity="0.9" />
    </>
  );
}

function renderLaurelWreath(cx: number, detail: string) {
  return (
    <>
      {[58,66,74,82,90,98,106,114,122].map((x, i) => (
        <ellipse key={i} cx={x} cy={70} rx="5" ry="8"
          fill={detail} opacity="0.72"
          transform={`rotate(${(x - cx) * 0.8} ${x} 70)`} />
      ))}
      <ellipse cx={cx} cy="68" rx="6" ry="4" fill={detail} opacity="0.88" />
    </>
  );
}

function renderBrows(
  browArched: boolean, browStraight: boolean, browW: number,
  hairColor: string, eyeLx: number, eyeRx: number, eyeY: number,
  eyeR: number, lx1: number, lx2: number, rx1: number, rx2: number
) {
  const browY = eyeY - eyeR - 10;
  const archH = browArched ? -7 : browStraight ? 0 : -4;
  return (
    <>
      <path
        d={`M${lx1} ${browY} Q${(lx1 + lx2) / 2} ${browY + archH} ${lx2} ${browY}`}
        stroke={hairColor} strokeWidth={browW} strokeLinecap="round" fill="none"
      />
      <path
        d={`M${rx1} ${browY} Q${(rx1 + rx2) / 2} ${browY + archH} ${rx2} ${browY}`}
        stroke={hairColor} strokeWidth={browW} strokeLinecap="round" fill="none"
      />
    </>
  );
}

function renderEyes(
  esCode: string, lx: number, rx: number, ey: number, eyeR: number,
  eyeColor: string, skinShadow: string,
  isFemale: boolean, hairColor: string, hasEyeliner: boolean
) {
  // Eye shape geometry
  const eRx = esCode === "ES002" ? eyeR + 1.5
            : esCode === "ES007" ? eyeR + 2.5
            : eyeR;
  const eRy = esCode === "ES002" ? eyeR + 0.5
            : esCode === "ES007" ? eyeR + 1.5
            : eyeR * 0.75;
  const eHood = esCode === "ES003" ? 3 : 0;
  // Tilt: outer corners up (negative) or down (positive)
  const eTilt = esCode === "ES004" ? -4 : esCode === "ES005" ? 4 : 0;
  // Deep-set: extra shadow above
  const deepSet = esCode === "ES006";

  return (
    <>
      {/* Deep-set brow shadow */}
      {deepSet && (
        <>
          <ellipse cx={lx} cy={ey - eRy - 4} rx={eRx + 4} ry="3" fill={skinShadow} opacity="0.25" />
          <ellipse cx={rx} cy={ey - eRy - 4} rx={eRx + 4} ry="3" fill={skinShadow} opacity="0.25" />
        </>
      )}
      {/* Eye whites */}
      <ellipse cx={lx} cy={ey} rx={eRx + 3} ry={eRy + 2} fill="white" />
      <ellipse cx={rx} cy={ey} rx={eRx + 3} ry={eRy + 2} fill="white" />
      {/* Iris */}
      <circle cx={lx} cy={ey} r={eyeR} fill="url(#irisGrad)" />
      <circle cx={rx} cy={ey} r={eyeR} fill="url(#irisGrad)" />
      {/* Limbal ring */}
      <circle cx={lx} cy={ey} r={eyeR} stroke={darken(eyeColor, 25)} strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx={rx} cy={ey} r={eyeR} stroke={darken(eyeColor, 25)} strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Pupil */}
      <circle cx={lx} cy={ey} r={eyeR * 0.55} fill="#050505" />
      <circle cx={rx} cy={ey} r={eyeR * 0.55} fill="#050505" />
      {/* Catchlight */}
      <circle cx={lx + eyeR * 0.28} cy={ey - eyeR * 0.28} r={eyeR * 0.22} fill="white" opacity="0.9" />
      <circle cx={rx + eyeR * 0.28} cy={ey - eyeR * 0.28} r={eyeR * 0.22} fill="white" opacity="0.9" />
      {/* Small secondary catchlight */}
      <circle cx={lx - eyeR * 0.3} cy={ey + eyeR * 0.2} r={eyeR * 0.1} fill="white" opacity="0.4" />
      <circle cx={rx - eyeR * 0.3} cy={ey + eyeR * 0.2} r={eyeR * 0.1} fill="white" opacity="0.4" />
      {/* Upper eyelid — with tilt on outer corners */}
      <path d={`M${lx - eRx - 3} ${ey - eHood} Q${lx} ${ey - eRy - 4 - eHood} ${lx + eRx + 3} ${ey - eHood + eTilt}`}
        stroke={skinShadow} strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d={`M${rx - eRx - 3} ${ey - eHood + eTilt} Q${rx} ${ey - eRy - 4 - eHood} ${rx + eRx + 3} ${ey - eHood}`}
        stroke={skinShadow} strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Lower eyelid */}
      <path d={`M${lx - eRx - 2} ${ey + 1} Q${lx} ${ey + eRy + 2} ${lx + eRx + 2} ${ey + 1 + eTilt}`}
        stroke={skinShadow} strokeWidth="0.7" fill="none" opacity="0.3" />
      <path d={`M${rx - eRx - 2} ${ey + 1 + eTilt} Q${rx} ${ey + eRy + 2} ${rx + eRx + 2} ${ey + 1}`}
        stroke={skinShadow} strokeWidth="0.7" fill="none" opacity="0.3" />
      {/* Lashes (female or eyeliner) */}
      {(isFemale || hasEyeliner) && (
        <>
          <path d={`M${lx - eRx - 2} ${ey - eHood} Q${lx} ${ey - eRy - 5 - eHood} ${lx + eRx + 2} ${ey - eHood + eTilt}`}
            stroke={hairColor} strokeWidth="2" fill="none" opacity="0.9" />
          <path d={`M${rx - eRx - 2} ${ey - eHood + eTilt} Q${rx} ${ey - eRy - 5 - eHood} ${rx + eRx + 2} ${ey - eHood}`}
            stroke={hairColor} strokeWidth="2" fill="none" opacity="0.9" />
        </>
      )}
    </>
  );
}

function renderNose(nsCode: string, cx: number, ny: number, skinShadow: string) {
  const tipY = ny + 10;
  switch (nsCode) {
    case "NS002": // Button — small and round
      return (
        <>
          <path d={`M${cx - 3} ${ny} Q${cx} ${ny + 7} ${cx + 3} ${ny}`}
            stroke={skinShadow} strokeWidth="1.2" fill="none" opacity="0.4" />
          <circle cx={cx - 3} cy={tipY - 2} r="1.5" fill={skinShadow} opacity="0.28" />
          <circle cx={cx + 3} cy={tipY - 2} r="1.5" fill={skinShadow} opacity="0.28" />
        </>
      );
    case "NS003": // Wide — broad nostrils
      return (
        <>
          <path d={`M${cx - 5} ${ny} Q${cx} ${ny + 11} ${cx + 5} ${ny}`}
            stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />
          <ellipse cx={cx - 6} cy={tipY} rx="4" ry="3" fill={skinShadow} opacity="0.28" />
          <ellipse cx={cx + 6} cy={tipY} rx="4" ry="3" fill={skinShadow} opacity="0.28" />
        </>
      );
    case "NS004": // Narrow — refined
      return (
        <>
          <path d={`M${cx - 2} ${ny - 2} Q${cx} ${ny + 10} ${cx + 2} ${ny - 2}`}
            stroke={skinShadow} strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx={cx - 2} cy={tipY} r="1.2" fill={skinShadow} opacity="0.25" />
          <circle cx={cx + 2} cy={tipY} r="1.2" fill={skinShadow} opacity="0.25" />
        </>
      );
    case "NS005": // Wide — flared nostrils
      return (
        <>
          <path d={`M${cx - 5} ${ny} Q${cx} ${ny + 11} ${cx + 5} ${ny}`}
            stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />
          <ellipse cx={cx - 6} cy={tipY} rx="4" ry="3" fill={skinShadow} opacity="0.28" />
          <ellipse cx={cx + 6} cy={tipY} rx="4" ry="3" fill={skinShadow} opacity="0.28" />
        </>
      );
    case "NS006": // Narrow — slim refined
      return (
        <>
          <path d={`M${cx - 1.5} ${ny - 3} Q${cx} ${ny + 10} ${cx + 1.5} ${ny - 3}`}
            stroke={skinShadow} strokeWidth="0.9" fill="none" opacity="0.38" />
          <circle cx={cx - 1.5} cy={tipY} r="1" fill={skinShadow} opacity="0.22" />
          <circle cx={cx + 1.5} cy={tipY} r="1" fill={skinShadow} opacity="0.22" />
        </>
      );
    default: // NS001 — straight / default
      return (
        <>
          <path d={`M${cx - 4} ${ny} Q${cx} ${ny + 11} ${cx + 4} ${ny}`}
            stroke={skinShadow} strokeWidth="1.4" fill="none" opacity="0.42" />
          <circle cx={cx - 4} cy={tipY} r="2" fill={skinShadow} opacity="0.27" />
          <circle cx={cx + 4} cy={tipY} r="2" fill={skinShadow} opacity="0.27" />
        </>
      );
  }
}

function renderLips(lsCode: string, cx: number, ly: number, lipColor: string, skinShadow: string) {
  const dark = darken(lipColor, 22);
  switch (lsCode) {
    case "LS001": // Thin
      return (
        <>
          <path d={`M${cx - 13} ${ly} Q${cx} ${ly + 5} ${cx + 13} ${ly}`} fill={lipColor} opacity="0.85" />
          <path d={`M${cx - 13} ${ly} Q${cx - 4} ${ly - 2} ${cx} ${ly - 1} Q${cx + 4} ${ly - 2} ${cx + 13} ${ly} Q${cx} ${ly - 4} ${cx - 13} ${ly}Z`}
            fill={lipColor} opacity="0.6" />
          <path d={`M${cx - 8} ${ly} Q${cx} ${ly - 3} ${cx + 8} ${ly}`}
            stroke={dark} strokeWidth="0.8" fill="none" opacity="0.4" />
        </>
      );
    case "LS002": // Full
      return (
        <>
          <path d={`M${cx - 15} ${ly} Q${cx} ${ly + 10} ${cx + 15} ${ly}`} fill={lipColor} />
          <path d={`M${cx - 15} ${ly} Q${cx - 5} ${ly - 5} ${cx} ${ly - 3} Q${cx + 5} ${ly - 5} ${cx + 15} ${ly} Q${cx} ${ly - 7} ${cx - 15} ${ly}Z`}
            fill={lipColor} opacity="0.75" />
          <path d={`M${cx - 10} ${ly} Q${cx} ${ly - 5} ${cx + 10} ${ly}`}
            stroke={dark} strokeWidth="1" fill="none" opacity="0.45" />
          <ellipse cx={cx} cy={ly + 4} rx="6" ry="2" fill="white" opacity="0.12" />
        </>
      );
    case "LS003": // Heart / Cupid's bow
      return (
        <>
          <path d={`M${cx - 14} ${ly} Q${cx} ${ly + 8} ${cx + 14} ${ly}`} fill={lipColor} />
          <path d={`M${cx - 14} ${ly} Q${cx - 7} ${ly - 6} ${cx - 2} ${ly - 2} Q${cx} ${ly - 5} ${cx + 2} ${ly - 2} Q${cx + 7} ${ly - 6} ${cx + 14} ${ly} Q${cx} ${ly - 7} ${cx - 14} ${ly}Z`}
            fill={lipColor} opacity="0.78" />
          <path d={`M${cx - 8} ${ly} Q${cx - 2} ${ly - 5} ${cx} ${ly - 4} Q${cx + 2} ${ly - 5} ${cx + 8} ${ly}`}
            stroke={dark} strokeWidth="1" fill="none" opacity="0.5" />
        </>
      );
    case "LS004": // Wide
      return (
        <>
          <path d={`M${cx - 18} ${ly} Q${cx} ${ly + 7} ${cx + 18} ${ly}`} fill={lipColor} />
          <path d={`M${cx - 18} ${ly} Q${cx - 6} ${ly - 4} ${cx} ${ly - 3} Q${cx + 6} ${ly - 4} ${cx + 18} ${ly} Q${cx} ${ly - 6} ${cx - 18} ${ly}Z`}
            fill={lipColor} opacity="0.72" />
          <path d={`M${cx - 12} ${ly} Q${cx} ${ly - 4} ${cx + 12} ${ly}`}
            stroke={dark} strokeWidth="0.9" fill="none" opacity="0.4" />
        </>
      );
    default: // LS005 / default — pouty
      return (
        <>
          <path d={`M${cx - 14} ${ly} Q${cx} ${ly + 9} ${cx + 14} ${ly}`} fill={lipColor} />
          <path d={`M${cx - 14} ${ly} Q${cx - 4} ${ly - 4} ${cx} ${ly - 3} Q${cx + 4} ${ly - 4} ${cx + 14} ${ly} Q${cx} ${ly - 6} ${cx - 14} ${ly}Z`}
            fill={lipColor} opacity="0.72" />
          <path d={`M${cx - 9} ${ly} Q${cx} ${ly - 4} ${cx + 9} ${ly}`}
            stroke={dark} strokeWidth="1" fill="none" opacity="0.45" />
        </>
      );
  }
}

function renderArms(
  eraStyle: EraStyle, cx: number, bLeft: number, bRight: number,
  clothColor: string, skinColor: string, eraDetail: string | null
) {
  if (eraStyle === "space") return (
    <>
      <rect x={bLeft - 32} y="158" width="32" height="68" rx="10" fill={clothColor} />
      <rect x={bRight}     y="158" width="32" height="68" rx="10" fill={clothColor} />
      {eraDetail && <>
        <rect x={bLeft - 28} y="195" width="24" height="6" rx="3" fill={eraDetail} opacity="0.45" />
        <rect x={bRight + 4} y="195" width="24" height="6" rx="3" fill={eraDetail} opacity="0.45" />
      </>}
    </>
  );
  if (eraStyle === "armor") return (
    <>
      <rect x={bLeft - 30} y="162" width="28" height="60" rx="12" fill={skinColor} />
      <rect x={bRight + 2} y="162" width="28" height="60" rx="12" fill={skinColor} />
      <rect x={bLeft - 32} y="202" width="32" height="16" rx="4" fill={clothColor} opacity="0.88" />
      <rect x={bRight}     y="202" width="32" height="16" rx="4" fill={clothColor} opacity="0.88" />
    </>
  );
  if (eraStyle === "robe" || eraStyle === "toga") return (
    <>
      <path d={`M${bLeft} 162 Q${bLeft - 22} 185 ${bLeft - 12} 228`}
        stroke={clothColor} strokeWidth="26" strokeLinecap="round" fill="none" />
      <path d={`M${bRight} 162 Q${bRight + 22} 185 ${bRight + 12} 228`}
        stroke={clothColor} strokeWidth="26" strokeLinecap="round" fill="none" />
    </>
  );
  // modern / kimono / default
  return (
    <>
      <rect x={bLeft - 30} y="162" width="30" height="65" rx="14" fill={clothColor} />
      <rect x={bRight}     y="162" width="30" height="65" rx="14" fill={clothColor} />
      <rect x={bLeft - 30} y="162" width="8"  height="65" rx="14" fill="black" opacity="0.08" />
      <rect x={bRight + 22} y="162" width="8" height="65" rx="14" fill="black" opacity="0.07" />
    </>
  );
}

function renderLegs(
  eraStyle: EraStyle, cx: number, bLeft: number, bRight: number,
  clothColor: string, isFemale: boolean, eraDetail: string | null
) {
  if (eraStyle === "robe" || eraStyle === "toga" || eraStyle === "kimono") return (
    <path d={`M${bLeft - 4} 240 Q${bLeft - 8} 292 ${bLeft + 5} 295 Q${cx} 300 ${bRight - 5} 295 Q${bRight + 8} 292 ${bRight + 4} 240Z`}
      fill={clothColor} opacity="0.9" />
  );
  if (eraStyle === "space") return (
    <>
      <rect x={cx - 34} y="242" width="30" height="52" rx="10" fill={clothColor} />
      <rect x={cx + 4}  y="242" width="30" height="52" rx="10" fill={clothColor} />
      {eraDetail && <>
        <rect x={cx - 32} y="262" width="26" height="5" rx="2" fill={eraDetail} opacity="0.45" />
        <rect x={cx + 6}  y="262" width="26" height="5" rx="2" fill={eraDetail} opacity="0.45" />
      </>}
    </>
  );
  if (isFemale) return (
    <path d={`M${bLeft} 240 Q${bLeft - 8} 290 ${bLeft + 5} 292 Q${cx} 298 ${bRight - 5} 292 Q${bRight + 8} 290 ${bRight} 240Z`}
      fill={clothColor} opacity="0.9" />
  );
  // Male pants
  return (
    <>
      <rect x={cx - 32} y="240" width="28" height="55" rx="12" fill={darken(clothColor, 15)} />
      <rect x={cx + 4}  y="240" width="28" height="55" rx="12" fill={darken(clothColor, 15)} />
    </>
  );
}
