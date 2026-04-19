import { Worker, Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { animationService } from "../services/animation.service";
import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";

const assemblyQueue = new Queue("assembly", { connection: redisConnection });

export function createAnimationWorker() {
  return new Worker(
    "animation",
    async (job) => {
      const { episode_id, scene_id, scene_number, image_url, prompt, duration_seconds } = job.data;

      logger.info({ episode_id, scene_number }, "Starting animation generation");

      await job.updateProgress(10);

      // Generate animation via Runway (or fallback to image)
      const result = await animationService.generate({
        episode_id,
        scene_id,
        image_url,
        prompt: prompt || `Cinematic animation of scene ${scene_number}`,
        duration: duration_seconds || 8,
      });

      await job.updateProgress(80);

      // Save animation URL to scene (null if no real animation — assembly will use image)
      const realAnimUrl = result.animation_url && result.animation_url.length > 5 ? result.animation_url : null;
      await supabase
        .from("scenes")
        .update({
          animation_url: realAnimUrl,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", scene_id);

      // Save asset record only if real animation
      if (realAnimUrl) {
        await supabase.from("assets").insert({
          episode_id,
          scene_id,
          asset_type: "animation",
          file_url: realAnimUrl,
          file_key: result.file_key,
          mime_type: "video/mp4",
        });
      }

      await job.updateProgress(90);

      // Check if ALL scenes for this episode are animated
      const { data: scenes } = await supabase
        .from("scenes")
        .select("id, scene_number, status, animation_url, image_url, voice_url, duration_seconds")
        .eq("episode_id", episode_id);

      const allAnimated = scenes?.every((s) => s.status === "completed" || s.animation_url || s.image_url);

      if (allAnimated && scenes && scenes.length > 0) {
        // Get episode music + check if assembly already done/dispatched
        const { data: episode } = await supabase
          .from("episodes")
          .select("music_url, thumbnail_url, genre, title, video_url")
          .eq("id", episode_id)
          .single();

        // IDEMPOTENCY: skip if video already exists
        if (episode?.video_url) {
          logger.info({ episode_id }, "Assembly skipped — video_url already exists");
          await job.updateProgress(100);
          return { success: true, animation_url: result.animation_url, file_key: result.file_key };
        }

        logger.info({ episode_id, scene_count: scenes.length }, "All scenes animated — dispatching assembly");

        // DEDUPLICATION: jobId = episode_id → BullMQ rejects duplicates
        await assemblyQueue.add(
          "assemble-episode",
          {
            episode_id,
            scenes: scenes.map((s) => ({
              scene_id: s.id,
              scene_number: s.scene_number,
              animation_url: s.animation_url,
              image_url: s.image_url,
              voice_url: s.voice_url,
              duration_seconds: s.duration_seconds || 8,
            })),
            music_url: episode?.music_url || "",
            thumbnail_url: episode?.thumbnail_url || "",
          },
          { jobId: `assemble-${episode_id}` }
        );

        // Update episode workflow step
        await supabase
          .from("episodes")
          .update({
            workflow_step: "assembly",
            workflow_status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", episode_id);
      }

      await job.updateProgress(100);

      logger.info({ episode_id, scene_number, animation_url: result.animation_url }, "Animation complete");

      return { success: true, animation_url: result.animation_url, file_key: result.file_key };
    },
    { connection: redisConnection, concurrency: 2 }
  );
}
