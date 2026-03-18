"use client";
// ============================================================
// EraEnvironment — Phase C Era Atmosphere
//
// Renders layered atmospheric visuals inside the avatar frame:
//   Layer 1: Sky gradient (era-tinted atmosphere)
//   Layer 2: Horizon / ground glow
//   Layer 3: Silhouette (desert dunes / forest / ruins / city...)
//   Layer 4: Particles (stars / embers / sand / neon...)
//   Layer 5: Ambient light overlay
// ============================================================

import React from "react";

// ─── ERA GROUP MAPPING ─────────────────────────────────────

type EraGroup =
  | "prehistoric" | "ancient_desert" | "ancient_sea" | "asian"
  | "islamic" | "medieval" | "renaissance" | "victorian"
  | "retro_gold" | "wartime" | "midcentury" | "retro_vivid"
  | "neon80s" | "digital" | "modern" | "near_future"
  | "far_future" | "cyberpunk" | "steampunk" | "fantasy_light"
  | "fantasy_dark" | "post_apoc" | "default";

function getEraGroup(eraCode: string): EraGroup {
  if (/CRETACEOUS|ICE_AGE|PREHISTORIC|ATLANTIS/.test(eraCode)) return "prehistoric";
  if (/EGYPT|SUMERIAN|BABYLONIAN|ASSYRIAN|PERSIAN/.test(eraCode))  return "ancient_desert";
  if (/GREEK|ROMAN|BYZANTINE/.test(eraCode))                       return "ancient_sea";
  if (/CHINA|TANG|MING|FEUDAL_JAPAN|ANCIENT_INDIA|MONGOL/.test(eraCode)) return "asian";
  if (/MAYAN|AZTEC|INCA/.test(eraCode))                            return "prehistoric"; // jungle
  if (/EARLY_ISLAM|ISLAMIC_GOLDEN|OTTOMAN|ANDALUS/.test(eraCode))  return "islamic";
  if (/VIKING|DARK_AGES|HIGH_MEDIEVAL|CRUSADES|LATE_MEDIEVAL/.test(eraCode)) return "medieval";
  if (/RENAISSANCE|EXPLORATION|BAROQUE/.test(eraCode))             return "renaissance";
  if (/ERA_1700|ERA_1800|ERA_1850|ERA_1900/.test(eraCode))         return "victorian";
  if (/ERA_1920|ERA_1930/.test(eraCode))                           return "retro_gold";
  if (/ERA_1940|ERA_1950/.test(eraCode))                           return "wartime";
  if (/ERA_1960|ERA_1970/.test(eraCode))                           return "midcentury";
  if (/ERA_1980/.test(eraCode))                                    return "neon80s";
  if (/ERA_1990|ERA_2000/.test(eraCode))                           return "digital";
  if (/ERA_2010|ERA_2024/.test(eraCode))                           return "modern";
  if (/NEAR_FUTURE/.test(eraCode))                                 return "near_future";
  if (/FAR_FUTURE|SPACE_AGE/.test(eraCode))                        return "far_future";
  if (/CYBERPUNK/.test(eraCode))                                   return "cyberpunk";
  if (/STEAMPUNK/.test(eraCode))                                   return "steampunk";
  if (/FANTASY_ANCIENT|FANTASY_MEDIEVAL|FANTASY_MYTHOLOGICAL/.test(eraCode)) return "fantasy_light";
  if (/FANTASY_POST_APOC|POST_APOC/.test(eraCode))                 return "post_apoc";
  return "default";
}

// ─── ERA VISUAL CONFIG ─────────────────────────────────────

type ParticleType = "stars" | "embers" | "sand" | "rain" | "neon" | "sparks" | "dust" | "none";
type SilType      = "desert" | "dunes" | "forest" | "ruins" | "city" | "mountains" | "space" | "industrial" | "none";

interface EraConfig {
  skyTop:    string;   // CSS color (top of avatar)
  skyBot:    string;   // CSS color (horizon)
  glowColor: string;   // Ambient ground glow
  silhouette: SilType;
  particles:  ParticleType;
  atmoAr:     string;  // Short atmosphere text
}

