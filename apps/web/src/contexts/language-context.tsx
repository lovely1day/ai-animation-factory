"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ar: string, en: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  t: (ar) => ar,
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Lang) || "ar";
    setLangState(saved);
    setMounted(true);
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  // Before mount: always return Arabic to match server-rendered HTML (prevents hydration mismatch)
  const effectiveLang = mounted ? lang : "ar";
  const t = useCallback((ar: string, en: string) => (effectiveLang === "ar" ? ar : en), [effectiveLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: effectiveLang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
