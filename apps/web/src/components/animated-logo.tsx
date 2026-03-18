"use client";

import { motion } from "framer-motion";

export function AnimatedJLLogo({ size = 60 }: { size?: number }) {
  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Container for letters */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))" }}
      >
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="jlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Letter J */}
        <motion.text
          x="25"
          y="70"
          fontSize="45"
          fontWeight="bold"
          fill="url(#jlGradient)"
          filter="url(#glow)"
          animate={{
            y: [70, 65, 70],
            rotate: [-5, 5, -5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ fontFamily: "serif" }}
        >
          J
        </motion.text>

        {/* Letter L */}
        <motion.text
          x="55"
          y="70"
          fontSize="45"
          fontWeight="bold"
          fill="url(#jlGradient)"
          filter="url(#glow)"
          animate={{
            y: [70, 75, 70],
            rotate: [5, -5, 5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ fontFamily: "serif" }}
        >
          L
        </motion.text>

        {/* Dancing connection line */}
        <motion.path
          d="M 45 55 Q 50 45 55 55"
          stroke="url(#jlGradient)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
          animate={{
            d: [
              "M 45 55 Q 50 45 55 55",
              "M 45 55 Q 50 65 55 55",
              "M 45 55 Q 50 45 55 55",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Floating particles around logo */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Alternative 3D dancing logo
export function DancingJLLogo({ size = 80 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Letters container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* J Letter */}
        <motion.span
          className="text-4xl font-bold bg-gradient-to-br from-purple-400 to-pink-500 bg-clip-text text-transparent"
          style={{ 
            textShadow: "0 0 30px rgba(139, 92, 246, 0.5)",
            fontFamily: "Georgia, serif",
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [-8, 8, -8],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          J
        </motion.span>

        {/* L Letter */}
        <motion.span
          className="text-4xl font-bold bg-gradient-to-br from-pink-500 to-purple-400 bg-clip-text text-transparent -ml-1"
          style={{ 
            textShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
            fontFamily: "Georgia, serif",
          }}
          animate={{
            y: [0, 8, 0],
            rotate: [8, -8, 8],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          L
        </motion.span>
      </div>

      {/* Orbiting ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-purple-500/20"
        animate={{ rotate: 360 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-purple-400"
          style={{ top: "50%", left: "-4px" }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-2 rounded-full border border-pink-500/20"
        animate={{ rotate: -360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-pink-400"
          style={{ top: "50%", right: "-3px" }}
        />
      </motion.div>
    </div>
  );
}

// Small inline version for footer
export function JLLogoSmall({ size = 40 }: { size?: number }) {
  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/20 blur-lg"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* J */}
      <motion.span
        className="text-2xl font-bold text-purple-400"
        style={{ fontFamily: "Georgia, serif" }}
        animate={{
          y: [0, -3, 0],
          rotate: [-5, 5, -5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        J
      </motion.span>

      {/* L */}
      <motion.span
        className="text-2xl font-bold text-pink-400 -ml-0.5"
        style={{ fontFamily: "Georgia, serif" }}
        animate={{
          y: [0, 3, 0],
          rotate: [5, -5, 5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        L
      </motion.span>
    </motion.div>
  );
}
