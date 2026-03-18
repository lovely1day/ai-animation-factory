import { storageService } from "./storage.service";
import { logger } from "../utils/logger";

export interface SubtitleEntry {
  index: number;
  start: number;   // seconds
  end: number;     // seconds
  text: string;
}

export interface SubtitleResult {
  subtitle_url: string;
  file_key: string;
  entries: SubtitleEntry[];
}

function secondsToSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function buildSrt(entries: SubtitleEntry[]): string {
  return entries
    .map((e) => `${e.index}\n${secondsToSrtTime(e.start)} --> ${secondsToSrtTime(e.end)}\n${e.text}`)
    .join("\n\n");
}

function buildVtt(entries: SubtitleEntry[]): string {
  const body = entries
    .map((e) => `${secondsToSrtTime(e.start).replace(",", ".")} --> ${secondsToSrtTime(e.end).replace(",", ".")}\n${e.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

class SubtitleGenerationService {
  /**
   * Generate subtitles from scene dialogue/narration data.
   * Each scene contributes one subtitle entry timed to its duration.
   */
  async generateFromScenes(
    episodeId: string,
    scenes: Array<{ scene_number: number; dialogue?: string; narration?: string; duration_seconds: number }>
  ): Promise<SubtitleResult> {
    logger.info({ episode_id: episodeId, scene_count: scenes.length }, "Generating subtitles from scenes");

    const entries: SubtitleEntry[] = [];
    let timeOffset = 0;

    const sortedScenes = [...scenes].sort((a, b) => a.scene_number - b.scene_number);

    for (const scene of sortedScenes) {
      const text = scene.dialogue || scene.narration || "";
      const duration = scene.duration_seconds || 8;

      if (text.trim()) {
        // Split long text into ~5-second chunks
        const words = text.trim().split(" ");
        const wordsPerChunk = Math.max(1, Math.round(words.length * 5 / duration));
        const chunks: string[] = [];

        for (let i = 0; i < words.length; i += wordsPerChunk) {
          chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
        }

        const chunkDuration = duration / chunks.length;

        chunks.forEach((chunk, idx) => {
          const start = timeOffset + idx * chunkDuration;
          const end = start + chunkDuration - 0.1;
          entries.push({
            index: entries.length + 1,
            start,
            end,
            text: chunk,
          });
        });
      }

      timeOffset += duration;
    }

    // Build SRT content
    const srtContent = buildSrt(entries);
    const vttContent = buildVtt(entries);

    // Upload SRT
    const srtKey = `episodes/${episodeId}/subtitles.srt`;
    const srtBuffer = Buffer.from(srtContent, "utf-8");
    const srtUrl = await storageService.uploadBuffer(srtBuffer, srtKey, "text/plain");

    // Upload VTT (for browser players)
    const vttKey = `episodes/${episodeId}/subtitles.vtt`;
    const vttBuffer = Buffer.from(vttContent, "utf-8");
    await storageService.uploadBuffer(vttBuffer, vttKey, "text/vtt");

    logger.info({ episode_id: episodeId, entries: entries.length }, "Subtitles generated and uploaded");

    return {
      subtitle_url: srtUrl,
      file_key: srtKey,
      entries,
    };
  }

  /**
   * Generate a simple SRT from plain text with approximate timing.
   */
  async generateFromText(
    episodeId: string,
    text: string,
    totalDurationSeconds: number
  ): Promise<SubtitleResult> {
    const words = text.trim().split(/\s+/);
    const wordsPerSecond = words.length / totalDurationSeconds;
    const chunkSize = Math.max(5, Math.round(wordsPerSecond * 5)); // ~5s per entry

    const entries: SubtitleEntry[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      const start = (i / words.length) * totalDurationSeconds;
      const end = Math.min(((i + chunkSize) / words.length) * totalDurationSeconds, totalDurationSeconds);
      entries.push({ index: entries.length + 1, start, end, text: chunk });
    }

    const srtContent = buildSrt(entries);
    const srtKey = `episodes/${episodeId}/subtitles.srt`;
    const srtUrl = await storageService.uploadBuffer(Buffer.from(srtContent, "utf-8"), srtKey, "text/plain");

    return { subtitle_url: srtUrl, file_key: srtKey, entries };
  }
}

export const subtitleGenerationService = new SubtitleGenerationService();
// Keep backward-compatible alias
export const subtitleService = subtitleGenerationService;
