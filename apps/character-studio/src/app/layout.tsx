import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Character Studio — JackoLeeno",
  description: "بناء شخصيات AI بنظام DNA فريد — يغذي المصنع وأي أداة أخرى",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        {/* Nav */}
        <header className="fixed top-0 inset-x-0 z-50 h-14 glass border-b border-white/[0.06] flex items-center px-6 gap-4">
          <div className="flex items-center gap-2">
            {/* JL Monogram */}
            <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
              <path d="M20 15 L20 55 Q20 68 35 68 Q48 68 50 55" stroke="url(#jg)" strokeWidth="7" strokeLinecap="round" fill="none"/>
              <path d="M44 15 L44 65 L68 65" stroke="url(#lg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#fbbf24"/></linearGradient>
              </defs>
            </svg>
            <span className="text-sm font-bold gradient-text">Character Studio</span>
          </div>
          <nav className="flex items-center gap-1 mr-4">
            <a href="/" className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all">الكتالوج</a>
            <a href="/studio" className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all">البناء</a>
            <a href="/extract" className="px-3 py-1.5 rounded-lg text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all font-medium">
              ✦ DNA Extractor
            </a>
          </nav>
          <div className="mr-auto text-[10px] text-white/20">
            by JackoLeeno JL
          </div>
        </header>
        <main className="pt-14 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
