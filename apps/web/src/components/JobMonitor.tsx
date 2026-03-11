'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { GenerationJob } from '@ai-animation-factory/shared';

interface JobMonitorProps {
  episodeId: string;
}

const JOB_LABELS: Record<string, string> = {
  idea_generation: 'Idea',
  script_writing: 'Script',
  scene_prompts: 'Prompts',
  image_generation: 'Images',
  animation: 'Animation',
  voice_generation: 'Voice',
  music_generation: 'Music',
  video_assembly: 'Assembly',
  subtitle_generation: 'Subtitles',
  thumbnail_generation: 'Thumbnail',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  active: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-gray-400" />,
};

export function JobMonitor({ episodeId }: JobMonitorProps) {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);

  useEffect(() => {
    // Initial load
    supabase
      .from('generation_jobs')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at')
      .then(({ data }: { data: GenerationJob[] | null }) => {
        if (data) setJobs(data);
      });

    // Real-time subscription
    const subscription = supabase
      .channel(`jobs:${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs',
          filter: `episode_id=eq.${episodeId}`,
        },
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [...prev, payload.new as unknown as GenerationJob]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === (payload.new as { id: string }).id
                  ? (payload.new as unknown as GenerationJob)
                  : j
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [episodeId]);

  const overallProgress =
    jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="flex-shrink-0">
              {statusIcons[job.status] || statusIcons.pending}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {JOB_LABELS[job.job_type] || job.job_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {job.completed_at
                    ? timeAgo(job.completed_at)
                    : job.started_at
                    ? 'Running...'
                    : 'Queued'}
                </span>
              </div>
              {job.status === 'active' && (
                <Progress value={job.progress} className="h-1 mt-1" />
              )}
              {job.error_message && (
                <p className="text-xs text-red-400 mt-1 truncate">{job.error_message}</p>
              )}
            </div>
            <Badge
              variant={
                job.status === 'completed'
                  ? 'success'
                  : job.status === 'failed'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs"
            >
              {job.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
