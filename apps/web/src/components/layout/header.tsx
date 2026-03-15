"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Film, ChevronLeft, ChevronRight, LogIn, LogOut, User, ChevronDown, Globe, LayoutDashboard } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function AppHeader() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";

  // Track scroll for header style
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
  };

  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/40"
          : "bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        {/* ── Left side: Back + Logo ── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button — hidden on home */}
          {!isHome && (
            <button
              onClick={() => router.back()}
              aria-label={t("رجوع", "Go back")}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <BackIcon className="w-4 h-4" />
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block font-bold text-base bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
              {t("مصنع الأنيميشن", "AI Animation Factory")}
            </span>
          </Link>
        </div>


        {/* ── Right side: Auth only ── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Queue link */}
          <Link
            href="/cms/queue"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              pathname.startsWith("/cms/queue")
                ? "bg-purple-500/15 border-purple-500/25 text-purple-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-purple-400" />
            <span className="font-medium">{t("مراقبة الإنتاج", "Queue")}</span>
          </Link>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={t("تغيير اللغة", "Toggle language")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-sm text-gray-300 hover:text-white transition-all"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="font-medium">{lang === "ar" ? "EN" : "عربي"}</span>
          </button>

          {/* Auth section */}
          {user ? (
            /* User menu */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all"
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="avatar"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="hidden sm:block text-sm text-gray-300 max-w-[100px] truncate">
                  {user.user_metadata?.name || user.email?.split("@")[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full mt-2 end-0 w-52 bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-gray-500">{t("مسجل بـ", "Signed in as")}</p>
                    <p className="text-sm text-white truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/cms/episodes"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Film className="w-4 h-4 text-purple-400" />
                      {t("لوحة التحكم", "Dashboard")}
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("تسجيل الخروج", "Sign out")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Google Sign-in */
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
            >
              {/* Google icon */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#fff" fillOpacity=".9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" fillOpacity=".75" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" fillOpacity=".6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" fillOpacity=".5" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="hidden sm:block">{t("دخول بجوجل", "Sign in with Google")}</span>
              <LogIn className="w-4 h-4 sm:hidden" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
