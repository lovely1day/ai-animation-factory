"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { 
  Wand2, Film, Sparkles, Zap, Play, Eye, Heart, 
  TrendingUp, Clock, Activity, BarChart3, Layers,
  ArrowUpRight, Users, Video, Palette
} from "lucide-react";
import { motion, useInView, useAnimation } from "framer-motion";
import { useLang } from "@/contexts/language-context";
import { AnimatedBackgroundHome } from "@/components/animated-background-home";
import { IdeaGenerator } from "@/components/idea-generator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Animated counter component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);
  
  return <span ref={ref} suppressHydrationWarning>{count.toLocaleString('en-US')}</span>;
}

// Glass card component
function GlassCard({ 
  children, 
  className = "", 
  gradient = "from-purple-500/20 to-pink-500/20",
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`relative group ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative h-full p-6 rounded-3xl bg-black/20 backdrop-blur-md border border-white/[0.08] hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse" />
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// Stat card with icon
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  color,
  delay = 0 
}: { 
  icon: any;
  label: string;
  value: number;
  subtext?: string;
  color: string;
  delay?: number;
}) {
  return (
    <GlassCard delay={delay}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {subtext && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-green-400" />
            {subtext}
          </span>
        )}
      </div>
      <div className="text-4xl font-bold text-white mb-1">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </GlassCard>
  );
}

// Live indicator
function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      Live
    </span>
  );
}

export default function HomePage() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({
    episodes: 0,
    views: 0,
    likes: 0,
    published: 0,
    processing: 0,
    completed: 0,
    queueActive: 0,
    queueCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [episodesRes, analyticsRes, queueRes] = await Promise.all([
          fetch(`${API_URL}/api/episodes?limit=1`),
          fetch(`${API_URL}/api/analytics/summary`),
          fetch(`${API_URL}/api/jobs/queue-stats`),
        ]);

        const episodesData = await episodesRes.json();
        const analyticsData = await analyticsRes.json();
        const queueData = await queueRes.json();

        const queueActive = queueData.data?.reduce((s: number, q: any) => s + (q.active || 0), 0) || 0;
        const queueCompleted = queueData.data?.reduce((s: number, q: any) => s + (q.completed || 0), 0) || 0;

        setStats({
          episodes: episodesData.pagination?.total || 0,
          views: analyticsData.data?.total_views || 0,
          likes: analyticsData.data?.total_likes || 0,
          published: analyticsData.data?.published_episodes || 0,
          processing: analyticsData.data?.generating_episodes || 0,
          completed: analyticsData.data?.published_episodes || 0,
          queueActive,
          queueCompleted,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className="min-h-screen text-white overflow-hidden bg-transparent"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Premium animated background - Home only */}
      <AnimatedBackgroundHome />

      <div className="relative z-10">
        {/* AI Idea Generator Section - NOW FIRST */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20">
          <IdeaGenerator />
        </section>

        {/* Hero Section - MOVED DOWN */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 pt-20 pb-10 border-t border-white/5">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              {t("مستقبل صناعة المحتوى بين يديك", "The future of content creation is here")}
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {t("مصنع الأنيميشن", "AI Animation")}
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("بالذكاء الاصطناعي", "Factory")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {t(
                "حوّل أفكارك إلى مسلسلات أنيميشن احترافية — من الفكرة إلى الفيديو النهائي تلقائياً.",
                "Turn your ideas into professional animated series — from concept to final video, fully automated."
              )}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link
                href="/create"
                className="group relative flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 hover:scale-105"
              >
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t("إنشاء مسلسل جديد", "Create New Series")}
                <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/cms/episodes"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-white font-semibold py-4 px-10 rounded-2xl transition-all hover:scale-105"
              >
                <Film className="w-5 h-5 text-purple-400" />
                {t("استوديو الإنتاج", "Production Studio")}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Dashboard Section */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <LiveIndicator />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {t("لوحة الإنجازات", "Achievement Dashboard")}
                </span>
              </h2>
              <p className="text-gray-500">
                {t("إحصائيات حية لمشاريعك وإنتاجك", "Live statistics for your projects and production")}
              </p>
            </motion.div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={Film}
                label={t("إجمالي الحلقات", "Total Episodes")}
                value={stats.episodes}
                color="bg-gradient-to-br from-blue-500 to-cyan-500"
                delay={0.1}
              />
              <StatCard
                icon={Eye}
                label={t("المشاهدات", "Total Views")}
                value={stats.views}
                subtext={t("مشاهدة", "views")}
                color="bg-gradient-to-br from-emerald-500 to-green-500"
                delay={0.2}
              />
              <StatCard
                icon={Heart}
                label={t("الإعجابات", "Total Likes")}
                value={stats.likes}
                subtext={t("إعجاب", "likes")}
                color="bg-gradient-to-br from-pink-500 to-rose-500"
                delay={0.3}
              />
              <StatCard
                icon={Video}
                label={t("المنشورة", "Published")}
                value={stats.published}
                color="bg-gradient-to-br from-purple-500 to-violet-500"
                delay={0.4}
              />
            </div>

            {/* Secondary Stats & Activity */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Processing Status */}
              <GlassCard delay={0.5} gradient="from-amber-500/20 to-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t("قيد التنفيذ", "In Progress")}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats.processing} />
                </div>
                <div className="text-sm text-gray-400 mb-3">{t("حلقة قيد المعالجة", "Episodes Processing")}</div>
                
                {/* Progress bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min((stats.processing / Math.max(stats.episodes, 1)) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </GlassCard>

              {/* Queue Status */}
              <GlassCard delay={0.6} gradient="from-cyan-500/20 to-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <LiveIndicator />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      <AnimatedCounter value={stats.queueActive} />
                    </div>
                    <div className="text-xs text-gray-400">{t("مهام نشطة", "Active Tasks")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">
                      <AnimatedCounter value={stats.queueCompleted} />
                    </div>
                    <div className="text-xs text-gray-400">{t("مهام مكتملة", "Completed")}</div>
                  </div>
                </div>
                
                {/* Queue indicators */}
                <div className="flex gap-2 mt-4">
                  {['idea', 'script', 'image', 'voice'].map((type, i) => (
                    <div key={type} className="flex-1 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[10px] text-gray-500 uppercase">
                      {type}
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard delay={0.7} gradient="from-purple-500/20 to-pink-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("إجراءات سريعة", "Quick Actions")}</h3>
                <p className="text-sm text-gray-400 mb-4">{t("ابدأ مشروعك الجديد الآن", "Start your new project now")}</p>
                
                <div className="space-y-2">
                  <Link
                    href="/create"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    {t("إنشاء جديد", "Create New")}
                  </Link>
                  <Link
                    href="/cms/queue"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {t("مراقبة الإنتاج", "Monitor Production")}
                  </Link>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-3">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t("لماذا مصنع الأنيميشن؟", "Why AI Animation Factory?")}
                </span>
              </h2>
            </motion.div>

            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
              {[
                { 
                  icon: Zap, 
                  title: t("إنتاج متكامل", "Full Production"),
                  desc: t("من الفكرة إلى الفيديو النهائي تلقائياً", "From idea to final video automatically"),
                  color: "from-purple-500 to-violet-500",
                  delay: 0.1
                },
                { 
                  icon: Palette, 
                  title: t("شخصيات مخصصة", "Custom Characters"),
                  desc: t("صمم شخصياتك مع ثبات الملامح", "Design characters with consistent features"),
                  color: "from-pink-500 to-rose-500",
                  delay: 0.2
                },
                { 
                  icon: Play, 
                  title: t("بث مباشر", "Live Streaming"),
                  desc: t("شاهد مشاريعك على أي جهاز", "Watch your projects on any device"),
                  color: "from-blue-500 to-cyan-500",
                  delay: 0.3
                },
                { 
                  icon: TrendingUp, 
                  title: t("تحليلات ذكية", "Smart Analytics"),
                  desc: t("تتبع أداء محتواك", "Track your content performance"),
                  color: "from-emerald-500 to-green-500",
                  delay: 0.4
                },
                { 
                  icon: Users, 
                  title: t("فريق متخصص", "Expert Team"),
                  desc: t("دعم فني على مدار الساعة", "24/7 technical support"),
                  color: "from-amber-500 to-orange-500",
                  delay: 0.5
                },
                { 
                  icon: Sparkles, 
                  title: t("جودة احترافية", "Pro Quality"),
                  desc: t("إنتاج سينمائي 4K", "Cinematic 4K production"),
                  color: "from-purple-500 to-pink-500",
                  delay: 0.6
                },
              ].map((feature, idx) => (
                <GlassCard key={idx} delay={feature.delay}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="relative p-12 rounded-3xl bg-black/30 backdrop-blur-md border border-purple-500/30 overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  {t("جاهز لإنشاء مسلسلك الأول؟", "Ready to create your first series?")}
                </h2>
                <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                  {t("ابدأ الآن وانضم إلى آلاف المبدعين الذين يستخدمون مصنع الأنيميشن", "Start now and join thousands of creators using AI Animation Factory")}
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-3 bg-white text-purple-900 hover:bg-gray-100 font-bold py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("ابدأ مجاناً", "Start for Free")}
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer removed - using global AppFooter from layout */}
      </div>
    </main>
  );
}
