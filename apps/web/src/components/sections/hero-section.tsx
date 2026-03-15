'use client';

import { motion } from 'framer-motion';
import { 
  Play, 
  Sparkles, 
  Wand2, 
  Zap, 
  Shield, 
  Globe,
  ChevronRight,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Creation',
    description: 'Generate stunning animated episodes with cutting-edge AI technology'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Create professional content in minutes, not hours'
  },
  {
    icon: Shield,
    title: 'Enterprise Ready',
    description: 'Built for scale with robust security and reliability'
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Support for multiple languages and regional content'
  }
];

const stats = [
  { value: '10K+', label: 'Episodes Created' },
  { value: '50+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'User Rating' }
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-transparent to-transparent" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-400" />
      
      {/* Content */}
      <div className="relative z-10 section-container pt-32 pb-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-white/80">Trusted by 10,000+ creators worldwide</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Create </span>
            <span className="gradient-text">AI-Animated</span>
            <br />
            <span className="text-white">Content at Scale</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Transform your ideas into stunning animated episodes with our AI-powered platform. 
            Professional quality, unlimited creativity, zero complexity.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/create">
              <Button size="lg" className="text-lg px-8">
                <Wand2 className="mr-2 h-5 w-5" />
                Start Creating Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" size="lg" className="text-lg px-8">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mb-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 text-left group hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}