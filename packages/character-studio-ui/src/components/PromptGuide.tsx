"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

interface PromptGuideProps {
  onClose: () => void;
}

const TOOLS = [
  {
    name: "ChatGPT / GPT-4o",
    emoji: "🟢",
    badge: "أسهل",
    badgeColor: "bg-green-500/20 text-green-300",
    promptKey: "ChatGPT / GPT-4o",
    steps: [
      'افتح chatgpt.com وابدأ محادثة جديدة',
      'انسخ برومبت "ChatGPT / GPT-4o" من الزر أعلاه',
      "الصقه مباشرة وانتظر",
    ],
    note: "GPT-4o يولّد الصور مباشرة في المحادثة — لا تحتاج أداة إضافية",
    links: [{ label: "chatgpt.com", url: "https://chatgpt.com" }],
    free: true,
  },
  {
    name: "Gemini / Imagen",
    emoji: "🔵",
    badge: "مجاني",
    badgeColor: "bg-blue-500/20 text-blue-300",
    promptKey: "Gemini / Imagen",
    steps: [
      "اختر أداة من الخيارين أدناه",
      'انسخ برومبت "Gemini / Imagen" من الزر أعلاه',
      "الصقه واضغط Generate",
    ],
    note: "ImageFX (Imagen 3) أقوى بكثير من Gemini للصور الواقعية",
    links: [
      { label: "gemini.google.com", url: "https://gemini.google.com" },
      { label: "ImageFX — Imagen 3", url: "https://labs.google/fx/tools/image-fx" },
    ],
    free: true,
  },
  {
    name: "Grok / Aurora",
    emoji: "⚡",
    badge: "X Premium",
    badgeColor: "bg-sky-500/20 text-sky-300",
    promptKey: "Grok / Aurora",
    steps: [
      "افتح grok.com أو X (تويتر) بحساب Premium",
      'اختر قسم "Aurora" لتوليد الصور',
      'انسخ برومبت "Grok / Aurora" والصقه',
    ],
    note: "Aurora هي أداة الصور الخاصة بـ Grok — تتميز بالواقعية العالية",
    links: [{ label: "grok.com", url: "https://grok.com" }],
    free: false,
  },
  {
    name: "Midjourney",
    emoji: "🎨",
    badge: "الأجمل فناً",
    badgeColor: "bg-pink-500/20 text-pink-300",
    promptKey: "Midjourney",
    steps: [
      "افتح midjourney.com أو Discord",
      'انسخ برومبت "Midjourney" — يحتوي تلقائياً على --ar 2:3 --v 6',
      "في Discord: اكتب /imagine ثم الصق البرومبت",
      "في الموقع: الصقه مباشرة في حقل الإدخال",
    ],
    note: "أفضل نتائج فنية وتفصيل — مدفوع لكن النتائج استثنائية",
    links: [
      { label: "midjourney.com", url: "https://midjourney.com" },
    ],
    free: false,
  },
  {
    name: "DALL-E",
    emoji: "🖼️",
    badge: "سريع",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    promptKey: "DALL-E",
    steps: [
      "عبر ChatGPT: اكتب \"generate image:\" ثم الصق البرومبت",
      "أو افتح labs.openai.com مباشرة",
      'انسخ برومبت "DALL-E" والصقه',
    ],
    note: "أبسط الأدوات للنتائج السريعة — جيد للبروتوتايب",
    links: [
      { label: "labs.openai.com", url: "https://labs.openai.com" },
    ],
    free: false,
  },
  {
    name: "Stable Diffusion / SDXL",
    emoji: "🟠",
    badge: "أكثر تحكم",
    badgeColor: "bg-orange-500/20 text-orange-300",
    promptKey: "Stable Diffusion / SDXL",
    steps: [
      "اختر منصة من الخيارات أدناه",
      'انسخ برومبت "Stable Diffusion / SDXL" في خانة Positive',
      'في خانة Negative أضف: blurry, bad anatomy, ugly, deformed',
      "اختر نموذج SDXL أو Pony أو Illustrious",
    ],
    note: "البرومبت يبدأ بـ score_9, score_8_up — هذا خاص بنماذج SDXL الحديثة",
    links: [
      { label: "civitai.com/generate — مجاني", url: "https://civitai.com/generate" },
      { label: "mage.space — مجاني", url: "https://www.mage.space" },
    ],
    free: true,
  },
  {
    name: "ComfyUI",
    emoji: "🔶",
    badge: "للمحترفين",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
    promptKey: "ComfyUI",
    steps: [
      "افتح ComfyUI على جهازك أو عبر runcomfy.com",
      "في نود KSampler أو CLIP Text Encode (Positive):",
      '   الصق برومبت "ComfyUI" — الجزء بعد "Positive:"',
      "في نود Negative: الصق الجزء بعد \"Negative:\"",
    ],
    note: "الأقوى والأكثر تحكماً — يحتاج إعداد محلي أو حساب RunComfy",
    links: [
      { label: "runcomfy.com — cloud", url: "https://www.runcomfy.com" },
    ],
    free: false,
  },
];

