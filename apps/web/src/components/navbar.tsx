// apps/web/src/components/Navbar.tsx
"use client";

import { Globe } from "lucide-react";
import Link from "next/link";

export default function Navbar({ currentLang }: { currentLang: "ar" | "en" }) {
  
  const toggleLang = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    localStorage.setItem("lang", newLang);
    window.location.reload(); // إعادة التحميل لتحديث كل المكونات دفعة واحدة
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* شعار المصنع - يرجعك للرئيسية */}
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          AI Animation Factory
        </Link>

        {/* زر تبديل اللغة بنفس ستايل صفحة الكريتور */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-sm text-gray-300 transition-all"
        >
          <Globe className="w-4 h-4 text-purple-400" />
          {currentLang === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </nav>
  );
}