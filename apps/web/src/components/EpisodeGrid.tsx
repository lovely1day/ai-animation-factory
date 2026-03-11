'use client';
import React from 'react';
import { EpisodeCard } from './EpisodeCard';
import type { Episode } from '@ai-animation-factory/shared';

interface EpisodeGridProps {
  episodes: Episode[];
  showStatus?: boolean;
  emptyMessage?: string;
  hrefPrefix?: string;
}

export function EpisodeGrid({
  episodes,
  showStatus = false,
  emptyMessage = 'No episodes found',
  hrefPrefix,
}: EpisodeGridProps) {
  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {episodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          showStatus={showStatus}
          href={hrefPrefix ? `${hrefPrefix}/${episode.id}` : undefined}
        />
      ))}
    </div>
  );
}
