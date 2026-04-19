import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { VideoAssemblyInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Use bundled ffmpeg-static binary if system ffmpeg is not available
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

export interface VideoAssemblyResult {
  video_url: string;
  file_key: string;
  duration_seconds: number;
}

export class VideoAssemblyService {
  async assemble(input: VideoAssemblyInput): Promise<VideoAssemblyResult> {
    logger.info({
      episode_id: input.episode_id,
      scene_count: input.scenes.length,
    }, 'Starting video assembly');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `episode-${input.episode_id}-`));

    try {
      // Download all scene clips (animations or images) — skip failures, don't kill the whole job
      const sceneFiles: string[] = [];
      for (const scene of input.scenes) {
        const sceneUrl = scene.animation_url || scene.image_url;
        if (!sceneUrl) { logger.warn({ scene: scene.scene_number }, 'Scene has no url, skipping'); continue; }

        const ext = scene.animation_url ? 'mp4' : 'png';
        const scenePath = path.join(tmpDir, `scene_${scene.scene_number}.${ext}`);

        try {
          // Retry up to 3 times for flaky Pollinations
          let response: Response | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            response = await fetch(sceneUrl);
            if (response.ok) break;
            await new Promise(r => setTimeout(r, 1500));
          }
          if (!response || !response.ok) {
            logger.warn({ scene: scene.scene_number, status: response?.status }, 'Scene download failed after retries, skipping');
            continue;
          }
          await fs.writeFile(scenePath, Buffer.from(await response.arrayBuffer()));

          if (!scene.animation_url) {
            const videoPath = path.join(tmpDir, `scene_${scene.scene_number}.mp4`);
            await this.imageToVideo(scenePath, videoPath, scene.duration_seconds);
            sceneFiles.push(videoPath);
          } else {
            sceneFiles.push(scenePath);
          }
        } catch (err: any) {
          logger.warn({ scene: scene.scene_number, error: err.message }, 'Scene processing failed, skipping');
        }
      }
      if (sceneFiles.length === 0) throw new Error('No scenes could be downloaded');

      // Download voice clips
      const voiceFiles: Array<{ path: string; start: number; duration: number }> = [];
      let timeOffset = 0;
      for (const scene of input.scenes) {
        if (scene.voice_url) {
          const voicePath = path.join(tmpDir, `voice_${scene.scene_number}.mp3`);
          const response = await fetch(scene.voice_url);
          if (response.ok) {
            await fs.writeFile(voicePath, Buffer.from(await response.arrayBuffer()));
            voiceFiles.push({ path: voicePath, start: timeOffset, duration: scene.duration_seconds });
          }
        }
        timeOffset += scene.duration_seconds;
      }

      // Create concat file for ffmpeg
      const concatFile = path.join(tmpDir, 'concat.txt');
      const concatContent = sceneFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n');
      await fs.writeFile(concatFile, concatContent);

      // Concatenate video clips
      const concatenatedVideo = path.join(tmpDir, 'concatenated.mp4');
      await this.concatenateVideos(concatFile, concatenatedVideo);

      // Download and mix background music
      let musicPath: string | undefined;
      if (input.music_url) {
        musicPath = path.join(tmpDir, 'music.mp3');
        const musicResponse = await fetch(input.music_url);
        if (musicResponse.ok) {
          await fs.writeFile(musicPath, Buffer.from(await musicResponse.arrayBuffer()));
        }
      }

      // Create combined audio (voices + music)
      const finalAudioPath = path.join(tmpDir, 'final_audio.mp3');
      const totalDuration = input.scenes.reduce((sum, s) => sum + s.duration_seconds, 0);

      if (voiceFiles.length > 0 || musicPath) {
        await this.mixAudio(voiceFiles, musicPath, finalAudioPath, totalDuration);
      }

      // Final video with audio
      const outputPath = path.join(tmpDir, 'output.mp4');
      if (voiceFiles.length > 0 || musicPath) {
        await this.mergeVideoAudio(concatenatedVideo, finalAudioPath, outputPath);
      } else {
        await fs.copyFile(concatenatedVideo, outputPath);
      }

      // Upload final video
      const fileKey = `episodes/${input.episode_id}/video.mp4`;
      const videoBuffer = await fs.readFile(outputPath);
      const uploadedUrl = await storageService.uploadBuffer(videoBuffer, fileKey, 'video/mp4');

      logger.info({
        episode_id: input.episode_id,
        duration: totalDuration,
      }, 'Video assembled and uploaded');

      return {
        video_url: uploadedUrl,
        file_key: fileKey,
        duration_seconds: totalDuration,
      };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private imageToVideo(imagePath: string, outputPath: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // FIX: loop without arg + explicit -t duration + force input format
      // Without -t, the video has only 1 frame (fraction of a second).
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop', '1', '-framerate', '24'])
        .outputOptions([
          '-t', String(duration),
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-r', '24',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private concatenateVideos(concatFile: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .videoCodec('libx264')
        .addOption('-pix_fmt', 'yuv420p')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private mixAudio(
    voiceFiles: Array<{ path: string; start: number; duration: number }>,
    musicPath: string | undefined,
    outputPath: string,
    totalDuration: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = ffmpeg();
      const filterInputs: string[] = [];
      let inputIndex = 0;

      // Add voice tracks with delays
      for (const voice of voiceFiles) {
        cmd.input(voice.path);
        filterInputs.push(
          `[${inputIndex}:a]adelay=${voice.start * 1000}|${voice.start * 1000}[v${inputIndex}]`
        );
        inputIndex++;
      }

      // Add music track (if any)
      if (musicPath) {
        cmd.input(musicPath);
        filterInputs.push(`[${inputIndex}:a]volume=0.3[music]`);
        inputIndex++;
      }

      // Mix all audio
      const voiceLabels = voiceFiles.map((_, i) => `[v${i}]`).join('');
      const musicLabel = musicPath ? '[music]' : '';
      const totalInputs = voiceFiles.length + (musicPath ? 1 : 0);

      const filterComplex = [
        ...filterInputs,
        `${voiceLabels}${musicLabel}amix=inputs=${totalInputs}:duration=longest[aout]`,
      ].join('; ');

      cmd
        .complexFilter(filterComplex)
        .outputOptions(['-map', '[aout]', '-t', String(totalDuration)])
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private mergeVideoAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(audioPath)
        .videoCodec('copy')
        .audioCodec('aac')
        .output(outputPath)
        .outputOptions(['-shortest'])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

export const videoAssemblyService = new VideoAssemblyService();
