// apps/web/src/app/(streaming)/watch/[id]/page.tsx
import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Eye, Heart, Share2, Clock, Film, Calendar, Play } from "lucide-react";
import type { Episode } from "@ai-animation-factory/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

async function getEpisode(id: string): Promise<Episode | null> {
  try {
    const res = await fetch(`${API_URL}/api/episodes/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.episode ?? json.data ?? null;
  } catch {
    return null;
  }
}

async function getRelated(genre: string, excludeId: string): Promise<Episode[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/episodes?genre=${genre}&limit=6&status=published`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return ((json.data as Episode[]) || [])
      .filter((e) => e.id !== excludeId)
      .slice(0, 5);
  } catch {
    return [];
  }
}

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const episode = await getEpisode(id);

  if (!episode || !["published", "completed"].includes(episode.status)) notFound();

  const related = await getRelated(episode.genre || 'general', episode.id);

  return (
    <div className="min-h-screen bg-transparent text-white">


      <div className="relative max-w-6xl mx-auto px-4 py-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Video player */}
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50">
              {episode.final_video_url ? (
                <VideoPlayer
                  src={episode.final_video_url}
                  subtitleUrl={episode.subtitle_url}
                  poster={episode.thumbnail_url}
                  title={episode.title}
                />
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center bg-slate-900 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Film className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">Video not available</p>
                </div>
              )}
            </div>

            {/* Episode info */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {episode.title}
              </h1>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                {episode.genre && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold capitalize">
                    {episode.genre}
                  </span>
                )}
                {episode.target_audience && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-gray-300 text-sm font-medium capitalize">
                    {episode.target_audience}
                  </span>
                )}
                {episode.duration_seconds && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(episode.duration_seconds)}
                  </span>
                )}
              </div>

              {/* Stats + actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                <div className="flex items-center gap-5 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-gray-500" />
                    {formatNumber(episode.view_count ?? 0)} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-gray-500" />
                    {formatNumber(episode.like_count ?? 0)}
                  </span>
                  {episode.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {timeAgo(episode.published_at)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              {/* Description */}
              {episode.description && (
                <p className="text-gray-300 text-sm leading-relaxed pt-1">
                  {episode.description}
                </p>
              )}

              {/* Tags */}
              {episode.tags && episode.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {episode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-gray-200 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Related episodes sidebar ── */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 inline-block" />
              More Like This
            </h2>

            {related.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm">No related episodes found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {related.map((ep) => (
                  <RelatedCard key={ep.id} episode={ep} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedCard({ episode }: { episode: Episode }) {
  return (
    <a
      href={`/watch/${episode.id}`}
      className="flex gap-3 group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-purple-500/30 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative w-28 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
        {episode.thumbnail_url ? (
          <Image
            src={episode.thumbnail_url}
            alt={episode.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-slate-800 flex items-center justify-center">
            <Film className="w-5 h-5 text-gray-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <Play className="w-4 h-4 fill-white text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
          {episode.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {episode.genre && (
            <span className="text-xs text-purple-400 capitalize">{episode.genre}</span>
          )}
          {episode.view_count != null && (
            <span className="text-xs text-gray-500">
              · {formatNumber(episode.view_count)} views
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