const ERA_CONFIGS: Record<EraGroup, EraConfig> = {
  prehistoric: {
    skyTop: "#0d2a1a", skyBot: "#1a4a2e",
    glowColor: "rgba(34,197,94,0.2)",
    silhouette: "forest", particles: "dust",
    atmoAr: "غابات بدائية",
  },
  ancient_desert: {
    skyTop: "#7c2d12", skyBot: "#f97316",
    glowColor: "rgba(251,191,36,0.3)",
    silhouette: "dunes", particles: "sand",
    atmoAr: "صحراء وأهرامات",
  },
  ancient_sea: {
    skyTop: "#1e3a5f", skyBot: "#c2410c",
    glowColor: "rgba(251,146,60,0.3)",
    silhouette: "ruins", particles: "dust",
    atmoAr: "روما وإغريق",
  },
  asian: {
    skyTop: "#450a0a", skyBot: "#dc2626",
    glowColor: "rgba(239,68,68,0.25)",
    silhouette: "mountains", particles: "dust",
    atmoAr: "الشرق الأقصى",
  },
  islamic: {
    skyTop: "#022c22", skyBot: "#15803d",
    glowColor: "rgba(52,211,153,0.25)",
    silhouette: "ruins", particles: "sparks",
    atmoAr: "حضارة إسلامية",
  },
  medieval: {
    skyTop: "#1c1917", skyBot: "#44403c",
    glowColor: "rgba(120,113,108,0.2)",
    silhouette: "forest", particles: "rain",
    atmoAr: "عصور وسطى",
  },
  renaissance: {
    skyTop: "#431407", skyBot: "#ea580c",
    glowColor: "rgba(251,146,60,0.3)",
    silhouette: "ruins", particles: "dust",
    atmoAr: "نهضة أوروبا",
  },
  victorian: {
    skyTop: "#1e1b4b", skyBot: "#4338ca",
    glowColor: "rgba(99,102,241,0.2)",
    silhouette: "industrial", particles: "dust",
    atmoAr: "الحقبة الفيكتورية",
  },
  retro_gold: {
    skyTop: "#1c1400", skyBot: "#a16207",
    glowColor: "rgba(234,179,8,0.3)",
    silhouette: "city", particles: "sparks",
    atmoAr: "آرت ديكو",
  },
  wartime: {
    skyTop: "#0f172a", skyBot: "#1e3a5f",
    glowColor: "rgba(59,130,246,0.2)",
    silhouette: "city", particles: "none",
    atmoAr: "حقبة الحرب",
  },
  midcentury: {
    skyTop: "#431407", skyBot: "#f97316",
    glowColor: "rgba(249,115,22,0.25)",
    silhouette: "city", particles: "none",
    atmoAr: "خمسينيات وستينيات",
  },
  retro_vivid: {
    skyTop: "#2d1b00", skyBot: "#d97706",
    glowColor: "rgba(217,119,6,0.3)",
    silhouette: "city", particles: "none",
    atmoAr: "سبعينيات",
  },
  neon80s: {
    skyTop: "#1a0030", skyBot: "#7c3aed",
    glowColor: "rgba(236,72,153,0.4)",
    silhouette: "city", particles: "neon",
    atmoAr: "ثمانينيات نيون",
  },
  digital: {
    skyTop: "#052e16", skyBot: "#166534",
    glowColor: "rgba(74,222,128,0.25)",
    silhouette: "city", particles: "sparks",
    atmoAr: "تسعينيات رقمية",
  },
  modern: {
    skyTop: "#0f0f1f", skyBot: "#1e1b4b",
    glowColor: "rgba(99,102,241,0.2)",
    silhouette: "city", particles: "none",
    atmoAr: "الحاضر",
  },
  near_future: {
    skyTop: "#0c1a2e", skyBot: "#0369a1",
    glowColor: "rgba(14,165,233,0.35)",
    silhouette: "city", particles: "sparks",
    atmoAr: "المستقبل القريب",
  },
  far_future: {
    skyTop: "#000000", skyBot: "#0f172a",
    glowColor: "rgba(14,165,233,0.2)",
    silhouette: "space", particles: "stars",
    atmoAr: "الفضاء والنجوم",
  },
  cyberpunk: {
    skyTop: "#0d001a", skyBot: "#4c1d95",
    glowColor: "rgba(168,85,247,0.4)",
    silhouette: "city", particles: "neon",
    atmoAr: "مدن الظلام",
  },
  steampunk: {
    skyTop: "#1c0f00", skyBot: "#92400e",
    glowColor: "rgba(217,119,6,0.35)",
    silhouette: "industrial", particles: "embers",
    atmoAr: "البخار والآلات",
  },
  fantasy_light: {
    skyTop: "#1e0a3c", skyBot: "#7e22ce",
    glowColor: "rgba(167,139,250,0.3)",
    silhouette: "mountains", particles: "sparks",
    atmoAr: "عالم السحر",
  },
  fantasy_dark: {
    skyTop: "#050010", skyBot: "#2e1065",
    glowColor: "rgba(139,92,246,0.3)",
    silhouette: "mountains", particles: "stars",
    atmoAr: "فنتازيا مظلمة",
  },
  post_apoc: {
    skyTop: "#1c1400", skyBot: "#44403c",
    glowColor: "rgba(217,119,6,0.2)",
    silhouette: "ruins", particles: "dust",
    atmoAr: "ما بعد الكارثة",
  },
  default: {
    skyTop: "#13001f", skyBot: "#4c1d95",
    glowColor: "rgba(139,92,246,0.2)",
    silhouette: "none", particles: "none",
    atmoAr: "",
  },
};

