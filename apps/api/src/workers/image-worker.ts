import { Worker, Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { imageGenerationService } from "../services/image-generation.service";
import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";

// Queue for voice generation
const voiceQueue = new Queue("voice", { connection: redisConnection });

export function createImageWorker() {
  return new Worker(
    "image",
    async (job) => {
      const payload = job.data;
      const { episode_id, scene_number, visual_prompt, dialogue, narration } = payload;

      logger.info({ episode_id, scene_number }, "Starting image generation");

      // Get scene ID from database
      const { data: scene, error: sceneError } = await supabase
        .from("scenes")
        .select("id")
        .eq("episode_id", episode_id)
        .eq("scene_number", scene_number)
        .single();

      if (sceneError || !scene) {
        logger.error({ error: sceneError, episode_id, scene_number }, "Scene not found");
        throw new Error("Scene not found");
      }

      // Generate image
      const result = await imageGenerationService.generate({
        episode_id,
        scene_id: scene.id,
        scene_number,
        visual_prompt,
      });

      // Update scene with image URL
      await supabase.from("scenes").update({
        image_url: result.image_url,
        status: "completed",
      }).eq("id", scene.id);

      // Save asset record
      await supabase.from("assets").insert({
        episode_id,
        scene_id: scene.id,
        asset_type: "image",
        file_url: result.image_url,
        file_key: result.file_key,
        mime_type: "image/jpeg",
        width: 1792,
        height: 1024,
      });

      logger.info({ episode_id, scene_number, image_url: result.image_url }, "Image generated");

      // CRITICAL FIX: Dispatch voice job using dialogue or narration
      const voiceText = dialogue || narration;
      if (voiceText && voiceText.trim().length > 0) {
        await voiceQueue.add("generate-voice", {
          episode_id,
          scene_id: scene.id,
          text: voiceText,
        });
        logger.info({ episode_id, scene_number, text: voiceText.slice(0, 50) }, "Dispatched voice job");
      } else {
        logger.warn({ episode_id, scene_number }, "No dialogue or narration for voice generation");
      }

      return {
        success: true,
        jobId: job.id,
        image_url: result.image_url,
      };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}