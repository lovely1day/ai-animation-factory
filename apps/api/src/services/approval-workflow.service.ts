/**
 * Approval Workflow Service
 * Manages episode generation with user approval checkpoints
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { comfyUIGenerationService } from './comfyui-generation.service';
import { scriptWriterService } from './script-writer.service';
import { WorkflowStep, WorkflowStatus, EpisodeScript } from '@ai-animation-factory/shared';

export interface EpisodeCreationInput {
  title: string;
  idea: string;
  genre: string;
  target_audience: string;
  created_by?: string;
  approval_steps?: WorkflowStep[];
}

export interface ScriptScene {
  scene_number: number;
  title: string;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  narration?: string;
  duration_seconds: number;
}

export interface GeneratedScript {
  title: string;
  description: string;
  genre: string;
  target_audience: string;
  scenes: ScriptScene[];
}

export interface ApprovalState {
  step: WorkflowStep;
  status: WorkflowStatus;
  data: any;
  canEdit: boolean;
}

class ApprovalWorkflowService {
  private readonly defaultApprovalSteps: WorkflowStep[] = ['script', 'images'];

  /**
   * Create new episode with approval workflow
   */
  async createEpisode(input: EpisodeCreationInput): Promise<{ episode_id: string; message: string }> {
    try {
      // Create episode record
      const { data: episode, error } = await supabase
        .from('episodes')
        .insert({
          title: input.title,
          description: input.idea,
          genre: input.genre,
          target_audience: input.target_audience,
          status: 'generating',
          workflow_step: 'idea',
          workflow_status: 'processing',
          approval_steps: input.approval_steps || this.defaultApprovalSteps,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (error || !episode) {
        throw new Error(`Failed to create episode: ${error?.message}`);
      }

      logger.info({ episode_id: episode.id }, 'Episode created with approval workflow');

      // Start script generation immediately
      await this.generateScript(episode.id, input);

      return {
        episode_id: episode.id,
        message: 'Episode created and script generation started',
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create episode');
      throw error;
    }
  }

  /**
   * Generate script for episode
   */
  async generateScript(episodeId: string, input: EpisodeCreationInput): Promise<GeneratedScript> {
    try {
      // Update status
      await this.updateWorkflowStatus(episodeId, 'script', 'processing');

      // Generate script using AI
      const script = await scriptWriterService.write({
        episode_id: episodeId,
        idea: {
          title: input.title,
          description: input.idea,
          genre: input.genre,
          target_audience: input.target_audience,
          theme: input.genre,
          tags: [],
        },
        scene_count: 8,
      });

      // Save script to episode
      await supabase
        .from('episodes')
        .update({
          script_data: script,
          workflow_status: 'waiting_approval',
          workflow_step: 'script',
          updated_at: new Date().toISOString(),
        })
        .eq('id', episodeId);

      // Save scenes
      for (const scene of script.scenes) {
        await supabase.from('scenes').insert({
          episode_id: episodeId,
          scene_number: scene.scene_number,
          title: scene.title,
          description: scene.description,
          visual_prompt: scene.visual_prompt,
          dialogue: scene.dialogue,
          narration: scene.narration,
          duration_seconds: scene.duration_seconds || 8,
          status: 'pending',
        });
      }

      logger.info({ episode_id: episodeId, scenes: script.scenes.length }, 'Script generated, waiting for approval');

      return script as GeneratedScript;
    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId }, 'Script generation failed');
      await this.updateWorkflowStatus(episodeId, 'script', 'rejected', error.message);
      throw error;
    }
  }

  /**
   * Approve or reject script
   */
  async approveScript(episodeId: string, approved: boolean, modifications?: Partial<GeneratedScript>): Promise<void> {
    try {
      if (approved) {
        // Apply modifications if any
        if (modifications) {
          await supabase
            .from('episodes')
            .update({
              script_data: modifications,
              script_approved: true,
              workflow_status: 'approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', episodeId);

          // Update scenes if modified
          if (modifications.scenes) {
            for (const scene of modifications.scenes) {
              await supabase
                .from('scenes')
                .update({
                  title: scene.title,
                  description: scene.description,
                  visual_prompt: scene.visual_prompt,
                  dialogue: scene.dialogue,
                  narration: scene.narration,
                })
                .eq('episode_id', episodeId)
                .eq('scene_number', scene.scene_number);
            }
          }
        } else {
          await supabase
            .from('episodes')
            .update({
              script_approved: true,
              workflow_status: 'approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', episodeId);
        }

        logger.info({ episode_id: episodeId }, 'Script approved');

        // Start image generation
        await this.startImageGeneration(episodeId);
      } else {
        await supabase
          .from('episodes')
          .update({
            workflow_status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', episodeId);

        logger.info({ episode_id: episodeId }, 'Script rejected');
      }
    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId }, 'Failed to process script approval');
      throw error;
    }
  }

  /**
   * Start image generation for all scenes
   */
  async startImageGeneration(episodeId: string): Promise<void> {
    try {
      await this.updateWorkflowStatus(episodeId, 'images', 'processing');

      // Get scenes
      const { data: scenes, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('episode_id', episodeId)
        .order('scene_number');

      if (error || !scenes) {
        throw new Error('Failed to fetch scenes');
      }

      // Generate images for each scene
      const generationPromises = scenes.map(async (scene) => {
        try {
          const result = await comfyUIGenerationService.generateSceneImage({
            episode_id: episodeId,
            scene_number: scene.scene_number,
            visual_prompt: scene.visual_prompt,
            width: 1024,
            height: 1024,
          });

          // Store prompt_id in scene for tracking
          await supabase
            .from('scenes')
            .update({
              metadata: { ...scene.metadata, comfyui_prompt_id: result.prompt_id },
            })
            .eq('id', scene.id);

          return result;
        } catch (err: any) {
          logger.error({ error: err.message, scene_id: scene.id }, 'Scene image generation failed');
          return null;
        }
      });

      await Promise.all(generationPromises);

      // Poll for completions
      this.pollImageGenerations(episodeId, scenes);

    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId }, 'Image generation start failed');
      await this.updateWorkflowStatus(episodeId, 'images', 'rejected', error.message);
    }
  }

  /**
   * Poll for image generation completions
   */
  private async pollImageGenerations(episodeId: string, scenes: any[]): Promise<void> {
    const pendingScenes = new Set(scenes.map(s => s.scene_number));
    const maxAttempts = 60; // 2 minutes
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      for (const scene of scenes) {
        if (!pendingScenes.has(scene.scene_number)) continue;

        const promptId = scene.metadata?.comfyui_prompt_id;
        if (!promptId) continue;

        const result = await comfyUIGenerationService.pollAndUpdateImage(
          promptId,
          episodeId,
          scene.scene_number
        );

        if (result.status === 'completed') {
          pendingScenes.delete(scene.scene_number);
        } else if (result.status === 'failed') {
          pendingScenes.delete(scene.scene_number);
        }
      }

      // Check if all done
      if (pendingScenes.size === 0 || attempts >= maxAttempts) {
        clearInterval(interval);
        
        // Move to approval state
        await supabase
          .from('episodes')
          .update({
            workflow_step: 'images',
            workflow_status: 'waiting_approval',
            images_data: { generated: true, pending_approval: true },
            updated_at: new Date().toISOString(),
          })
          .eq('id', episodeId);

        logger.info({ episode_id: episodeId }, 'All images generated, waiting for approval');
      }
    }, 2000);
  }

  /**
   * Approve or reject images
   */
  async approveImages(episodeId: string, approved: boolean, regeneratedScenes?: number[]): Promise<void> {
    try {
      if (approved) {
        await supabase
          .from('episodes')
          .update({
            images_approved: true,
            workflow_status: 'approved',
            workflow_step: 'images',
            updated_at: new Date().toISOString(),
          })
          .eq('id', episodeId);

        logger.info({ episode_id: episodeId }, 'Images approved, continuing workflow');

        // Continue to next steps (voice, music, etc.)
        await this.continueWorkflow(episodeId);
      } else if (regeneratedScenes && regeneratedScenes.length > 0) {
        // Regenerate specific scenes
        logger.info({ episode_id: episodeId, scenes: regeneratedScenes }, 'Regenerating specific scenes');
        
        for (const sceneNumber of regeneratedScenes) {
          const { data: scene } = await supabase
            .from('scenes')
            .select('*')
            .eq('episode_id', episodeId)
            .eq('scene_number', sceneNumber)
            .single();

          if (scene) {
            await comfyUIGenerationService.generateSceneImage({
              episode_id: episodeId,
              scene_number: sceneNumber,
              visual_prompt: scene.visual_prompt,
            });
          }
        }
      } else {
        await supabase
          .from('episodes')
          .update({
            workflow_status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', episodeId);
      }
    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId }, 'Failed to process images approval');
      throw error;
    }
  }

  /**
   * Modify scene prompt and regenerate
   */
  async modifyScenePrompt(episodeId: string, sceneNumber: number, newPrompt: string): Promise<void> {
    try {
      // Update scene
      await supabase
        .from('scenes')
        .update({
          visual_prompt: newPrompt,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('episode_id', episodeId)
        .eq('scene_number', sceneNumber);

      // Regenerate image
      await comfyUIGenerationService.generateSceneImage({
        episode_id: episodeId,
        scene_number: sceneNumber,
        visual_prompt: newPrompt,
      });

      logger.info({ episode_id: episodeId, scene_number: sceneNumber }, 'Scene prompt modified and regeneration started');
    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId, scene_number: sceneNumber }, 'Failed to modify scene');
      throw error;
    }
  }

  /**
   * Get episode approval state
   */
  async getApprovalState(episodeId: string): Promise<ApprovalState | null> {
    try {
      const { data: episode, error } = await supabase
        .from('episodes')
        .select('*, scenes(*)')
        .eq('id', episodeId)
        .single();

      if (error || !episode) return null;

      return {
        step: episode.workflow_step as WorkflowStep,
        status: episode.workflow_status as WorkflowStatus,
        data: {
          script: episode.script_data,
          scenes: episode.scenes,
          images_approved: episode.images_approved,
          script_approved: episode.script_approved,
        },
        canEdit: episode.workflow_status === 'waiting_approval',
      };
    } catch (error: any) {
      logger.error({ error: error.message, episode_id: episodeId }, 'Failed to get approval state');
      return null;
    }
  }

  /**
   * Continue workflow after images approved — dispatch animation, voice, music in parallel
   */
  private async continueWorkflow(episodeId: string): Promise<void> {
    logger.info({ episode_id: episodeId }, 'Workflow: continuing to animation, voice, and music');

    const { PipelineService } = await import('./pipeline.service');

    const { data: episode } = await supabase
      .from('episodes')
      .select('genre, duration_seconds')
      .eq('id', episodeId)
      .single();

    // Run animation, voice, and music in parallel
    await Promise.all([
      PipelineService.dispatchAnimations(episodeId),
      PipelineService.dispatchVoice(episodeId),
      PipelineService.dispatchMusic(
        episodeId,
        episode?.genre || 'adventure',
        episode?.duration_seconds || 60
      ),
    ]);

    await this.updateWorkflowStatus(episodeId, 'animation', 'processing');
    logger.info({ episode_id: episodeId }, 'Workflow: animation/voice/music jobs dispatched');
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(
    episodeId: string,
    step: WorkflowStep,
    status: WorkflowStatus,
    errorMessage?: string
  ): Promise<void> {
    const update: any = {
      workflow_step: step,
      workflow_status: status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      update.metadata = { error: errorMessage };
    }

    await supabase.from('episodes').update(update).eq('id', episodeId);
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