// ─── STATIC PARTICLE POSITIONS ─────────────────────────────
// Fixed positions (not random) for SSR safety

const STAR_POS   = [[8,5],[18,12],[35,8],[50,3],[62,9],[74,5],[88,14],[12,22],[45,18],[80,25],[25,30],[60,28],[92,6],[5,35],[40,40]] as const;
const EMBER_POS  = [[20,80],[35,70],[50,85],[65,75],[80,82],[15,90],[45,88],[70,78],[30,92],[60,95]] as const;
const SAND_POS   = [[10,88],[22,92],[38,86],[55,90],[70,87],[85,93],[18,95],[50,96],[75,91],[42,94]] as const;
const RAIN_POS   = [[5,15],[15,30],[25,10],[35,45],[48,20],[58,38],[68,12],[78,50],[88,25],[95,40],[12,60],[30,75],[55,65],[72,80],[90,55]] as const;
const NEON_XPOS  = [12, 28, 44, 60, 76, 92] as const;
const SPARK_POS  = [[15,60],[30,45],[50,55],[70,50],[85,65],[40,70],[60,75],[25,80],[75,40],[90,30]] as const;
const DUST_POS   = [[10,20],[25,35],[40,25],[55,40],[70,30],[85,20],[20,50],[50,60],[80,45],[35,70]] as const;

// ─── SILHOUETTE SVG PATHS ──────────────────────────────────
// viewBox matches the parent (100 × 133 aspect)

