'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface QueueStat {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueManagerProps {
  token: string;
}

export function QueueManager({ token }: QueueManagerProps) {
  const [stats, setStats] = useState<QueueStat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: QueueStat[] }>('/api/generation/queue', token);
      setStats(res.data);
    } catch {
      toast({ title: 'Failed to fetch queue stats', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleGenerate = async () => {
    try {
      await api.post('/api/generation/start', { count: 1 }, token);
      toast({ title: 'Episode generation started' });
      fetchStats();
    } catch (err) {
      toast({ title: `Failed: ${(err as Error).message}`, variant: 'destructive' });
    }
  };

  const handleClean = async () => {
    try {
      await api.post('/api/generation/clean', {}, token);
      toast({ title: 'Queue cleaned' });
      fetchStats();
    } catch {
      toast({ title: 'Failed to clean queue', variant: 'destructive' });
    }
  };

  const totalActive = stats.reduce((s, q) => s + q.active, 0);
  const totalWaiting = stats.reduce((s, q) => s + q.waiting, 0);
  const totalFailed = stats.reduce((s, q) => s + q.failed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-blue-400 font-medium">{totalActive} active</span>
          <span className="text-yellow-400 font-medium">{totalWaiting} waiting</span>
          <span className="text-red-400 font-medium">{totalFailed} failed</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleClean}>
            <Trash2 className="w-4 h-4 mr-1" />
            Clean
          </Button>
          <Button size="sm" onClick={handleGenerate}>
            <Play className="w-4 h-4 mr-1" />
            Generate Episode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((queue) => (
          <Card key={queue.name} className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {queue.name.replace(/-/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <Badge variant={queue.active > 0 ? 'default' : 'secondary'} className="text-xs">
                    {queue.active}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waiting</span>
                  <Badge variant="secondary" className="text-xs">{queue.waiting}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <Badge variant="success" className="text-xs">{queue.completed}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed</span>
                  <Badge variant={queue.failed > 0 ? 'destructive' : 'secondary'} className="text-xs">
                    {queue.failed}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
