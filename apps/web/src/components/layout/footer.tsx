"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Film, Github, Twitter, Youtube, Sparkles, Zap, Shield,
  Heart, ExternalLink, ArrowUpRight, Mail, MapPin, Code2
} from "lucide-react";
import { useLang } from "@/contexts/language-context";

export default function AppFooter() {
  const { t, lang } = useLang();

  const footerLinks = {
    product: [
      { href: "/create", label: t("إنشاء حلقة", "Create Episode"), badge: null },
      { href: "/cms/episodes", label: t("المشاريع", "Projects"), badge: null },
      { href: "/cms/queue", label: t("مراقبة الإنتاج", "Production Queue"), badge: "New" },
      { href: "/cms/analytics", label: t("التحليلات", "Analytics"), badge: null },
    ],
    resources: [
      { href: "#", label: t("التوثيق", "Documentation"), external: true },
      { href: "#", label: t("API Reference", "API Reference"), external: true },
      { href: "#", label: t("الدعم الفني", "Support"), external: false },
      { href: "#", label: t("الأسئلة الشائعة", "FAQ"), external: false },
    ],
    company: [
      { href: "#", label: t("من نحن", "About Us"), external: false },
      { href: "#", label: t("المدونة", "Blog"), external: false },
      { href: "#", label: t("الوظائف", "Careers"), badge: "Hiring" },
      { href: "#", label: t("اتصل بنا", "Contact"), external: false },
    ],
    legal: [
      { href: "#", label: t("سياسة الخصوصية", "Privacy Policy"), external: false },
      { href: "#", label: t("شروط الاستخدام", "Terms of Service"), external: false },
      { href: "#", label: t("سياسة الاستخدام", "Acceptable Use"), external: false },
    ],
  };

  const techStack = [
    { name: "Gemini 2.5", color: "from-blue-500 to-cyan-500" },
    { name: "Runway ML", color: "from-purple-500 to-pink-500" },
    { name: "ElevenLabs", color: "from-emerald-500 to-green-500" },
    { name: "Supabase", color: "from-amber-500 to-orange-500" },
  ];

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-400" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-400" },
    { icon: Github, href: "#", label: "GitHub", color: "hover:text-white" },
  ];

  return (
    <footer className="relative mt-auto border-t border-white/5 overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-bold text-lg text-white">AI Animation Factory</span>
                <span className="block text-xs text-purple-400">{t("مصنع الأنيميشن بالذكاء الاصطناعي", "AI-Powered Animation")}</span>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {t(
                "حوّل أفكارك إلى مسلسلات أنيميشن احترافية باستخدام أحدث تقنيات الذكاء الاصطناعي.",
                "Transform your ideas into professional animated series using cutting-edge AI technology."
              )}
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech.name}
                  className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${tech.color} bg-clip-text text-transparent border border-white/10 bg-white/5`}
                >
                  {tech.name}
                </span>
              ))}
            </div>

            {/* Newsletter */}
            <div className="pt-4">
              <p className="text-sm text-gray-400 mb-3">{t("اشترك في نشرتنا", "Subscribe to our newsletter")}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t("بريدك الإلكتروني", "Your email")}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
                <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("المنتج", "Product")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("الموارد", "Resources")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("الشركة", "Company")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-300">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Section - Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-white/5 mb-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">10K+</div>
            <div className="text-sm text-gray-500">{t("حلقة منشأة", "Episodes Created")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">1M+</div>
            <div className="text-sm text-gray-500">{t("مشاهدة", "Total Views")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">5K+</div>
            <div className="text-sm text-gray-500">{t("مستخدم نشط", "Active Users")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">99.9%</div>
            <div className="text-sm text-gray-500">{t("وقت التشغيل", "Uptime")}</div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center lg:items-start gap-4 text-center lg:text-start">
            {/* Small Logo with Text */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-10 h-10">
                <Image
                  src="/images/jl-logo.png.jpg"
                  alt="JackoLeeno JL"
                  fill
                  className="object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                />
              </div>
              <div>
                <p className="text-base font-bold text-white">JackoLeeno JL</p>
                <p className="text-xs text-purple-400">{t("صانع الابتكار", "Innovation Maker")}</p>
              </div>
            </motion.div>

            {/* Single Copyright Line - Language Based */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>© 2026</span>
              <span className="font-medium text-gray-400">JackoLeeno JL</span>
              <span className="text-gray-600">|</span>
              <span>{lang === "ar" ? "جميع الحقوق محفوظة" : "All Rights Reserved"}</span>
            </div>

            {/* Powered by & Developed by */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>{t("مدعوم بواسطة", "Powered by")}</span>
                <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  JackoLeeno JL
                </span>
              </span>
              <span className="text-gray-700">•</span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <Code2 className="w-3 h-3 text-cyan-500" />
                <span>{t("مطور بواسطة", "Developed by")}</span>
                <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  JackoLeeno JL Team
                </span>
              </span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className={`w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 ${social.color} transition-all hover:scale-110`}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            {footerLinks.legal.map((link, i) => (
              <span key={link.label} className="flex items-center gap-4">
                <Link href={link.href} className="hover:text-gray-300 transition-colors">
                  {link.label}
                </Link>
                {i < footerLinks.legal.length - 1 && <span className="text-gray-700">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
