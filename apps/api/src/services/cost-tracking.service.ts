import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * cost-tracking.service.ts
 *
 * خدمة اختيارية لتسجيل التكلفة الفعلية لكل عملية في بايبلاين الحلقة.
 * - لا تُستدعى تلقائياً من أي worker حالي.
 * - اختياري — ضع `costTracking.record(...)` في نقاط الاستدعاء حين تقرر.
 * - الأخطاء مكتومة: فشل التسجيل لا يكسر البايبلاين.
 *
 * Migration: supabase/migrations/20260419000001_episode_costs_tracking.sql
 */

export type CostCategory =
  | 'llm_script'
  | 'llm_visual'
  | 'llm_other'
  | 'image_gen'
  | 'voice_tts'
  | 'music_gen'
  | 'animation'
  | 'assembly_compute'
  | 'storage'
  | 'other';

export type CostUnit = 'tokens' | 'chars' | 'seconds' | 'images' | 'videos' | 'bytes';

export interface CostEntry {
  episodeId: string;
  category: CostCategory;
  provider: string;
  model?: string;
  quantity: number;
  unit: CostUnit;
  costUsd: number;
  metadata?: Record<string, unknown>;
}

export interface EpisodeCostSummary {
  episode_id: string;
  title: string | null;
  total_cost_usd: number;
  cost_entries: number;
  llm_cost_usd: number;
  image_cost_usd: number;
  voice_cost_usd: number;
  music_cost_usd: number;
  animation_cost_usd: number;
}

// ─── Pricing Tables (SSOT — لتسهيل calculateFoo helpers) ────────────────────

/** Claude — pricing per 1M tokens (USD). Updated 2026-04. */
export const CLAUDE_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':       { input: 15.0, output: 75.0 },
  'claude-opus-4-7':       { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6':     { input: 3.0,  output: 15.0 },
  'claude-haiku-4-5':      { input: 0.8,  output: 4.0 },
};

/** Gemini — pricing per 1M tokens (USD). */
export const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-pro':        { input: 1.25, output: 5.0 },
  'gemini-2.5-flash':      { input: 0.075, output: 0.3 },
};

// ─── Cost Calculators ───────────────────────────────────────────────────────

export function calculateClaudeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
  cacheWriteTokens = 0
): number {
  const pricing = CLAUDE_PRICING[model] || CLAUDE_PRICING['claude-sonnet-4-6'];
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (cacheWriteTokens / 1_000_000) * pricing.input * 1.25 +
    (cacheReadTokens / 1_000_000) * pricing.input * 0.1 +
    (outputTokens / 1_000_000) * pricing.output
  );
}

export function calculateGeminiCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING['gemini-2.5-flash'];
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

// ─── Service ────────────────────────────────────────────────────────────────

class CostTrackingService {
  /**
   * يسجّل عنصر تكلفة واحد — فشل التسجيل لا يكسر البايبلاين.
   */
  async record(entry: CostEntry): Promise<void> {
    try {
      const { error } = await supabase.from('episode_costs').insert({
        episode_id: entry.episodeId,
        cost_category: entry.category,
        provider: entry.provider,
        model: entry.model ?? null,
        quantity: entry.quantity,
        unit: entry.unit,
        cost_usd: entry.costUsd,
        metadata: entry.metadata ?? {},
      });

      if (error) {
        logger.warn(
          { episode_id: entry.episodeId, category: entry.category, error: error.message },
          'Cost record failed (non-fatal)'
        );
      }
    } catch (err: any) {
      logger.warn(
        { episode_id: entry.episodeId, error: err?.message },
        'Cost record threw (non-fatal)'
      );
    }
  }

  /**
   * تسجيل دفعة — أكفأ إن كان عندك عدة عناصر لنفس العملية.
   */
  async recordBatch(entries: CostEntry[]): Promise<void> {
    if (entries.length === 0) return;
    try {
      const { error } = await supabase.from('episode_costs').insert(
        entries.map((entry) => ({
          episode_id: entry.episodeId,
          cost_category: entry.category,
          provider: entry.provider,
          model: entry.model ?? null,
          quantity: entry.quantity,
          unit: entry.unit,
          cost_usd: entry.costUsd,
          metadata: entry.metadata ?? {},
        }))
      );
      if (error) {
        logger.warn({ count: entries.length, error: error.message }, 'Cost batch failed (non-fatal)');
      }
    } catch (err: any) {
      logger.warn({ count: entries.length, error: err?.message }, 'Cost batch threw (non-fatal)');
    }
  }

  /**
   * helper لتسجيل استدعاء Claude مباشرة (الصيغة الأشيع).
   */
  async recordClaudeCall(args: {
    episodeId: string;
    category: CostCategory;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    durationMs?: number;
  }): Promise<void> {
    const costUsd = calculateClaudeCost(
      args.model,
      args.inputTokens,
      args.outputTokens,
      args.cacheReadTokens ?? 0,
      args.cacheWriteTokens ?? 0
    );
    await this.record({
      episodeId: args.episodeId,
      category: args.category,
      provider: 'anthropic',
      model: args.model,
      quantity: args.inputTokens + args.outputTokens,
      unit: 'tokens',
      costUsd,
      metadata: {
        input_tokens: args.inputTokens,
        output_tokens: args.outputTokens,
        cache_read_tokens: args.cacheReadTokens ?? 0,
        cache_write_tokens: args.cacheWriteTokens ?? 0,
        duration_ms: args.durationMs,
      },
    });
  }

  /**
   * ملخص تكلفة حلقة واحدة (من الـ view).
   */
  async getEpisodeSummary(episodeId: string): Promise<EpisodeCostSummary | null> {
    const { data, error } = await supabase
      .from('episode_cost_summary')
      .select('*')
      .eq('episode_id', episodeId)
      .maybeSingle();
    if (error) {
      logger.warn({ episode_id: episodeId, error: error.message }, 'Episode cost summary query failed');
      return null;
    }
    return (data as EpisodeCostSummary) || null;
  }
}

export const costTracking = new CostTrackingService();
