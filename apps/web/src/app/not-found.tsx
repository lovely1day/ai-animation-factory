'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, Film } from 'lucide-react';

const particles = [
  { left: '8%',  top: '15%', size: 6,  delay: 0 },
  { left: '88%', top: '22%', size: 4,  delay: 0.4 },
  { left: '22%', top: '78%', size: 8,  delay: 0.8 },
  { left: '70%', top: '65%', size: 5,  delay: 0.2 },
  { left: '50%', top: '88%', size: 3,  delay: 1.0 },
  { left: '15%', top: '45%', size: 7,  delay: 0.6 },
];

export default function NotFound() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 800;
    const raf = (cb: FrameRequestCallback) => requestAnimationFrame(cb);
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(404 * progress));
      if (progress < 1) raf(step);
    };
    raf(step);
  }, []);

  return (
    <main className="relative min-h-screen bg-transparent flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-purple-500/30"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 text-center px-4"
      >
        {/* 404 number */}
        <div className="text-[10rem] md:text-[14rem] font-black leading-none bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent select-none">
          {count}
        </div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="text-gray-400 text-lg mb-10 max-w-md mx-auto"
        >
          The page you&apos;re looking for has drifted into the void.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/40"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold border border-white/10 transition-all duration-300 hover:scale-105"
          >
            <Film className="w-5 h-5" />
            Browse Episodes
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
