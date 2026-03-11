import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const statusColors: Record<string, string> = {
  pending: 'bg-gray-500',
  generating: 'bg-blue-500',
  processing: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  published: 'bg-purple-500',
  archived: 'bg-gray-600',
};

export const genreColors: Record<string, string> = {
  adventure: 'bg-orange-500',
  comedy: 'bg-yellow-400',
  drama: 'bg-pink-500',
  'sci-fi': 'bg-cyan-500',
  fantasy: 'bg-purple-500',
  horror: 'bg-red-700',
  romance: 'bg-rose-400',
  thriller: 'bg-gray-700',
  educational: 'bg-green-500',
  mystery: 'bg-indigo-500',
};
