'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Film, Eye, Heart, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { formatNumber } from '@/lib/utils';

interface Summary {
  total_episodes: number;
  total_views: number;
  total_likes: number;
  published_episodes: number;
  generating_episodes: number;
  top_episodes: Array<{ id: string; title: string; view_count: number }>;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [viewsByDay, setViewsByDay] = useState<Array<{ date: string; views: number }>>([]);
  const [viewsByGenre, setViewsByGenre] = useState<Record<string, number>>({});
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, vbd, vbg] = await Promise.all([
          api.get<{ data: Summary }>('/api/analytics/summary', token),
          api.get<{ data: typeof viewsByDay }>('/api/analytics/views-by-day?days=30', token),
          api.get<{ data: Record<string, number> }>('/api/analytics/views-by-genre', token),
        ]);
        setSummary(s.data);
        setViewsByDay(vbd.data);
        setViewsByGenre(vbg.data);
      } catch { /* silent */ }
    };
    load();
  }, [token]);

  const genreData = Object.entries(viewsByGenre).map(([genre, views]) => ({ genre, views }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Episodes', value: summary?.total_episodes || 0, icon: <Film className="w-5 h-5 text-blue-400" /> },
          { label: 'Total Views', value: summary?.total_views || 0, icon: <Eye className="w-5 h-5 text-green-400" /> },
          { label: 'Total Likes', value: summary?.total_likes || 0, icon: <Heart className="w-5 h-5 text-pink-400" /> },
          { label: 'Published', value: summary?.published_episodes || 0, icon: <TrendingUp className="w-5 h-5 text-purple-400" /> },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {stat.icon}
                <span className="text-2xl font-bold">{formatNumber(stat.value)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views by day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Views (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viewsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Views by genre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Views by Genre</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={genreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="genre" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top episodes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Episodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(summary?.top_episodes || []).map((ep, i) => (
              <div key={ep.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm w-5">{i + 1}</span>
                  <span className="text-sm font-medium line-clamp-1">{ep.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatNumber(ep.view_count)} views</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
