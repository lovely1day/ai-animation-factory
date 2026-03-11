'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { EpisodeGrid } from '@/components/EpisodeGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { statusColors } from '@/lib/utils';
import type { Episode } from '@ai-animation-factory/shared';

const STATUS_OPTIONS = ['all', 'pending', 'generating', 'completed', 'failed', 'published'];

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      params.set('limit', '50');

      const res = await api.get<{ data: Episode[]; pagination: { total: number } }>(
        `/api/episodes?${params.toString()}`,
        token
      );
      setEpisodes(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast({ title: `Failed to load episodes: ${(err as Error).message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, status, search]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/api/episodes/${id}`, { status: 'published' }, token);
      toast({ title: 'Episode published' });
      fetchEpisodes();
    } catch {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Episodes</h1>
          <p className="text-muted-foreground text-sm">{total} total</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchEpisodes} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search episodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                status === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <EpisodeGrid
        episodes={episodes}
        showStatus
        emptyMessage={loading ? 'Loading...' : 'No episodes found'}
        hrefPrefix="/cms/episodes"
      />
    </div>
  );
}
