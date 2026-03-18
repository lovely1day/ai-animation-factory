// apps/web/src/app/(streaming)/browse/page.tsx
import React from "react";
import Image from "next/image";
import { Film, Clock, Play } from "lucide-react";
import type { Episode } from "@ai-animation-factory/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const GENRES = [
  { id: "all", label: "All" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "fantasy", label: "Fantasy" },
  { id: "educational", label: "Educational" },
  { id: "mystery", label: "Mystery" },
  { id: "drama", label: "Drama" },
  { id: "thriller", label: "Thriller" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function fetchEpisodes(genre?: string): Promise<Episode[]> {
  try {
    const url = new URL(`${API_URL}/api/episodes`);
    url.searchParams.set("status", "completed,published");
    url.searchParams.set("limit", "24");
    if (genre && genre !== "all") url.searchParams.set("genre", genre);

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

interface BrowsePageProps {
  searchParams: Promise<{ genre?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const activeGenre = params.genre || "all";
  const episodes = await fetchEpisodes(activeGenre);
  const featured = episodes[0] ?? null;

  return (
    <div className="min-h-screen bg-transparent text-white">

      {/* ── Hero — featured episode ── */}
      {featured && (
        <section className="relative h-[70vh] min-h-[480px] flex items-end">
          {/* Background thumbnail */}
          {featured.thumbnail_url ? (
            <Image
              src={featured.thumbnail_url}
              alt={featured.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-slate-900" />
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />

          {/* Featured info */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
            <div className="max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
                Featured
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
                {featured.title}
              </h1>
              {featured.description && (
                <p className="text-gray-300 text-base mb-6 line-clamp-2 leading-relaxed">
                  {featured.description}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={`/watch/${featured.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </a>
                {featured.genre && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium capitalize">
                    {featured.genre}
                  </span>
                )}
                {featured.duration_seconds && (
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(featured.duration_seconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Genre filter chips ── */}
      <section className="sticky top-16 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {GENRES.map((g) => (
              <a
                key={g.id}
                href={g.id === "all" ? "/browse" : `/browse?genre=${g.id}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeGenre === g.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {g.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Episodes grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            {activeGenre === "all"
              ? "All Episodes"
              : GENRES.find((g) => g.id === activeGenre)?.label ?? "Episodes"}
          </h2>
          <span className="text-sm text-gray-500">
            {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Film className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">No episodes available yet</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon for new content</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {episodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <a
      href={`/watch/${episode.id}`}
      className="group block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail — 16:9 */}
      <div className="relative aspect-video bg-slate-800 overflow-hidden">
        {episode.thumbnail_url ? (
          <Image
            src={episode.thumbnail_url}
            alt={episode.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-slate-800 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {episode.duration_seconds && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
            {formatDuration(episode.duration_seconds)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-white text-sm font-semibold line-clamp-2 leading-snug mb-2">
          {episode.title}
        </p>
        {episode.genre && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium capitalize">
            {episode.genre}
          </span>
        )}
      </div>
    </a>
  );
}
