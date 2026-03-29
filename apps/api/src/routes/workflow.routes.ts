import { Router } from "express";
import { supabase } from "../config/supabase";
import { PipelineService } from "../services/pipeline.service";
import { approvalWorkflowService } from "../services/approval-workflow.service";
import { logger } from "../utils/logger";

const router: Router = Router();

/**
 * Approve current workflow step for an episode
 * POST /api/workflow/approve/:episodeId
 */
router.post("/approve/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { modifications, comment } = req.body;

  try {
    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, workflow_step, workflow_status")
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return res.status(404).json({ success: false, error: "Episode not found" });
    }

    if (episode.workflow_status !== "waiting_approval") {
      return res.status(400).json({
        success: false,
        error: `Episode is not waiting for approval (current status: ${episode.workflow_status})`,
      });
    }

    // Log the approval
    await supabase.from("approval_logs").insert({
      episode_id: episodeId,
      step: episode.workflow_step,
      action: "approved",
      comment: comment || null,
      created_at: new Date().toISOString(),
    });

    if (episode.workflow_step === "script") {
      await approvalWorkflowService.approveScript(episodeId, true, modifications);
    } else if (episode.workflow_step === "images") {
      await approvalWorkflowService.approveImages(episodeId, true);
    } else {
      // Generic approval: advance workflow and continue pipeline
      await supabase
        .from("episodes")
        .update({ workflow_status: "approved", updated_at: new Date().toISOString() })
        .eq("id", episodeId);
    }

    logger.info({ episode_id: episodeId, step: episode.workflow_step }, "Workflow step approved");

    return res.json({
      success: true,
      message: `Step "${episode.workflow_step}" approved`,
      episode_id: episodeId,
    });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', episode_id: episodeId }, "Approval failed");
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Reject current workflow step for an episode
 * POST /api/workflow/reject/:episodeId
 */
router.post("/reject/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { comment, regenerate_scenes } = req.body;

  try {
    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, workflow_step, workflow_status")
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return res.status(404).json({ success: false, error: "Episode not found" });
    }

    // Log the rejection
    await supabase.from("approval_logs").insert({
      episode_id: episodeId,
      step: episode.workflow_step,
      action: "rejected",
      comment: comment || null,
      requested_changes: regenerate_scenes ? { regenerate_scenes } : null,
      created_at: new Date().toISOString(),
    });

    if (episode.workflow_step === "script") {
      await approvalWorkflowService.approveScript(episodeId, false);
    } else if (episode.workflow_step === "images") {
      await approvalWorkflowService.approveImages(episodeId, false, regenerate_scenes);
    } else {
      await supabase
        .from("episodes")
        .update({
          workflow_status: "rejected",
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", episodeId);
    }

    logger.info({ episode_id: episodeId, step: episode.workflow_step }, "Workflow step rejected");

    return res.json({
      success: true,
      message: `Step "${episode.workflow_step}" rejected`,
      episode_id: episodeId,
    });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', episode_id: episodeId }, "Rejection failed");
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Start / restart the full pipeline for an episode
 * POST /api/workflow/run/:episodeId
 */
router.post("/run/:episodeId", async (req, res) => {
  const { episodeId } = req.params;

  try {
    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, title, description, genre, target_audience, approval_steps, scene_count")
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return res.status(404).json({ success: false, error: "Episode not found" });
    }

    await PipelineService.run(episode);

    logger.info({ episode_id: episodeId }, "Pipeline started via /run endpoint");

    return res.json({
      success: true,
      message: "Pipeline started",
      episode_id: episodeId,
    });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', episode_id: episodeId }, "Pipeline start failed");
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
