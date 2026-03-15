// apps/web/src/app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/contexts/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(t("البريد أو كلمة المرور غير صحيحة.", "Invalid email or password."));
    } else {
      router.push("/cms/episodes");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/cms/episodes` },
    });
    setGoogleLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) {
      setError(err.message);
    } else {
      setSuccess(t("تم إرسال رابط إعادة التعيين إلى بريدك.", "Password reset link sent to your email."));
    }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(168,85,247,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.5)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <Film className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {showForgot ? t("استعادة كلمة المرور", "Reset Password") : t("مرحباً بك", "Welcome back")}
              </span>
            </h1>
            <p className="text-gray-400 text-sm">
              {showForgot
                ? t("أدخل بريدك وسنرسل لك رابط الاستعادة", "Enter your email for a reset link")
                : t("سجل دخولك للمتابعة", "Sign in to continue")}
            </p>
          </div>

          {!showForgot ? (
            <>
              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-medium transition-all mb-5 disabled:opacity-60 shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {t("الدخول بحساب جوجل", "Continue with Google")}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500">{t("أو بالبريد الإلكتروني", "or with email")}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">
                    {t("البريد الإلكتروني", "Email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-400">
                      {t("كلمة المرور", "Password")}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {t("نسيت كلمة المرور؟", "Forgot password?")}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 pe-12 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 mt-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("تسجيل الدخول", "Sign In")}
                </button>
              </form>
            </>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleForgotPassword}
              className="space-y-4"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
              </div>

              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder={t("بريدك الإلكتروني", "Your email")}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 outline-none transition-all"
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading || !forgotEmail}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("إرسال رابط الاستعادة", "Send Reset Link")}
              </button>

              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(null); setSuccess(null); }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
              >
                {t("العودة لتسجيل الدخول", "Back to sign in")}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