function SilhouetteSVG({ type }: { type: SilType }) {
  if (type === "none") return null;

  const svgClass = "absolute bottom-0 left-0 w-full pointer-events-none opacity-60";

  switch (type) {
    case "dunes":
      return (
        <svg className={svgClass} viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,30 Q15,12 30,20 Q50,5 70,18 Q85,10 100,22 L100,30 Z"
            fill="rgba(120,70,20,0.55)" />
          <path d="M0,30 Q20,18 40,24 Q60,15 80,22 Q90,18 100,25 L100,30 Z"
            fill="rgba(92,50,12,0.7)" />
        </svg>
      );
    case "desert":
      return (
        <svg className={svgClass} viewBox="0 0 100 25" preserveAspectRatio="none">
          <path d="M0,25 Q25,15 50,20 Q75,10 100,18 L100,25 Z"
            fill="rgba(146,64,14,0.6)" />
        </svg>
      );
    case "forest":
      return (
        <svg className={svgClass} viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0,40 L0,28 L5,20 L10,28 L14,18 L18,28 L22,15 L26,28 L30,20 L34,28 L40,16 L46,28 L50,22 L54,28 L58,17 L62,28 L68,19 L72,28 L76,14 L80,28 L84,21 L88,28 L92,17 L96,28 L100,24 L100,40 Z"
            fill="rgba(20,83,45,0.65)" />
          <path d="M0,40 L0,32 L8,25 L16,32 L24,24 L32,32 L40,26 L48,32 L56,25 L64,32 L72,27 L80,32 L88,26 L96,32 L100,28 L100,40 Z"
            fill="rgba(15,60,30,0.8)" />
        </svg>
      );
    case "ruins":
      return (
        <svg className={svgClass} viewBox="0 0 100 35" preserveAspectRatio="none">
          <rect x="5"  y="18" width="8"  height="17" fill="rgba(80,60,40,0.7)" />
          <rect x="15" y="12" width="5"  height="23" fill="rgba(80,60,40,0.7)" />
          <rect x="22" y="20" width="3"  height="15" fill="rgba(80,60,40,0.6)" />
          <rect x="40" y="10" width="6"  height="25" fill="rgba(80,60,40,0.7)" />
          <rect x="48" y="15" width="10" height="20" fill="rgba(80,60,40,0.65)" />
          <rect x="60" y="8"  width="5"  height="27" fill="rgba(80,60,40,0.7)" />
          <rect x="68" y="16" width="8"  height="19" fill="rgba(80,60,40,0.6)" />
          <rect x="82" y="12" width="4"  height="23" fill="rgba(80,60,40,0.7)" />
          <rect x="88" y="20" width="7"  height="15" fill="rgba(80,60,40,0.6)" />
          <path d="M0,35 L100,35 L100,30 Q80,28 60,30 Q40,26 20,29 Q10,27 0,30 Z"
            fill="rgba(60,45,25,0.85)" />
        </svg>
      );
    case "city":
      return (
        <svg className={svgClass} viewBox="0 0 100 45" preserveAspectRatio="none">
          <rect x="0"  y="28" width="7"  height="17" fill="rgba(20,20,35,0.8)" />
          <rect x="8"  y="20" width="5"  height="25" fill="rgba(20,20,35,0.75)" />
          <rect x="14" y="25" width="9"  height="20" fill="rgba(20,20,35,0.8)" />
          <rect x="24" y="15" width="6"  height="30" fill="rgba(20,20,35,0.75)" />
          <rect x="31" y="22" width="8"  height="23" fill="rgba(20,20,35,0.8)" />
          <rect x="40" y="10" width="5"  height="35" fill="rgba(20,20,35,0.75)" />
          <rect x="46" y="18" width="7"  height="27" fill="rgba(20,20,35,0.8)" />
          <rect x="54" y="24" width="6"  height="21" fill="rgba(20,20,35,0.75)" />
          <rect x="61" y="16" width="8"  height="29" fill="rgba(20,20,35,0.8)" />
          <rect x="70" y="12" width="5"  height="33" fill="rgba(20,20,35,0.75)" />
          <rect x="76" y="20" width="9"  height="25" fill="rgba(20,20,35,0.8)" />
          <rect x="86" y="26" width="7"  height="19" fill="rgba(20,20,35,0.75)" />
          <rect x="94" y="22" width="6"  height="23" fill="rgba(20,20,35,0.8)" />
          {/* City lights (small dots) */}
          {[[10,27],[26,20],[42,15],[48,22],[63,20],[72,17],[78,24]] .map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="1" height="1" fill="rgba(250,204,21,0.7)" />
          ))}
        </svg>
      );
    case "mountains":
      return (
        <svg className={svgClass} viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0,40 L15,15 L30,30 L45,8 L60,25 L75,12 L90,28 L100,18 L100,40 Z"
            fill="rgba(40,30,60,0.65)" />
          <path d="M0,40 L10,25 L22,35 L35,18 L48,32 L62,20 L78,30 L88,22 L100,28 L100,40 Z"
            fill="rgba(30,20,45,0.8)" />
        </svg>
      );
    case "industrial":
      return (
        <svg className={svgClass} viewBox="0 0 100 40" preserveAspectRatio="none">
          {/* Chimneys */}
          <rect x="8"  y="15" width="5" height="25" fill="rgba(40,30,20,0.8)" />
          <rect x="20" y="20" width="5" height="20" fill="rgba(40,30,20,0.8)" />
          <rect x="38" y="10" width="6" height="30" fill="rgba(40,30,20,0.8)" />
          <rect x="55" y="18" width="5" height="22" fill="rgba(40,30,20,0.8)" />
          <rect x="70" y="14" width="6" height="26" fill="rgba(40,30,20,0.8)" />
          <rect x="85" y="20" width="5" height="20" fill="rgba(40,30,20,0.8)" />
          {/* Factory base */}
          <path d="M0,40 L0,30 L100,30 L100,40 Z" fill="rgba(30,22,12,0.9)" />
          {/* Smoke puffs */}
          <circle cx="10"  cy="12" r="4" fill="rgba(80,70,60,0.35)" />
          <circle cx="40"  cy="7"  r="5" fill="rgba(80,70,60,0.35)" />
          <circle cx="72"  cy="11" r="4" fill="rgba(80,70,60,0.35)" />
        </svg>
      );
    case "space":
      return (
        <svg className={svgClass} viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,20 Q50,5 100,20 L100,20 Z"
            fill="rgba(15,23,42,0.6)" />
          {/* Planet silhouette */}
          <circle cx="75" cy="10" r="8" fill="rgba(8,51,68,0.7)" />
          <ellipse cx="75" cy="10" rx="12" ry="3" fill="none"
            stroke="rgba(14,165,233,0.4)" strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── PARTICLE COMPONENTS ───────────────────────────────────

function StarParticles() {
  return (
    <>
      {STAR_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width:  i % 3 === 0 ? "2px" : "1.5px",
            height: i % 3 === 0 ? "2px" : "1.5px",
            opacity: 0.4 + (i % 4) * 0.15,
            animationDelay: `${(i * 0.3) % 2}s`,
            animationDuration: `${2 + (i % 3)}s`,
          }}
        />
      ))}
    </>
  );
}

