import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processOutput } from '../output-manager.service';

// Mock deps that hit external services
vi.mock('../../config/supabase', () => ({
  supabase: { from: vi.fn() },
}));
vi.mock('../../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── Output Manager Tests (pure, no network) ─────────────────────────────────

describe('Output Manager', () => {
  it('should parse valid ComfyUI output with 2 images', () => {
    const mockOutput = {
      outputs: {
        '9': {
          images: [
            { filename: 'ComfyUI_00001_.png', subfolder: '', type: 'output' },
            { filename: 'ComfyUI_00002_.png', subfolder: '', type: 'output' },
          ],
        },
      },
    };

    const result = processOutput(mockOutput);
    expect(result.success).toBe(true);
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toContain('ComfyUI_00001_.png');
  });

  it('should fail gracefully on empty outputs', () => {
    const result = processOutput({ outputs: {} });
    expect(result.success).toBe(false);
    expect(result.images).toHaveLength(0);
  });

  it('should fail on missing outputs key', () => {
    const result = processOutput({} as any);
    expect(result.success).toBe(false);
  });
});
