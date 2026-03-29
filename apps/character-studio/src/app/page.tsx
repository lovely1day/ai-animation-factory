"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Dna, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface Character {
  id: string;
  name: string;
  dna: string;
  preview_url?: string;
  gender?: string;
  era_code?: string;
  created_at: string;
}

function CharacterCard({ char }: { char: Character }) {
  const genderLabel = char.gender === "M" ? "ذكر" : char.gender === "F" ? "أنثى" : "—";
  const initials = char.name?.slice(0, 2) || "??";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-violet-500/30 transition-all"
    >
      {/* Portrait */}
      <div className="aspect-[3/4] bg-gradient-to-br from-violet-900/20 to-pink-900/10 flex items-center justify-center relative overflow-hidden">
        {char.preview_url ? (
          <img src={char.preview_url} alt={char.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-violet-300">{initials}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Link href={`/studio?id=${char.id}`}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors">
            تعديل
          </Link>
          <Link href={`/extract?load=${char.id}`}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
            DNA
          </Link>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate">{char.name || "بدون اسم"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{genderLabel}</span>
          {char.era_code && (
            <span className="text-[10px] text-white/30">{char.era_code}</span>
          )}
        </div>
        {/* DNA snippet */}
        <p className="text-[9px] text-white/20 font-mono mt-2 truncate">{char.dna?.slice(0, 40)}…</p>
      </div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/characters`)
      .then(r => r.json())
      .then(d => { setCharacters(d.characters ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = characters.filter(c =>
    !search || c.name?.includes(search) || c.dna?.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">كتالوج الشخصيات</h1>
          <p className="text-xs text-white/30 mt-1">
            {characters.length} شخصية مسجّلة · يغذي المصنع وأي أداة أخرى
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/extract"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-sm transition-all">
            <Dna className="w-4 h-4" />
            DNA Extractor
          </Link>
          <Link href="/studio"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all">
            <Plus className="w-4 h-4" />
            شخصية جديدة
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو DNA…"
            dir="rtl"
            className="w-full pr-10 pl-4 py-2.5 rounded-xl glass text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/40"
          />
        </div>
        <button className="btn-ghost flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          فلتر
        </button>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "إجمالي الشخصيات", value: characters.length, color: "text-violet-400" },
            { label: "ذكر", value: characters.filter(c => c.gender === "M").length, color: "text-blue-400" },
            { label: "أنثى", value: characters.filter(c => c.gender === "F").length, color: "text-pink-400" },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl px-4 py-3">
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-white/30">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm">جاري تحميل الشخصيات…</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/20">
          <Users className="w-10 h-10" />
          <p className="text-sm">{search ? "لا نتائج" : "لا شخصيات بعد"}</p>
          {!search && (
            <Link href="/studio" className="btn-primary text-xs">ابني أول شخصية</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {visible.map((char, i) => (
            <motion.div key={char.id} transition={{ delay: i * 0.03 }}>
              <CharacterCard char={char} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
