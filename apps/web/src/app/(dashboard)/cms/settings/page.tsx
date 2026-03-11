'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface Config {
  key: string;
  value: string;
  description?: string;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    // Using Supabase client-side for settings
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('scheduler_config')
        .select('key, value, description')
        .eq('is_active', true)
        .then(({ data }: { data: { key: string; value: unknown; description?: string }[] | null }) => {
          if (data) {
            setConfigs(data.map((c) => ({ key: c.key, value: String(c.value), description: c.description })));
          }
        });
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      for (const config of configs) {
        await supabase
          .from('scheduler_config')
          .update({ value: config.value })
          .eq('key', config.key);
      }
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfigs((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configs.map((config) => (
            <div key={config.key} className="space-y-1">
              <label className="text-sm font-medium capitalize">
                {config.key.replace(/_/g, ' ')}
              </label>
              {config.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
              <Input
                value={config.value}
                onChange={(e) => updateConfig(config.key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
