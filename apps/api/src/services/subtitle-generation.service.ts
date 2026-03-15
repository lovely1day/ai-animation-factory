import { SubtitleGenerationInput } from '@ai-animation-factory/shared';
import { openai } from '../config/openai';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

export interface SubtitleGenerationResult {
  subtitle_url: string;
  file_key: string;
  transcript: string;
}

export class SubtitleGenerationService {
  async generate(input: SubtitleGenerationInput): Promise<SubtitleGenerationResult> {
    logger.info({ episode_id: input.episode_id }, 'Generating subtitles');

    // Download video to temp file
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subtitles-'));
    const tmpVideoPath = path.join(tmpDir, 'video.mp4');
    const tmpAudioPath = path.join(tmpDir, 'audio.mp3');

    try {
      // Download video
      const videoResponse = await fetch(input.video_url);
      if (!videoResponse.ok) throw new Error('Failed to download video for subtitle generation');
      await fs.writeFile(tmpVideoPath, Buffer.from(await videoResponse.arrayBuffer()));

      // Extract audio using ffmpeg
      await this.extractAudio(tmpVideoPath, tmpAudioPath);

      // Transcribe with Whisper
      const audioFile = await fs.readFile(tmpAudioPath);
      const audioBlob = new File([audioFile], 'audio.mp3', { type: 'audio/mpeg' });

      const transcription = await openai.audio.transcriptions.create({
        file: audioBlob,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Convert to SRT format
      const srt = this.toSRT(transcription.segments || []);

      // Upload SRT file
      const fileKey = `episodes/${input.episode_id}/subtitles.srt`;
      const uploadedUrl = await storageService.uploadBuffer(
        Buffer.from(srt, 'utf-8'),
        fileKey,
        'text/plain'
      );

      logger.info({ episode_id: input.episode_id }, 'Subtitles generated');

      return {
        subtitle_url: uploadedUrl,
        file_key: fileKey,
        transcript: transcription.text,
      };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private extractAudio(videoPath: string, audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(audioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  private toSRT(segments: Array<{ start: number; end: number; text: string }>): string {
    return segments
      .map((seg, i) => {
        const start = this.formatTime(seg.start);
        const end = this.formatTime(seg.end);
        return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
      })
      .join('\n');
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
}

export const subtitleGenerationService = new SubtitleGenerationService();
