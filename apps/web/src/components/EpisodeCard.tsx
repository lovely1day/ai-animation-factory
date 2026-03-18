'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Eye, Heart, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatNumber, timeAgo, genreColors, statusColors } from '@/lib/utils';
import type { Episode } from '@ai-animation-factory/shared';

interface EpisodeCardProps {
  episode: Episode;
  showStatus?: boolean;
  href?: string;
}

export function EpisodeCard({ episode, showStatus = false, href }: EpisodeCardProps) {
  const link = href || `/watch/${episode.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="episode-card group relative rounded-xl overflow-hidden bg-card border border-border cursor-pointer"
    >
      <Link href={link}>
        <div className="relative aspect-video bg-black">
          {episode.thumbnail_url ? (
            <Image
              src={episode.thumbnail_url}
              alt={episode.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
              <Play className="w-12 h-12 text-white/30" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>

          {/* Duration badge */}
          {episode.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(episode.duration_seconds)}
            </div>
          )}

          {/* Status badge */}
          {showStatus && (
            <div className="absolute top-2 left-2">
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[episode.status] || 'bg-gray-500'}`}>
                {episode.status}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {episode.title}
          </h3>

          <div className="flex items-center justify-between">
            <Badge
              className={`text-xs text-white ${genreColors[episode.genre || 'general'] || 'bg-gray-600'}`}
            >
              {episode.genre || 'general'}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo(episode.createdAt)}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(episode.view_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatNumber(episode.like_count || 0)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