function EmberParticles() {
  return (
    <>
      {EMBER_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-orange-400 animate-bounce"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width: "2px", height: "2px",
            opacity: 0.5 + (i % 3) * 0.1,
            animationDelay: `${(i * 0.2) % 1.5}s`,
            animationDuration: `${1 + (i % 2) * 0.5}s`,
          }}
        />
      ))}
    </>
  );
}

function SandParticles() {
  return (
    <>
      {SAND_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-300"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width: i % 2 === 0 ? "2.5px" : "1.5px",
            height: "1px",
            opacity: 0.2 + (i % 3) * 0.08,
          }}
        />
      ))}
    </>
  );
}

function RainParticles() {
  return (
    <>
      {RAIN_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute bg-blue-300/30 animate-pulse"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width: "1px", height: "8px",
            transform: "rotate(10deg)",
            animationDelay: `${(i * 0.15) % 1}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </>
  );
}

function NeonParticles() {
  return (
    <>
      {NEON_XPOS.map((x, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${30 + (i % 4) * 8}%`,
            width: `${8 + (i % 3) * 4}%`, height: "1px",
            background: i % 2 === 0
              ? "rgba(236,72,153,0.6)"
              : "rgba(139,92,246,0.6)",
            boxShadow: i % 2 === 0
              ? "0 0 6px rgba(236,72,153,0.8)"
              : "0 0 6px rgba(139,92,246,0.8)",
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${1.5 + i * 0.2}s`,
          }}
        />
      ))}
    </>
  );
}

function SparkParticles() {
  return (
    <>
      {SPARK_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full animate-ping"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width: "2px", height: "2px",
            backgroundColor: i % 3 === 0
              ? "rgba(167,139,250,0.7)"
              : i % 3 === 1
                ? "rgba(251,191,36,0.7)"
                : "rgba(255,255,255,0.5)",
            animationDelay: `${(i * 0.4) % 2}s`,
            animationDuration: `${1.5 + (i % 3) * 0.5}s`,
          }}
        />
      ))}
    </>
  );
}

function DustParticles() {
  return (
    <>
      {DUST_POS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          /* eslint-disable-next-line react/forbid-component-props */
          style={{
            left: `${x}%`, top: `${y}%`,
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            backgroundColor: "rgba(200,180,140,0.25)",
          }}
        />
      ))}
    </>
  );
}

function Particles({ type }: { type: ParticleType }) {
  switch (type) {
    case "stars":  return <StarParticles />;
    case "embers": return <EmberParticles />;
    case "sand":   return <SandParticles />;
    case "rain":   return <RainParticles />;
    case "neon":   return <NeonParticles />;
    case "sparks": return <SparkParticles />;
    case "dust":   return <DustParticles />;
    default:       return null;
  }
}

// ─── PROPS ─────────────────────────────────────────────────

interface EraEnvironmentProps {
  eraCode?: string;
}

// ─── COMPONENT ─────────────────────────────────────────────

export function EraEnvironment({ eraCode }: EraEnvironmentProps) {
  const group  = eraCode ? getEraGroup(eraCode) : "default";
  const config = ERA_CONFIGS[group];

  return (
    <>
      {/* Layer 1: Sky gradient */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        /* eslint-disable-next-line react/forbid-component-props */
        style={{
          background: `linear-gradient(to bottom, ${config.skyTop} 0%, ${config.skyBot} 60%, transparent 100%)`,
        }}
      />

      {/* Layer 2: Ground / horizon glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 transition-colors duration-700"
        /* eslint-disable-next-line react/forbid-component-props */
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${config.glowColor}, transparent 70%)`,
        }}
      />

      {/* Layer 3: Silhouette */}
      <SilhouetteSVG type={config.silhouette} />

      {/* Layer 4: Particles */}
      <Particles type={config.particles} />

      {/* Layer 5: Atmosphere text badge (top-left) */}
      {config.atmoAr && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] text-white/30 font-medium tracking-wide">
            {config.atmoAr}
          </span>
        </div>
      )}
    </>
  );
}
