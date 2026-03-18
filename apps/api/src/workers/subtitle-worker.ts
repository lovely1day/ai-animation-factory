import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { subtitleGenerationService } from "../services/subtitle-generation.service";
import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";

export function createSubtitleWorker() {
  return new Worker(
    "subtitle",
    async (job) => {
      const { episode_id, scenes } = job.data;

      logger.info({ episode_id }, "Starting subtitle generation");

      await job.updateProgress(10);

      // Fetch scene dialogue/narration from DB if not provided in job
      let sceneData = scenes;
      if (!sceneData || sceneData.length === 0) {
        const { data: dbScenes } = await supabase
          .from("scenes")
          .select("scene_number, dialogue, narration, duration_seconds")
          .eq("episode_id", episode_id)
          .order("scene_number");
        sceneData = dbScenes || [];
      }

      await job.updateProgress(20);

      const result = await subtitleGenerationService.generateFromScenes(episode_id, sceneData);

      await job.updateProgress(80);

      // Save subtitle URL to episode and set to final/completed
      await supabase
        .from("episodes")
        .update({
          subtitle_url: result.subtitle_url,
          workflow_step: "final",
          workflow_status: "completed",
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", episode_id);

      // Save asset record
      await supabase.from("assets").insert({
        episode_id,
        asset_type: "subtitle",
        file_url: result.subtitle_url,
        file_key: result.file_key,
        mime_type: "text/plain",
      });

      await job.updateProgress(100);

      logger.info({ episode_id, entries: result.entries.length, subtitle_url: result.subtitle_url }, "Subtitles complete");

      return {
        success: true,
        subtitle_url: result.subtitle_url,
        entries: result.entries.length,
      };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