const QUICK_TABLE = [
  { want: "أسرع نتيجة",       use: "ChatGPT أو Gemini",    emoji: "⚡" },
  { want: "أجمل فن",          use: "Midjourney",             emoji: "🎨" },
  { want: "أكثر تحكم",       use: "ComfyUI / SD",           emoji: "🔶" },
  { want: "مجاناً أونلاين",  use: "Civitai أو ImageFX",    emoji: "🆓" },
  { want: "واقعية عالية",    use: "Grok Aurora أو ImageFX", emoji: "📷" },
];

export function PromptGuide({ onClose }: PromptGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900 rounded-t-2xl z-10">
          <div>
            <h2 className="text-white font-bold text-base">دليل استخدام البرومبت</h2>
            <p className="text-white/40 text-xs mt-0.5">كيف توصل شخصيتك لكل أداة ذكاء اصطناعي</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Quick table */}
          <div>
            <p className="text-white/50 text-[11px] font-mono uppercase tracking-wider mb-3">اختار بسرعة</p>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_TABLE.map((row) => (
                <div key={row.want} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <span className="text-white/80 text-xs font-medium">{row.emoji} {row.want}</span>
                  <span className="text-violet-300 text-xs">{row.use}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Tools */}
          <div className="space-y-4">
            <p className="text-white/50 text-[11px] font-mono uppercase tracking-wider">شرح كل أداة</p>

            {TOOLS.map((tool) => (
              <div key={tool.name} className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                {/* Tool header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{tool.emoji}</span>
                    <div>
                      <span className="text-white/90 text-sm font-semibold">{tool.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tool.badgeColor}`}>
                          {tool.badge}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${tool.free ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                          {tool.free ? "مجاني" : "مدفوع"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Prompt label badge */}
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-lg font-mono border border-white/[0.06]">
                    زر: {tool.promptKey}
                  </span>
                </div>

                {/* Steps */}
                <div className="px-4 py-3 space-y-1.5">
                  {tool.steps.map((step, i) => (
                    <div key={i} className="flex gap-2.5 text-xs">
                      <span className="text-violet-400 font-mono font-bold shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="text-white/60 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div className="px-4 pb-3">
                  <div className="flex gap-2 p-2.5 bg-amber-500/[0.07] border border-amber-500/20 rounded-lg">
                    <span className="text-amber-400 text-xs shrink-0">💡</span>
                    <p className="text-amber-200/70 text-[11px] leading-relaxed">{tool.note}</p>
                  </div>
                </div>

                {/* Links */}
                {tool.links.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {tool.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={10} />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="p-3 bg-violet-500/[0.07] border border-violet-500/20 rounded-xl text-center">
            <p className="text-violet-300/70 text-xs leading-relaxed">
              ✨ كلما أكملت أكثر خصائص الشخصية، كلما كان البرومبت أدق والنتيجة أقرب لتصوّرك
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
