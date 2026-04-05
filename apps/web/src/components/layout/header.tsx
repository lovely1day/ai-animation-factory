"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  LayoutDashboard,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Globe,
  Command,
  Search,
  Bell,
  Menu,
  X
} from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Command Palette Button
function CmdButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      suppressHydrationWarning
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-white text-sm transition-all"
    >
      <Search className="w-4 h-4" />
      <span className="text-xs">Search</span>
      <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono text-gray-500">
        <Command className="w-3 h-3" />
        K
      </kbd>
    </button>
  );
}

// Nav Link Component
function NavLink({ 
  href, 
  icon: Icon, 
  label, 
  isActive 
}: { 
  href: string; 
  icon: any; 
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "text-white"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-white/10 rounded-lg"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
        {label}
      </span>
    </Link>
  );
}

// Notification Badge
function NotificationBell({ count }: { count: number }) {
  return (
    <button suppressHydrationWarning className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

export default function AppHeader() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const isDashboard = pathname?.startsWith("/cms") || false;

  // Track scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auth state — check Supabase Auth first, then API JWT fallback
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        // Fallback: check API JWT token in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ email: payload.email, id: payload.id, user_metadata: { full_name: payload.full_name || payload.email?.split('@')[0] } } as any);
          } catch {}
        }
      }
    });
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

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    setUser(null);
    setUserMenuOpen(false);
  };

  const navItems = [
    { href: "/cms/episodes", icon: Film, label: t("المشاريع", "Projects") },
    { href: "/cms/queue", icon: LayoutDashboard, label: t("الإنتاج", "Production") },
    { href: "/cms/analytics", icon: BarChart3, label: t("التحليلات", "Analytics") },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
                <Film className="w-5 h-5 text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <span className="block font-bold text-sm text-white leading-tight">
                  AI Animation
                </span>
                <span className="block text-[10px] text-purple-400 font-medium">
                  Factory
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={pathname?.startsWith(item.href) || false}
                />
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Command Palette */}
              <CmdButton onClick={() => setSearchOpen(true)} />

              {/* Create Button */}
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>{t("إنشاء", "Create")}</span>
              </Link>

              {/* Notifications */}
              <NotificationBell count={3} />

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                suppressHydrationWarning
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title={t("تغيير اللغة", "Toggle language")}
              >
                <Globe className="w-5 h-5" />
              </button>

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-[#0f0f1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5">
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/cms/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Settings className="w-4 h-4" />
                            {t("الإعدادات", "Settings")}
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("تسجيل الخروج", "Sign out")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
                >
                  {t("دخول", "Sign in")}
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                suppressHydrationWarning
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname?.startsWith(item.href)
                      ? "bg-purple-500/20 text-purple-300"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium"
              >
                <Plus className="w-5 h-5" />
                {t("إنشاء حلقة", "Create Episode")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
