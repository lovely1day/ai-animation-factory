-- ============================================================
-- EPISODE COSTS TRACKING — أداة قياس التكلفة الحقيقية لكل حلقة
-- Date: 2026-04-19
-- ============================================================
-- جدول إضافي فقط — لا يُعدّل أي شيء من البايبلاين الحالي.
-- يسجّل كل استهلاك فعلي (LLM tokens, images, voice, music, animation)
-- لمعرفة تكلفة كل حلقة وعائد الاستثمار الحقيقي.
-- ============================================================

CREATE TABLE IF NOT EXISTS episode_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,

  -- تصنيف التكلفة
  cost_category TEXT NOT NULL CHECK (
    cost_category IN (
      'llm_script',       -- Claude/Gemini/GPT لتوليد السكربت
      'llm_visual',       -- Visual Director / Creative Council
      'llm_other',        -- أي استدعاء LLM آخر (تلخيص، ترجمة، إلخ)
      'image_gen',        -- Pollinations/FLUX/HuggingFace
      'voice_tts',        -- ElevenLabs/OpenAI
      'music_gen',        -- Mubert/Suno
      'animation',        -- Runway/Pika/Kling
      'assembly_compute', -- FFmpeg عمليات محلية (wall-clock)
      'storage',          -- Supabase/R2/S3 egress أو storage
      'other'             -- أي تكلفة أخرى
    )
  ),

  -- المزود والنموذج
  provider TEXT NOT NULL,   -- e.g. 'claude-sonnet-4-6', 'gemini-2.5', 'pollinations', 'elevenlabs', 'native'
  model TEXT,               -- اختياري — اسم نموذج محدد

  -- الكمية والوحدة
  quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,       -- 'tokens' | 'chars' | 'seconds' | 'images' | 'videos' | 'bytes'

  -- التكلفة الفعلية بالدولار (دقة 6 أرقام — للمبالغ الصغيرة)
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,

  -- تفاصيل إضافية (input/output tokens, cache hits, latency, retries...)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS episode_costs_episode_id_idx ON episode_costs(episode_id);
CREATE INDEX IF NOT EXISTS episode_costs_category_idx ON episode_costs(cost_category);
CREATE INDEX IF NOT EXISTS episode_costs_provider_idx ON episode_costs(provider);
CREATE INDEX IF NOT EXISTS episode_costs_created_at_idx ON episode_costs(created_at DESC);

-- ============================================================
-- VIEW: ملخص التكلفة لكل حلقة — استعلام سريع للوحات القيادة
-- ============================================================
CREATE OR REPLACE VIEW episode_cost_summary AS
SELECT
  e.id AS episode_id,
  e.title,
  e.project_id,
  e.status,
  e.duration_seconds,
  COALESCE(SUM(c.cost_usd), 0)::NUMERIC(12, 6) AS total_cost_usd,
  COUNT(c.id) AS cost_entries,
  COALESCE(SUM(c.cost_usd) FILTER (WHERE c.cost_category LIKE 'llm_%'), 0)::NUMERIC(12, 6) AS llm_cost_usd,
  COALESCE(SUM(c.cost_usd) FILTER (WHERE c.cost_category = 'image_gen'), 0)::NUMERIC(12, 6) AS image_cost_usd,
  COALESCE(SUM(c.cost_usd) FILTER (WHERE c.cost_category = 'voice_tts'), 0)::NUMERIC(12, 6) AS voice_cost_usd,
  COALESCE(SUM(c.cost_usd) FILTER (WHERE c.cost_category = 'music_gen'), 0)::NUMERIC(12, 6) AS music_cost_usd,
  COALESCE(SUM(c.cost_usd) FILTER (WHERE c.cost_category = 'animation'), 0)::NUMERIC(12, 6) AS animation_cost_usd,
  MIN(c.created_at) AS first_cost_at,
  MAX(c.created_at) AS last_cost_at
FROM episodes e
LEFT JOIN episode_costs c ON c.episode_id = e.id
GROUP BY e.id, e.title, e.project_id, e.status, e.duration_seconds;

-- ============================================================
-- RLS — نفس نمط الإنتاج (service role يتجاوز، authenticated يرى حلقاته)
-- ============================================================
ALTER TABLE episode_costs ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى تكاليف حلقاته فقط
CREATE POLICY "episode_costs_select_own"
  ON episode_costs FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT id FROM episodes WHERE created_by = auth.uid()
    )
  );

-- الكتابة عبر service role فقط (الـ API backend) — authenticated لا يكتب مباشرة
-- (لا نضيف INSERT/UPDATE/DELETE policies — service_role يتجاوز RLS)

-- ============================================================
-- COMMENTS (توثيق)
-- ============================================================
COMMENT ON TABLE episode_costs IS 'Tracks actual costs per episode across all pipeline stages. Added 2026-04-19.';
COMMENT ON COLUMN episode_costs.cost_usd IS 'Actual USD cost at time of operation (6 decimals for precision).';
COMMENT ON COLUMN episode_costs.metadata IS 'Provider-specific details: input/output tokens, cache hits, latency_ms, retries, etc.';
COMMENT ON VIEW episode_cost_summary IS 'Per-episode cost aggregates — use for dashboards instead of raw aggregation.';
