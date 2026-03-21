/**
 * ComfyUI Integration Service
 * Handles communication with ComfyUI API for image generation
 */

import { logger } from '../utils/logger';
import { env } from '../config/env';

const COMFYUI_URL = env.COMFYUI_URL;

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

class ComfyUIService {
  /**
   * Submit a generation job to ComfyUI
   */
  async submitWorkflow(workflow: ComfyUIWorkflow): Promise<string> {
    try {
      const response = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      // Check if the prompt exists in history
      if (!history[promptId]) {
        return { prompt_id: promptId, status: 'pending' };
      }

      const promptData = history[promptId];
      
      // Check for errors
      if (promptData.status?.status_str === 'error') {
        return {
          prompt_id: promptId,
          status: 'failed',
          error: promptData.status.messages?.find((m: any) => m[0] === 'execution_error')?.[1]?.error || 'Unknown error',
        };
      }

      // Check if completed
      if (promptData.status?.completed) {
        // Extract output images
        const images: string[] = [];
        
        for (const nodeId in promptData.outputs) {
          const nodeOutput = promptData.outputs[nodeId];
          if (nodeOutput.images) {
            for (const img of nodeOutput.images) {
              images.push(`${COMFYUI_URL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${img.type}`);
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
   * Create a workflow for text-to-image generation
   */
  createTextToImageWorkflow(prompt: string, options: {
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    negativePrompt?: string;
  } = {}): ComfyUIWorkflow {
    const {
      width = 1024,
      height = 1024,
      steps = 25,
      cfg = 7.5,
      seed = Math.floor(Math.random() * 999999999),
      negativePrompt = "blurry, bad anatomy, low quality, worst quality, normal quality, text, watermark, signature",
    } = options;

    return {
      "3": {
        inputs: {
          seed,
          steps,
          cfg,
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
          ckpt_name: "juggernautXL_ragnarokBy.safetensors",
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
          text: prompt,
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "7": {
        inputs: {
          text: negativePrompt,
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
          filename_prefix: "ai_factory",
          images: ["8", 0],
        },
        class_type: "SaveImage",
      },
    };
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
}

export const comfyUIService = new ComfyUIService();
