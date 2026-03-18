"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#0a0a0f]/95" />
      
      {/* Animated JL Logo - Top Right */}
      <motion.div
        className="absolute -right-20 -top-20 w-[500px] h-[500px] opacity-[0.25]"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 5, 0, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 20,
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
            filter: "drop-shadow(0 0 60px rgba(139,92,246,0.4))",
          }}
          priority
        />
      </motion.div>

      {/* Animated JL Logo - Bottom Left */}
      <motion.div
        className="absolute -left-32 bottom-0 w-[400px] h-[400px] opacity-[0.20]"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0, 5, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 50px rgba(6,182,212,0.3))",
          }}
          priority
        />
      </motion.div>

      {/* Animated JL Logo - Center (very subtle) */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-[0.15]"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 60,
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
            filter: "drop-shadow(0 0 40px rgba(236,72,153,0.2))",
          }}
          priority
        />
      </motion.div>

      {/* Small Logo - Top Left */}
      <motion.div
        className="absolute left-20 top-32 w-[150px] h-[150px] opacity-[0.1]"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, 0, -10, 0],
        }}
        transition={{
          duration: 15,
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
            filter: "drop-shadow(0 0 30px rgba(139,92,246,0.3))",
          }}
          priority
        />
      </motion.div>

      {/* Small Logo - Bottom Right */}
      <motion.div
        className="absolute right-20 bottom-40 w-[180px] h-[180px] opacity-[0.1]"
        animate={{
          y: [0, 15, 0],
          rotate: [0, -8, 0, 8, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <Image
          src="/images/jl-logo.png.jpg"
          alt=""
          fill
          className="object-contain"
          style={{ 
            filter: "drop-shadow(0 0 35px rgba(6,182,212,0.3))",
          }}
          priority
        />
      </motion.div>

      {/* Gradient Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f]/50 via-transparent to-[#0a0a0f]/50" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          y: [0, -50, 0],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.4, 1],
          x: [0, 40, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/40"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [-30, 30, -30],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}
