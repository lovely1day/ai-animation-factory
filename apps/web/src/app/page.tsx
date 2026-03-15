"use client";

import Link from "next/link";
import { Wand2, Film, Sparkles, Zap, Globe } from "lucide-react";
import { useLang } from "@/contexts/language-context";

export default function HomePage() {
  const { t, lang, setLang } = useLang();

  return (
    <main
      className="min-h-screen bg-[#0a0a0f] text-white pb-20 px-6 font-sans text-center"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto pt-32">

        {/* Language toggle */}
        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-sm text-gray-300 hover:text-white transition-all"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="font-medium">{lang === "ar" ? "English" : "عربي"}</span>
          </button>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          {t("مستقبل صناعة المحتوى بين يديك", "The future of content creation is here")}
        </div>

        {/* Hero heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 leading-tight">
          {t("مصنع الأنيميشن بالذكاء الاصطناعي", "AI Animation Factory")}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
          {t(
            "حوّل أفكارك إلى مسلسلات أنيميشن احترافية مدعومة بالذكاء الاصطناعي — من الفكرة إلى الفيديو النهائي تلقائياً.",
            "Turn your ideas into professional AI-animated series — from concept to final video, fully automated."
          )}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link
            href="/create"
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            <Wand2 className="w-5 h-5" />
            {t("إنشاء مسلسل", "Create Series")}
          </Link>
          <Link
            href="/cms/episodes"
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-white font-semibold py-4 px-10 rounded-2xl transition-all"
          >
            <Film className="w-5 h-5 text-purple-400" />
            {t("مشاريعي السابقة", "My Previous Projects")}
          </Link>
        </div>

        {/* Feature cards */}
        <div className={`grid md:grid-cols-2 gap-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-400">
              {t("إنتاج متكامل", "Full Production")}
            </h3>
            <p className="text-gray-400 leading-relaxed">
              {t("من كتابة السكربت إلى توليد الصوت والصورة والتجميع النهائي.", "From script writing to voice, imagery, and final assembly.")}
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-pink-400">
              {t("شخصيات مخصصة", "Custom Characters")}
            </h3>
            <p className="text-gray-400 leading-relaxed">
              {t("صمّم شخصياتك الخاصة وحافظ على ثبات ملامحها عبر جميع المشاهد.", "Design your own characters with consistent features across all scenes.")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
