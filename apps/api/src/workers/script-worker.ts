import { Worker, Queue } from "bullmq";
import { WorkflowService } from "../services/workflow.service";
import { scriptWriterService } from "../services/script-writer.service";
import { redisConnection } from "../config/redis";
import { logger } from "../utils/logger";
import { supabase } from "../config/supabase";

// Queues for next steps
const imageQueue = new Queue("image", { connection: redisConnection });
const voiceQueue = new Queue("voice", { connection: redisConnection });

export function createScriptWorker() {
  return new Worker(
    "script",
    async (job) => {
      const episode = job.data;
      logger.info({ episode_id: episode.id }, "Generating script for episode");

      // Generate actual script using AI
      const script = await scriptWriterService.write({
        episode_id: episode.id,
        idea: {
          title: episode.title,
          description: episode.idea || episode.description,
          genre: episode.genre,
          target_audience: episode.target_audience,
          theme: episode.theme || episode.genre,
          tags: episode.tags || [],
        },
        scene_count: episode.scene_count || 8,
      });

      // Save scenes to database with dialogue and narration
      for (const scene of script.scenes) {
        const { error } = await supabase.from("scenes").insert({
          episode_id: episode.id,
          scene_number: scene.scene_number,
          title: scene.title,
          description: scene.description,
          visual_prompt: scene.visual_prompt,
          dialogue: scene.dialogue,
          narration: scene.narration,
          duration_seconds: scene.duration_seconds || 8,
          status: "pending",
        });

        if (error) {
          logger.error({ error, episode_id: episode.id, scene_number: scene.scene_number }, "Failed to save scene");
          throw error;
        }

        // Dispatch image job WITH dialogue/narration for voice generation
        await imageQueue.add("generate-image", {
          episode_id: episode.id,
          scene_number: scene.scene_number,
          visual_prompt: scene.visual_prompt,
          dialogue: scene.dialogue,
          narration: scene.narration,
          genre: episode.genre,
          target_audience: episode.target_audience,
        });

        logger.info({ episode_id: episode.id, scene_number: scene.scene_number }, "Dispatched image job with voice data");
      }

      // Update episode with script
      await supabase.from("episodes").update({
        script: JSON.stringify(script),
        scene_count: script.scenes.length,
      }).eq("id", episode.id);

      const approvalSteps = episode.approval_steps || [];

      if (WorkflowService.shouldPause("script", approvalSteps)) {
        episode.workflow_step = "script";
        episode.workflow_status = "waiting_approval";
        logger.info({ episode_id: episode.id }, "Script waiting approval");
        return { ...episode, script };
      }

      episode.workflow_step = WorkflowService.getNextStep("script");
      episode.workflow_status = "processing";

      logger.info({ episode_id: episode.id, scenes: script.scenes.length }, "Script generation completed");
      return { ...episode, script };
    },
    { connection: redisConnection }
  );
}