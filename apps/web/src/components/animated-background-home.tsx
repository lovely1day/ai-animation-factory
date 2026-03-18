"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AnimatedBackgroundHome() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Base gradient - smooth dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#0a0a0f] to-[#080510]" />
      
      {/* Large JL Logo - Top Right Corner - Slow elegant float */}
      <motion.div
        className="absolute -right-40 -top-40 w-[700px] h-[700px]"
        style={{ opacity: 0.18 }}
        animate={{
          y: [0, -40, 0, -20, 0],
          x: [0, 20, 0, -10, 0],
          rotate: [0, 8, 0, -5, 0],
          scale: [1, 1.08, 1, 1.02, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 80px rgba(139,92,246,0.3)) saturate(1.2)",
          }}
          priority
        />
      </motion.div>

      {/* Large JL Logo - Bottom Left - Counter movement */}
      <motion.div
        className="absolute -left-48 -bottom-48 w-[600px] h-[600px]"
        style={{ opacity: 0.15 }}
        animate={{
          y: [0, 30, 0, 50, 0],
          x: [0, -20, 0, 15, 0],
          rotate: [0, -10, 0, 8, 0],
          scale: [1, 1.05, 1.1, 1.03, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 70px rgba(6,182,212,0.25)) saturate(1.1)",
          }}
          priority
        />
      </motion.div>

      {/* Medium JL Logo - Center Left - Gentle sway */}
      <motion.div
        className="absolute left-[10%] top-[40%] w-[350px] h-[350px]"
        style={{ opacity: 0.12 }}
        animate={{
          y: [0, -25, 0, 35, 0],
          rotate: [0, 15, 0, -10, 0],
          scale: [1, 1.12, 1, 1.08, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 50px rgba(236,72,153,0.2)) saturate(1.3)",
          }}
          priority
        />
      </motion.div>

      {/* Medium JL Logo - Center Right - Slow drift */}
      <motion.div
        className="absolute right-[15%] top-[55%] w-[300px] h-[300px]"
        style={{ opacity: 0.1 }}
        animate={{
          y: [0, 20, 0, -30, 0],
          x: [0, 25, 0, -15, 0],
          rotate: [0, -12, 0, 18, 0],
          scale: [1, 1.06, 1, 1.1, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 45px rgba(139,92,246,0.25)) saturate(1.2)",
          }}
          priority
        />
      </motion.div>

      {/* Small JL Logo - Top Center - Subtle presence */}
      <motion.div
        className="absolute left-[45%] top-[5%] w-[200px] h-[200px]"
        style={{ opacity: 0.08 }}
        animate={{
          y: [0, -15, 0, -25, 0],
          rotate: [0, 20, 0, -15, 0],
          scale: [1, 1.15, 1, 1.05, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 40px rgba(168,85,247,0.2)) saturate(1.1)",
          }}
          priority
        />
      </motion.div>

      {/* Very subtle center logo - almost like a watermark */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px]"
        style={{ opacity: 0.06 }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 60px rgba(139,92,246,0.15)) saturate(1.2)",
          }}
          priority
        />
      </motion.div>

      {/* Elegant ambient orbs - very slow */}
      <motion.div
        className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 80, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-[25%] right-[20%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
        animate={{
          scale: [1, 1.4, 1],
          y: [0, -60, 0],
          x: [0, -40, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
      />

      <motion.div
        className="absolute top-[60%] right-[40%] w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 60%)",
          filter: "blur(55px)",
        }}
        animate={{
          scale: [1, 1.5, 1],
          x: [0, 60, 0],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 20,
        }}
      />

      {/* Floating dust particles - very subtle */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-purple-300/30"
          style={{
            left: `${5 + i * 8}%`,
            top: `${10 + (i % 5) * 18}%`,
          }}
          animate={{
            y: [-40, 40, -40],
            x: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.2,
          }}
        />
      ))}

      {/* Subtle vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.4) 100%)",
        }}
      />
    </div>
  );
}
