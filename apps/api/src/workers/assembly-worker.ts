import { Worker, Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { videoAssemblyService } from "../services/video-assembly.service";
import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";

const subtitleQueue = new Queue("subtitle", { connection: redisConnection });

export function createAssemblyWorker() {
  return new Worker(
    "assembly",
    async (job) => {
      const { episode_id, scenes, music_url } = job.data;

      logger.info({ episode_id, scene_count: scenes.length }, "Starting video assembly");

      await job.updateProgress(10);

      // Assemble full video with FFmpeg
      const result = await videoAssemblyService.assemble({
        episode_id,
        scenes,
        music_url: music_url || "",
      });

      await job.updateProgress(80);

      // Save video URL to episode
      await supabase
        .from("episodes")
        .update({
          video_url: result.video_url,
          duration_seconds: result.duration_seconds,
          workflow_step: "subtitles",
          workflow_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", episode_id);

      // Save asset record
      await supabase.from("assets").insert({
        episode_id,
        asset_type: "video",
        file_url: result.video_url,
        file_key: result.file_key,
        mime_type: "video/mp4",
        duration_seconds: result.duration_seconds,
      });

      await job.updateProgress(90);

      // Dispatch subtitle generation job
      await subtitleQueue.add("generate-subtitles", {
        episode_id,
        video_url: result.video_url,
        scenes: scenes.map((s: any) => ({
          scene_number: s.scene_number,
          duration_seconds: s.duration_seconds,
        })),
      });

      await job.updateProgress(100);

      logger.info({ episode_id, video_url: result.video_url, duration: result.duration_seconds }, "Assembly complete");

      return {
        success: true,
        video_url: result.video_url,
        file_key: result.file_key,
        duration_seconds: result.duration_seconds,
      };
    },
    { connection: redisConnection, concurrency: 1 }
  );
}
