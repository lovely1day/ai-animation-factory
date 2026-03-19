"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const PARTICLES = [
  { id:0,  x:"38%", y:"25%", size:340, opacity:0.06, duration:40, delay:0,  rotate:[0,8,-5,0],   driftX:[0,25,-15,0], driftY:[0,-30,20,0] },
  { id:1,  x:"70%", y:"55%", size:260, opacity:0.07, duration:35, delay:5,  rotate:[0,-12,8,0],  driftX:[0,-30,20,0], driftY:[0,35,-25,0] },
  { id:2,  x:"5%",  y:"40%", size:240, opacity:0.06, duration:38, delay:12, rotate:[0,10,-14,0], driftX:[0,30,-10,0], driftY:[0,-20,30,0] },
  { id:3,  x:"55%", y:"5%",  size:180, opacity:0.09, duration:28, delay:3,  rotate:[0,-18,12,0], driftX:[0,-20,30,0], driftY:[0,40,-20,0] },
  { id:4,  x:"20%", y:"70%", size:170, opacity:0.08, duration:30, delay:8,  rotate:[0,15,-10,0], driftX:[0,35,-15,0], driftY:[0,-35,25,0] },
  { id:5,  x:"82%", y:"12%", size:160, opacity:0.09, duration:26, delay:16, rotate:[0,-8,18,0],  driftX:[0,-15,25,0], driftY:[0,30,-18,0] },
  { id:6,  x:"48%", y:"80%", size:110, opacity:0.12, duration:22, delay:2,  rotate:[0,20,-15,0], driftX:[0,20,-30,0], driftY:[0,-25,35,0] },
  { id:7,  x:"88%", y:"70%", size:100, opacity:0.13, duration:20, delay:7,  rotate:[0,-22,14,0], driftX:[0,-25,15,0], driftY:[0,20,-30,0] },
  { id:8,  x:"14%", y:"10%", size:115, opacity:0.11, duration:24, delay:11, rotate:[0,12,-20,0], driftX:[0,30,-10,0], driftY:[0,-30,20,0] },
  { id:9,  x:"32%", y:"50%", size:70,  opacity:0.16, duration:18, delay:4,  rotate:[0,-25,18,0], driftX:[0,-20,30,0], driftY:[0,25,-35,0] },
  { id:10, x:"72%", y:"30%", size:60,  opacity:0.18, duration:16, delay:9,  rotate:[0,28,-16,0], driftX:[0,25,-20,0], driftY:[0,-20,28,0] },
  { id:11, x:"90%", y:"90%", size:65,  opacity:0.15, duration:19, delay:14, rotate:[0,-18,24,0], driftX:[0,-30,12,0], driftY:[0,22,-25,0] },
];

export function FloatingLogoBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          style={{ position: "absolute", left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ x: p.driftX, y: p.driftY, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          {/* Glow — separate radial-gradient div, never touches img boundary */}
          <div style={{
            position: "absolute",
            inset: "10%",
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 50%, rgba(139,92,246,0.5) 0%, rgba(6,182,212,0.3) 50%, transparent 70%)",
            filter: `blur(${p.size * 0.18}px)`,
            opacity: p.opacity * 2.5,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }} />

          {/* Logo — contrast(20) crushes near-black → pure black → invisible via screen */}
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image
              src="/images/jl-logo.png"
              alt=""
              fill
              sizes={`${p.size}px`}
              draggable={false}
              style={{
                objectFit: "contain",
                opacity: p.opacity,
                mixBlendMode: "screen",
                filter: "contrast(20) brightness(0.4) saturate(3)",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        </motion.div>
      ))}

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,5,11,0.6) 100%)"
      }} />
    </div>
  );
}
