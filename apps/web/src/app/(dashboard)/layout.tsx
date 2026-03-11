'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  BarChart2,
  Layers,
  Settings,
  Home,
  Menu,
  X,
  Sparkles,
  Globe,
  LogOut,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cms/episodes', label: 'Episodes', icon: Film },
  { href: '/cms/queue', label: 'Queue', icon: Layers },
  { href: '/cms/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/cms/settings', label: 'Settings', icon: Settings },
  { href: '/browse', label: 'Browse', icon: Globe },
];

function getBreadcrumb(pathname: string): string {
  if (pathname === '/') return 'Home';
  const segments = pathname.split('/').filter(Boolean);
  return segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' / ');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <AnimatePresence>
        {(open || true) && (
          <>
            {/* Desktop sidebar — always visible */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col w-64 bg-slate-900/90 backdrop-blur-xl border-r border-white/10">
              {/* Logo */}
              <div className="flex items-center gap-3 h-16 px-6 border-b border-white/10">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Factory
                </span>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    href === '/'
                      ? pathname === '/'
                      : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500 pl-[10px]'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent pl-[10px]'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {/* User section */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300 font-semibold">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Admin</p>
                    <p className="text-xs text-gray-500 truncate">admin@aifactory.com</p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
              {open && (
                <>
                  <motion.div
                    key="overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                  />
                  <motion.aside
                    key="mobile-sidebar"
                    initial={{ x: -256 }}
                    animate={{ x: 0 }}
                    exit={{ x: -256 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 lg:hidden"
                  >
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          AI Factory
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Close sidebar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                      {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive =
                          href === '/'
                            ? pathname === '/'
                            : pathname === href || pathname.startsWith(`${href}/`);
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500 pl-[10px]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent pl-[10px]'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300 font-semibold">
                          A
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">Admin</p>
                        </div>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                          title="Logout"
                          aria-label="Logout"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <p className="text-sm text-gray-400">
              <span className="text-gray-600">Dashboard</span>
              {pathname !== '/' && (
                <>
                  <span className="mx-2 text-gray-700">/</span>
                  <span className="text-gray-300">{getBreadcrumb(pathname)}</span>
                </>
              )}
            </p>
          </div>

          {/* View Site button */}
          <Link
            href="/browse"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-sm text-gray-300 hover:text-white transition-all duration-150 border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
