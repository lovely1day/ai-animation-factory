'use client';
import React from 'react';
import { QueueManager } from '@/components/QueueManager';

export default function QueuePage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Queue Manager</h1>
        <p className="text-muted-foreground text-sm">Monitor and manage the generation pipeline</p>
      </div>
      <QueueManager token={token} />
    </div>
  );
}
