"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Mic, Image as ImageIcon, Music, Video, Type, Zap,
  BookOpen, Speaker, Megaphone, GraduationCap,
} from "lucide-react";
import { useLang } from "@/contexts/language-context";

const CONTENT_TEMPLATES = [
  { type: "story",          icon: BookOpen,       nameAr: "قصة سينمائية",         nameEn: "Cinematic Story",
    descAr: "قصة درامية بشخصيات وصراع وذروة — الخيار الافتراضي",
    descEn: "Dramatic story with characters, conflict and climax — factory default",
    shots: 25, duration: 75 },
  { type: "sermon",         icon: Speaker,        nameAr: "خطبة / محتوى ديني",    nameEn: "Sermon / Religious",
    descAr: "خطبة جمعة، درس ديني، محتوى تذكيري بصيغة بصرية وقورة",
    descEn: "Friday sermon, religious lesson, or reminder content with dignified visuals",
    shots: 18, duration: 90 },
  { type: "educational",    icon: GraduationCap,  nameAr: "محتوى تعليمي",         nameEn: "Educational",
    descAr: "شرح مفهوم أو مهارة — هوك + شرح + مثال + ملخص",
    descEn: "Explain a concept or skill — hook + explain + example + summary",
    shots: 20, duration: 60 },
  { type: "advertisement",  icon: Megaphone,      nameAr: "إعلان تجاري",          nameEn: "Advertisement",
    descAr: "إعلان قصير 15-30 ثانية — مشكلة → حل → CTA",
    descEn: "Short 15-30s ad — problem → solution → call to action",
    shots: 8, duration: 15 },
];

const ARABIC_FONTS = [
  { name: "Cairo",          style: "Modern, clean",           use: "UI, narration, general" },
  { name: "Tajawal",        style: "Minimal, geometric",      use: "Tech, startup, modern" },
  { name: "IBM Plex Arabic",style: "Tech-friendly, neutral",  use: "Educational, corporate" },
  { name: "Amiri",          style: "Classical, serif",        use: "Religious, literary" },
  { name: "Scheherazade",   style: "Traditional calligraphic",use: "Poetry, Quran, classical" },
  { name: "Lateef",         style: "Wide, highly legible",    use: "Longform, subtitles" },
  { name: "Reem Kufi",      style: "Kufic display",           use: "Headlines, titles" },
  { name: "El Messiri",     style: "Contemporary display",    use: "Branding, posters" },
];

const PIPELINE_STAGES = [
  { icon: FileText, nameAr: "كتابة السيناريو",   nameEn: "Script Writing",    provider: "Claude / Gemini / Ollama" },
  { icon: ImageIcon,nameAr: "توليد الصور",       nameEn: "Image Generation",  provider: "Pollinations · ComfyUI" },
  { icon: Mic,      nameAr: "توليد الصوت",       nameEn: "Voice Generation",  provider: "MediaVoice · ElevenLabs" },
  { icon: Music,    nameAr: "الموسيقى",           nameEn: "Music",             provider: "MusicGen · library" },
  { icon: Video,    nameAr: "تجميع الفيديو",     nameEn: "Video Assembly",    provider: "FFmpeg (real MP4)" },
  { icon: Type,     nameAr: "الترجمة المحروقة",  nameEn: "Burned Subtitles",  provider: "FFmpeg + Arabic fonts" },
];

export default function CatalogPage() {
  const { lang, t, dir } = useLang();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir={dir}>
      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs mb-4">
              <Zap className="w-3 h-3" />
              {t("الإمكانيات المتاحة", "Available Capabilities")}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("كتالوج المصنع", "Factory Catalog")}
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              {t(
                "كل ما يقدر المصنع ينتجه — قوالب المحتوى، الخطوط، والـ pipeline الكامل من فكرة إلى حلقة جاهزة.",
                "Everything the factory can produce — content templates, fonts, and the full pipeline from idea to finished episode."
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Templates */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">{t("قوالب المحتوى", "Content Templates")}</h2>
          <p className="text-white/50 mb-8">{t("4 قوالب مخصّصة لأنواع مختلفة من الإنتاج", "4 templates tailored for different production types")}</p>

          <div className="grid md:grid-cols-2 gap-4">
            {CONTENT_TEMPLATES.map((tpl, i) => {
              const Icon = tpl.icon;
              return (
                <motion.div
                  key={tpl.type}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-violet-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{lang === "ar" ? tpl.nameAr : tpl.nameEn}</h3>
                      <p className="text-sm text-white/60 mb-3">{lang === "ar" ? tpl.descAr : tpl.descEn}</p>
                      <div className="flex gap-4 text-xs text-white/40">
                        <span>{tpl.shots} {t("لقطة", "shots")}</span>
                        <span>·</span>
                        <span>{tpl.duration}s</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">{t("خط الإنتاج الكامل", "Full Pipeline")}</h2>
          <p className="text-white/50 mb-8">{t("6 مراحل — من النص إلى الفيديو النهائي بـ FFmpeg", "6 stages — from text to final FFmpeg-rendered video")}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.nameEn}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-violet-300" />
                    <h3 className="font-semibold">{lang === "ar" ? stage.nameAr : stage.nameEn}</h3>
                  </div>
                  <p className="text-xs text-white/50">{stage.provider}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Arabic Fonts */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">{t("الخطوط العربية المدعومة", "Supported Arabic Fonts")}</h2>
          <p className="text-white/50 mb-8">{t("8 خطوط OFL جاهزة للترجمة المحروقة", "8 OFL fonts ready for burned subtitles")}</p>

          <div className="grid md:grid-cols-2 gap-3">
            {ARABIC_FONTS.map((font, i) => (
              <motion.div
                key={font.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="font-bold text-white">{font.name}</p>
                  <p className="text-xs text-white/50">{font.style}</p>
                </div>
                <p className="text-xs text-white/40">{font.use}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t("ابدأ الإنتاج الآن", "Start Creating Now")}</h2>
          <p className="text-white/60 mb-8">
            {t("كل إمكانيات المصنع متاحة بنقرة واحدة", "Every factory capability is one click away")}
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 font-semibold transition-all"
          >
            {t("أنشئ حلقة", "Create Episode")}
            <Zap className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
