"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/language-context";

/**
 * JL canonical back button — mounted globally.
 *
 * Rules (from JL-PROJECT-STANDARDS):
 *  - Always visible except on the landing route ('/').
 *  - Always localized + RTL-aware (arrow direction flips per language).
 *  - Uses router.back() — if there is no history, browser falls back to '/'.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { t, lang } = useLang();

  // Hide on landing page only
  if (pathname === "/") return null;

  const Arrow = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={t("رجوع", "Back")}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c9a84c]/40 text-gray-300 hover:text-[#c9a84c] text-sm transition-all"
    >
      <Arrow className="w-4 h-4" />
      <span>{t("رجوع", "Back")}</span>
    </button>
  );
}

export default BackButton;
