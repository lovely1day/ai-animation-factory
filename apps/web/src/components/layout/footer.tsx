"use client";

import Link from "next/link";
import { Film, Github, Twitter, Youtube, Sparkles, Zap, Shield } from "lucide-react";
import { useLang } from "@/contexts/language-context";

export default function AppFooter() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const links = {
    product: [
      { href: "/browse",     ar: "استعراض الحلقات", en: "Browse Episodes" },
      { href: "/create",     ar: "إنشاء حلقة",      en: "Create Episode"  },
      { href: "/cms/queue",  ar: "مراقبة الإنتاج",  en: "Production Queue" },
    ],
    legal: [
      { href: "#", ar: "سياسة الخصوصية", en: "Privacy Policy" },
      { href: "#", ar: "شروط الاستخدام", en: "Terms of Service" },
    ],
    tech: [
      { label: "Gemini 2.5",   icon: <Sparkles className="w-3.5 h-3.5" /> },
      { label: "Runway ML",    icon: <Zap        className="w-3.5 h-3.5" /> },
      { label: "ElevenLabs",   icon: <Shield     className="w-3.5 h-3.5" /> },
    ],
  };

  return (
    <footer className="relative mt-auto border-t border-white/5 bg-[#0a0a0f]">
      {/* subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 w-fit group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/35 transition-shadow">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("مصنع الأنيميشن", "AI Animation Factory")}
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              {t(
                "حوّل أفكارك إلى مسلسلات أنيميشن احترافية مدعومة بالذكاء الاصطناعي — من الفكرة إلى الفيديو النهائي تلقائياً.",
                "Turn your ideas into professional AI-animated series — from concept to final video, fully automated."
              )}
            </p>

            {/* Tech stack pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {links.tech.map((t) => (
                <span
                  key={t.label}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs"
                >
                  <span className="text-purple-400">{t.icon}</span>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {t("المنتج", "Product")}
            </h3>
            <ul className="space-y-2">
              {links.product.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-purple-300 transition-colors"
                  >
                    {t(l.ar, l.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {t("قانوني", "Legal")}
            </h3>
            <ul className="space-y-2">
              {links.legal.map((l) => (
                <li key={l.ar}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-purple-300 transition-colors"
                  >
                    {t(l.ar, l.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 text-center sm:text-start">
            © {year} AI Animation Factory.{" "}
            {t("جميع الحقوق محفوظة.", "All rights reserved.")}
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[
              { href: "#", icon: <Github   className="w-4 h-4" />, label: "GitHub"   },
              { href: "#", icon: <Twitter  className="w-4 h-4" />, label: "Twitter"  },
              { href: "#", icon: <Youtube  className="w-4 h-4" />, label: "YouTube"  },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 flex items-center justify-center text-gray-500 hover:text-purple-400 transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
