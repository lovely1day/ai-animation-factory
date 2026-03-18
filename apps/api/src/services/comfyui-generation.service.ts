/**
 * ComfyUI Image Generation Service
 * Handles image generation with approval workflow
 */

import { logger } from '../utils/logger';
import { env } from '../config/env';
import { supabase } from '../config/supabase';

const COMFYUI_URL = env.COMFYUI_URL || 'http://localhost:8190';

export interface ComfyUIWorkflow {
  [key: string]: {
    inputs: Record<string, any>;
    class_type: string;
  };
}

export interface GenerationResult {
  prompt_id: string;
  status: 'pending' | 'completed' | 'failed';
  images?: string[];
  error?: string;
}

export interface SceneGenerationRequest {
  episode_id: string;
  scene_number: number;
  visual_prompt: string;
  width?: number;
  height?: number;
  checkpoint?: string;
}

class ComfyUIGenerationService {
  /**
   * Submit a generation job to ComfyUI
   */
  async submitWorkflow(workflow: ComfyUIWorkflow): Promise<string> {
    try {
      const response = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ComfyUI error: ${error}`);
      }

      const data = await response.json() as { prompt_id: string };
      logger.info({ prompt_id: data.prompt_id }, 'Workflow submitted to ComfyUI');
      return data.prompt_id;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to submit workflow');
      throw error;
    }
  }

  /**
   * Check generation status
   */
  async checkStatus(promptId: string): Promise<GenerationResult> {
    try {
      const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.statusText}`);
      }

      const history = await response.json() as Record<string, any>;
      
      if (!history[promptId]) {
        return { prompt_id: promptId, status: 'pending' };
      }

      const promptData = history[promptId];
      
      if (promptData.status?.status_str === 'error') {
        return {
          prompt_id: promptId,
          status: 'failed',
          error: promptData.status.messages?.find((m: any) => m[0] === 'execution_error')?.[1]?.error || 'Unknown error',
        };
      }

      if (promptData.status?.completed) {
        const images: string[] = [];
        
        for (const nodeId in promptData.outputs) {
          const nodeOutput = promptData.outputs[nodeId];
          if (nodeOutput.images) {
            for (const img of nodeOutput.images) {
              const imageUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${img.type}`;
              images.push(imageUrl);
            }
          }
        }

        return {
          prompt_id: promptId,
          status: 'completed',
          images,
        };
      }

      return { prompt_id: promptId, status: 'pending' };
    } catch (error: any) {
      logger.error({ error: error.message, prompt_id: promptId }, 'Failed to check status');
      return { prompt_id: promptId, status: 'failed', error: error.message };
    }
  }

  /**
   * Create a workflow for scene image generation
   */
  createSceneWorkflow(request: SceneGenerationRequest): ComfyUIWorkflow {
    const {
      visual_prompt,
      width = 1024,
      height = 1024,
      checkpoint = 'juggernautXL_ragnarokBy.safetensors',
    } = request;

    const seed = Math.floor(Math.random() * 999999999);

    return {
      "3": {
        inputs: {
          seed,
          steps: 30,
          cfg: 7,
          sampler_name: "dpmpp_2m",
          scheduler: "karras",
          denoise: 1,
          model: ["4", 0],
          positive: ["6", 0],
          negative: ["7", 0],
          latent_image: ["5", 0],
        },
        class_type: "KSampler",
      },
      "4": {
        inputs: {
          ckpt_name: checkpoint,
        },
        class_type: "CheckpointLoaderSimple",
      },
      "5": {
        inputs: {
          width,
          height,
          batch_size: 1,
        },
        class_type: "EmptyLatentImage",
      },
      "6": {
        inputs: {
          text: `${visual_prompt}, high quality, detailed, cinematic lighting, vibrant colors, animated style`,
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "7": {
        inputs: {
          text: "blurry, bad anatomy, low quality, worst quality, normal quality, text, watermark, signature, deformed",
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "8": {
        inputs: {
          samples: ["3", 0],
          vae: ["4", 2],
        },
        class_type: "VAEDecode",
      },
      "9": {
        inputs: {
          filename_prefix: `scene_${request.scene_number}`,
          images: ["8", 0],
        },
        class_type: "SaveImage",
      },
    };
  }

  /**
   * Generate scene image with approval workflow
   */
  async generateSceneImage(request: SceneGenerationRequest): Promise<{ prompt_id: string; status: string }> {
    const workflow = this.createSceneWorkflow(request);
    const promptId = await this.submitWorkflow(workflow);
    
    // Store generation info in database
    await supabase.from('generation_jobs').insert({
      episode_id: request.episode_id,
      job_type: 'image_generation',
      status: 'pending',
      bull_job_id: promptId,
      input_data: {
        scene_number: request.scene_number,
        visual_prompt: request.visual_prompt,
        width: request.width,
        height: request.height,
      },
    });

    return { prompt_id: promptId, status: 'pending' };
  }

  /**
   * Poll for image completion and update database
   */
  async pollAndUpdateImage(promptId: string, episodeId: string, sceneNumber: number): Promise<GenerationResult> {
    const result = await this.checkStatus(promptId);
    
    if (result.status === 'completed' && result.images && result.images.length > 0) {
      // Update scene with image URL
      const { error: sceneError } = await supabase
        .from('scenes')
        .update({ 
          image_url: result.images[0],
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('episode_id', episodeId)
        .eq('scene_number', sceneNumber);

      if (sceneError) {
        logger.error({ error: sceneError }, 'Failed to update scene with image');
      }

      // Update generation job
      await supabase
        .from('generation_jobs')
        .update({
          status: 'completed',
          output_data: { images: result.images },
          completed_at: new Date().toISOString(),
        })
        .eq('bull_job_id', promptId);

      logger.info({ episode_id: episodeId, scene_number: sceneNumber }, 'Scene image generated and saved');
    } else if (result.status === 'failed') {
      await supabase
        .from('generation_jobs')
        .update({
          status: 'failed',
          error_message: result.error,
        })
        .eq('bull_job_id', promptId);
    }

    return result;
  }

  /**
   * Health check for ComfyUI
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COMFYUI_URL}/system_stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available checkpoints
   */
  async getCheckpoints(): Promise<string[]> {
    try {
      const response = await fetch(`${COMFYUI_URL}/object_info/CheckpointLoaderSimple`);
      const data: any = await response.json();
      return data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
    } catch {
      return ['juggernautXL_ragnarokBy.safetensors'];
    }
  }
}

export const comfyUIGenerationService = new ComfyUIGenerationService();
