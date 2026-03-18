"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Film, Eye, Heart, TrendingUp, RefreshCw, Clock, 
  BarChart3, Calendar, ChevronUp, ChevronDown, 
  Users, Play, Award, Star, Zap, Target,
  Instagram, Youtube, Twitter, Video, Share2,
  Crown, Trophy, Medal, Sparkles, Palette, Code,
  ArrowUpRight, Activity, Flame, Globe
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie
} from "recharts";
import { useLang } from "@/contexts/language-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Animated counter
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
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);
  
  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Format number
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Glass Card
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative h-full rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

// Period Button
function PeriodButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

// Stat Card
function StatCard({ icon: Icon, label, value, subtext, color, delay }: { 
  icon: any; label: string; value: number; subtext?: string; color: string; delay: number 
}) {
  return (
    <GlassCard delay={delay}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          {subtext && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {subtext}
            </span>
          )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          <AnimatedCounter value={value} />
        </div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </GlassCard>
  );
}

// Social Platform Card
function SocialCard({ platform, rank, views, growth, color, delay }: { 
  platform: string; rank: number; views: number; growth: number; color: string; delay: number 
}) {
  const icons: Record<string, any> = { TikTok: Video, Instagram, Youtube, Snapchat: Share2, Twitter };
  const Icon = icons[platform] || Video;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{platform}</span>
          {rank <= 3 && <Crown className={`w-4 h-4 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-amber-600"}`} />}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-400">{formatNumber(views)} views</span>
          <span className={`text-xs flex items-center gap-1 ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>
            {growth >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(growth)}%
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-600">#{rank}</div>
    </motion.div>
  );
}

// Developer Card
function DeveloperCard({ name, role, icon: Icon, color, delay }: { name: string; role: string; icon: any; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group hover:scale-105"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
        <Icon className="w-8 h-8" />
      </div>
      <span className="font-bold text-white text-lg">{name}</span>
      <span className="text-sm text-gray-500 mt-1">{role}</span>
    </motion.div>
  );
}

// Top Episode Item
function TopEpisodeItem({ episode, index }: { episode: any; index: number }) {
  const medals = [
    { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    { icon: Medal, color: "text-gray-300", bg: "bg-gray-500/20" },
    { icon: Award, color: "text-amber-600", bg: "bg-amber-500/20" },
  ];
  const MedalIcon = medals[index]?.icon || Star;
  const medalColor = medals[index]?.color || "text-gray-400";
  const medalBg = medals[index]?.bg || "bg-white/10";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl ${medalBg} flex items-center justify-center ${medalColor}`}>
        <MedalIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{episode.title}</p>
        <p className="text-sm text-gray-500">{formatNumber(episode.view_count)} views</p>
      </div>
      <div className="text-xl font-bold text-gray-600">#{index + 1}</div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [stats, setStats] = useState({
    episodes: 0, views: 0, likes: 0, published: 0,
    processing: 0, completed: 0, queueActive: 0, queueCompleted: 0
  });
  const [viewsByDay, setViewsByDay] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  const [topEpisodes, setTopEpisodes] = useState<any[]>([]);
  const [socialData, setSocialData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mockSocial = [
    { platform: "TikTok", views: 125000, growth: 23, color: "bg-gradient-to-br from-black to-gray-800" },
    { platform: "Instagram", views: 89000, growth: 15, color: "bg-gradient-to-br from-purple-600 to-pink-600" },
    { platform: "Youtube", views: 67000, growth: 8, color: "bg-gradient-to-br from-red-600 to-red-800" },
    { platform: "Snapchat", views: 45000, growth: -5, color: "bg-gradient-to-br from-yellow-400 to-yellow-600" },
    { platform: "Twitter", views: 32000, growth: 12, color: "bg-gradient-to-br from-blue-500 to-blue-700" },
  ];

  const safeFetch = useCallback(async (url: string): Promise<any | null> => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return { error: `HTTP ${res.status}: ${errText}` };
      }
      return await res.json();
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;

    const results = await Promise.allSettled([
      safeFetch(`${API_URL}/api/episodes?limit=1`),
      safeFetch(`${API_URL}/api/analytics/summary`),
      safeFetch(`${API_URL}/api/jobs/queue-stats`),
      safeFetch(`${API_URL}/api/analytics/views-by-day?days=${days}`),
      safeFetch(`${API_URL}/api/analytics/views-by-genre`),
    ]);

    const errors: string[] = [];
    
    const [epRes, anRes, qRes, vbdRes, genreRes] = results.map((r, idx) => {
      if (r.status === 'rejected') {
        errors.push(`Request ${idx + 1} failed`);
        return null;
      }
      if (r.value?.error) {
        errors.push(r.value.error);
        return null;
      }
      return r.value;
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    const queueActive  = (qRes?.data ?? []).reduce((s: number, q: any) => s + (q.active    || 0), 0);
    const queueCompleted = (qRes?.data ?? []).reduce((s: number, q: any) => s + (q.completed || 0), 0);

    setStats({
      episodes:   epRes?.pagination?.total               || 0,
      views:      anRes?.data?.total_views               || 0,
      likes:      anRes?.data?.total_likes               || 0,
      published:  anRes?.data?.published_episodes        || 0,
      processing: anRes?.data?.generating_episodes       || 0,
      completed:  anRes?.data?.published_episodes        || 0,
      queueActive,
      queueCompleted,
    });

    setViewsByDay(vbdRes?.data ?? []);

    const rawGenre = genreRes?.data;
    const gData = rawGenre && typeof rawGenre === "object"
      ? Object.entries(rawGenre).map(([genre, views]) => ({ genre, views }))
      : [];
    setGenreData(gData);

    setTopEpisodes(anRes?.data?.top_episodes ?? []);
    setSocialData(mockSocial);
    setLastUpdated(new Date());
    setLoading(false);
  }, [period, safeFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

  return (
    <div className="min-h-screen text-white pb-20 bg-transparent">
      {/* Background removed - using global animated background */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3"
          >
            <Activity className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">{t("خطأ في تحميل البيانات", "Error loading data")}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm transition-colors"
            >
              {t("إعادة المحاولة", "Retry")}
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {t("لوحة التحليلات", "Analytics Dashboard")}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              {t("بيانات حية ومحدثة", "Live & updated data")}
              {lastUpdated && (
                <span className="text-xs text-gray-600">
                  • {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <PeriodButton active={period === "day"} onClick={() => setPeriod("day")} label={t("يومي", "Daily")} />
              <PeriodButton active={period === "week"} onClick={() => setPeriod("week")} label={t("أسبوعي", "Weekly")} />
              <PeriodButton active={period === "month"} onClick={() => setPeriod("month")} label={t("شهري", "Monthly")} />
            </div>
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Film} label={t("الحلقات", "Episodes")} value={stats.episodes} color="bg-gradient-to-br from-blue-500 to-cyan-500" delay={0.1} />
          <StatCard icon={Eye} label={t("المشاهدات", "Views")} value={stats.views} subtext="+12%" color="bg-gradient-to-br from-emerald-500 to-green-500" delay={0.2} />
          <StatCard icon={Heart} label={t("الإعجابات", "Likes")} value={stats.likes} subtext="+8%" color="bg-gradient-to-br from-pink-500 to-rose-500" delay={0.3} />
          <StatCard icon={Play} label={t("المنشورة", "Published")} value={stats.published} color="bg-gradient-to-br from-purple-500 to-violet-500" delay={0.4} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <GlassCard delay={0.5}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                {t("المشاهدات", "Views")}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={viewsByDay}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} stroke="rgba(255,255,255,0.1)" />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#fff" }} />
                  <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard delay={0.6}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-400" />
                {t("حسب النوع", "By Genre")}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={genreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="genre" tick={{ fontSize: 10, fill: "#6b7280" }} stroke="rgba(255,255,255,0.1)" />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="views" radius={[8, 8, 0, 0]}>
                    {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Social & Top Episodes */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <GlassCard delay={0.7}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  {t("أفضل المنصات", "Top Platforms")}
                </h3>
                <span className="text-xs text-gray-500">{t("حسب المشاهدات", "by views")}</span>
              </div>
              <div className="space-y-3">
                {socialData.map((s, i) => (
                  <SocialCard key={s.platform} platform={s.platform} rank={i + 1} views={s.views} growth={s.growth} color={s.color} delay={i * 0.1} />
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.8}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  {t("الأكثر شهرة", "Top Episodes")}
                </h3>
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-3">
                {topEpisodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">{t("لا توجد بيانات", "No data")}</div>
                ) : (
                  topEpisodes.slice(0, 10).map((ep, i) => <TopEpisodeItem key={ep.id} episode={ep} index={i} />)
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Developers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t("فريق التطوير", "Development Team")}</h2>
            <p className="text-gray-500">{t("صُنع بإبداع وشغف", "Made with creativity & passion")}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <DeveloperCard name="Ali S" role="Lead Developer" icon={Code} color="bg-gradient-to-br from-purple-600 to-violet-600" delay={0.1} />
            <DeveloperCard name="Leen A" role="UI/UX Designer" icon={Palette} color="bg-gradient-to-br from-pink-600 to-rose-600" delay={0.2} />
            <DeveloperCard name="Lama A" role="Creative Director" icon={Sparkles} color="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.3} />
          </div>
        </motion.div>

        {/* Footer Credit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-8 border-t border-white/10">
          <p className="text-sm text-gray-500">
            {t("مطور بواسطة", "Powered by")}{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              JackoLeeno JL
            </span>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            © 2026 JackoLeeno JL. {t("جميع الحقوق محفوظة", "All Rights Reserved")}.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
