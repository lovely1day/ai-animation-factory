import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { logger } from '../utils/logger';
import { storageService } from './storage.service';

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * subtitle-burn.service.ts
 *
 * خدمة اختيارية لحرق ترجمة عربية (SRT) داخل الفيديو بخطوط احترافية.
 * - لا تُستدعى تلقائياً من البايبلاين الحالي.
 * - تستخدمها فقط حين تقرر إصدار فيديو مع ترجمة محروقة (مثلاً TikTok/Reels).
 * - الخطوط تُنزّل عبر `apps/api/scripts/download-arabic-fonts.mjs`.
 *
 * الاستخدام:
 *   import { subtitleBurnService, AR_FONT_PRESETS } from './subtitle-burn.service';
 *   const url = await subtitleBurnService.burn({
 *     videoUrl: '...',
 *     srtUrl: '...',
 *     episodeId: '...',
 *     fontPreset: 'cairo',
 *     fontSize: 28,
 *   });
 */

// ─── Font Registry ──────────────────────────────────────────────────────────

export type FontPresetId = 'cairo' | 'tajawal' | 'amiri' | 'ibm-arabic';

export interface FontPreset {
  id: FontPresetId;
  nameAr: string;
  nameEn: string;
  regularFile: string;
  boldFile: string;
  fontName: string;
  recommendedFor: string;
}

export const AR_FONT_PRESETS: Record<FontPresetId, FontPreset> = {
  cairo: {
    id: 'cairo',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    regularFile: 'Cairo-Regular.ttf',
    boldFile: 'Cairo-Bold.ttf',
    fontName: 'Cairo',
    recommendedFor: 'الخيار الافتراضي — عصري ومقروء لكل أنواع المحتوى',
  },
  tajawal: {
    id: 'tajawal',
    nameAr: 'تجوال',
    nameEn: 'Tajawal',
    regularFile: 'Tajawal-Regular.ttf',
    boldFile: 'Tajawal-Bold.ttf',
    fontName: 'Tajawal',
    recommendedFor: 'محتوى تسويقي وإعلانات',
  },
  amiri: {
    id: 'amiri',
    nameAr: 'أميري',
    nameEn: 'Amiri',
    regularFile: 'Amiri-Regular.ttf',
    boldFile: 'Amiri-Bold.ttf',
    fontName: 'Amiri',
    recommendedFor: 'محتوى ديني/كلاسيكي — خط نسخي تقليدي',
  },
  'ibm-arabic': {
    id: 'ibm-arabic',
    nameAr: 'IBM Plex عربي',
    nameEn: 'IBM Plex Sans Arabic',
    regularFile: 'IBMPlexSansArabic-Regular.ttf',
    boldFile: 'IBMPlexSansArabic-Medium.ttf',
    fontName: 'IBM Plex Sans Arabic',
    recommendedFor: 'محتوى تعليمي/تقني',
  },
};

export function listFontPresets(): FontPreset[] {
  return Object.values(AR_FONT_PRESETS);
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface BurnSubtitlesInput {
  videoUrl: string;
  srtUrl: string;
  episodeId: string;
  fontPreset?: FontPresetId;       // default: 'cairo'
  fontSize?: number;               // default: 28
  primaryColor?: string;           // ASS &HBBGGRR& (default: white)
  outlineColor?: string;           // default: black
  marginV?: number;                // vertical margin (default: 40)
  bold?: boolean;                  // default: true for readability
}

export interface BurnSubtitlesResult {
  burned_video_url: string;
  file_key: string;
}

class SubtitleBurnService {
  private fontsDir = path.resolve(__dirname, '..', '..', 'assets', 'fonts');

  async burn(input: BurnSubtitlesInput): Promise<BurnSubtitlesResult> {
    const preset = AR_FONT_PRESETS[input.fontPreset || 'cairo'];
    const fontFile = input.bold === false ? preset.regularFile : preset.boldFile;

    await this.assertFontPresent(fontFile);

    logger.info(
      { episode_id: input.episodeId, preset: preset.id, font: preset.fontName },
      'Starting subtitle burn'
    );

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `burn-${input.episodeId}-`));

    try {
      const videoPath = path.join(tmpDir, 'input.mp4');
      const srtPath = path.join(tmpDir, 'subs.srt');
      const outputPath = path.join(tmpDir, 'burned.mp4');

      // Download video + srt
      await this.downloadTo(input.videoUrl, videoPath);
      await this.downloadTo(input.srtUrl, srtPath);

      // Build ASS force_style
      const fontSize = input.fontSize ?? 28;
      const primary = input.primaryColor ?? '&H00FFFFFF';
      const outline = input.outlineColor ?? '&H00000000';
      const marginV = input.marginV ?? 40;
      const boldFlag = input.bold === false ? 0 : 1;

      const style = [
        `FontName=${preset.fontName}`,
        `FontSize=${fontSize}`,
        `PrimaryColour=${primary}`,
        `OutlineColour=${outline}`,
        `BorderStyle=1`,
        `Outline=2`,
        `Shadow=0`,
        `Bold=${boldFlag}`,
        `Alignment=2`,
        `MarginV=${marginV}`,
      ].join(',');

      // FFmpeg subtitles filter needs forward slashes + escaped colons on Windows
      const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      const escapedFontsDir = this.fontsDir.replace(/\\/g, '/').replace(/:/g, '\\:');
      const filter = `subtitles='${escapedSrt}':fontsdir='${escapedFontsDir}':force_style='${style}'`;

      await this.runFfmpeg(videoPath, outputPath, filter);

      const fileKey = `episodes/${input.episodeId}/video-burned.mp4`;
      const buffer = await fs.readFile(outputPath);
      const url = await storageService.uploadBuffer(buffer, fileKey, 'video/mp4');

      logger.info(
        { episode_id: input.episodeId, burned_url: url },
        'Subtitle burn complete'
      );

      return { burned_video_url: url, file_key: fileKey };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private async assertFontPresent(fontFile: string): Promise<void> {
    const fontPath = path.join(this.fontsDir, fontFile);
    try {
      await fs.access(fontPath);
    } catch {
      throw new Error(
        `Font missing: ${fontFile}. Run: node apps/api/scripts/download-arabic-fonts.mjs`
      );
    }
  }

  private async downloadTo(url: string, target: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
    await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
  }

  private runFfmpeg(input: string, output: string, videoFilter: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .videoFilters(videoFilter)
        .outputOptions(['-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20'])
        .output(output)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

export const subtitleBurnService = new SubtitleBurnService();
