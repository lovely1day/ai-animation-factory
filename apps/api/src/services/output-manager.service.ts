/**
 * Output Manager Service
 * Extracts and normalizes image paths from ComfyUI responses
 */

import { logger } from "../utils/logger";

export interface ComfyUIOutput {
  /** Raw outputs from ComfyUI */
  outputs?: Record<string, unknown>;
  /** Any errors */
  errors?: string[];
}

export interface NormalizedOutput {
  /** Success status */
  success: boolean;
  /** Array of image file paths */
  images: string[];
  /** Metadata about the generation */
  metadata: {
    totalImages: number;
    nodeCount: number;
  };
  /** Errors if any */
  errors?: string[];
}

/**
 * Extract images from ComfyUI output format
 * ComfyUI returns: { "node_id": { "images": [{"filename": "...", "subfolder": "...", "type": "output"}] } }
 */
function extractImagesFromOutputs(
  outputs: Record<string, unknown>
): string[] {
  const images: string[] = [];

  for (const [nodeId, nodeOutput] of Object.entries(outputs)) {
    if (typeof nodeOutput !== "object" || nodeOutput === null) continue;

    const nodeData = nodeOutput as Record<string, unknown>;
    const nodeImages = nodeData.images as Array<{
      filename: string;
      subfolder?: string;
      type?: string;
    }> | undefined;

    if (!Array.isArray(nodeImages)) continue;

    for (const image of nodeImages) {
      if (image.filename) {
        // Build full path
        const parts: string[] = ["ComfyUI/output"];
        if (image.subfolder) parts.push(image.subfolder);
        parts.push(image.filename);

        const fullPath = parts.join("/");
        images.push(fullPath);

        logger.debug({ nodeId, path: fullPath }, "Extracted image");
      }
    }
  }

  return images;
}

/**
 * Validate extracted images
 */
function validateImages(images: string[]): { valid: string[]; errors: string[] } {
  const valid: string[] = [];
  const errors: string[] = [];

  const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];

  for (const image of images) {
    const lower = image.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lower.endsWith(ext));

    if (hasValidExt) {
      valid.push(image);
    } else {
      errors.push(`Invalid image format: ${image}`);
    }
  }

  return { valid, errors };
}

/**
 * Process ComfyUI output and return normalized result
 */
export function processOutput(output: ComfyUIOutput): NormalizedOutput {
  logger.debug({ hasOutputs: !!output.outputs }, "Processing output");

  // No outputs
  if (!output.outputs || Object.keys(output.outputs).length === 0) {
    logger.warn("No outputs found in ComfyUI response");
    return {
      success: false,
      images: [],
      metadata: { totalImages: 0, nodeCount: 0 },
      errors: ["No outputs found"],
    };
  }

  // Extract images
  const rawImages = extractImagesFromOutputs(output.outputs);
  const { valid, errors } = validateImages(rawImages);

  // Build result
  const result: NormalizedOutput = {
    success: valid.length > 0,
    images: valid,
    metadata: {
      totalImages: valid.length,
      nodeCount: Object.keys(output.outputs).length,
    },
  };

  // Add errors if any
  const allErrors: string[] = [];
  if (errors.length > 0) allErrors.push(...errors);
  if (output.errors && output.errors.length > 0) allErrors.push(...output.errors);

  if (allErrors.length > 0) {
    result.errors = allErrors;
  }

  logger.info(
    { totalImages: valid.length, errors: allErrors.length },
    "Output processed"
  );

  return result;
}

/**
 * Process raw ComfyUI history response
 */
export function processHistoryResponse(
  historyData: Record<string, unknown>,
  promptId: string
): NormalizedOutput {
  const jobData = historyData[promptId] as Record<string, unknown> | undefined;

  if (!jobData) {
    return {
      success: false,
      images: [],
      metadata: { totalImages: 0, nodeCount: 0 },
      errors: ["Job not found in history"],
    };
  }

  return processOutput({
    outputs: jobData.outputs as Record<string, unknown>,
  });
}

/**
 * Get image URL for frontend
 */
export function getImageUrl(imagePath: string): string {
  // Convert filesystem path to URL
  // e.g., "ComfyUI/output/sequences/image.png" → "/api/images/sequences/image.png"
  const normalized = imagePath.replace(/^ComfyUI\/output\//, "/");
  return `/api/images${normalized}`;
}

/**
 * Batch process multiple outputs
 */
export function batchProcess(outputs: ComfyUIOutput[]): NormalizedOutput {
  const allImages: string[] = [];
  const allErrors: string[] = [];
  let totalNodeCount = 0;

  for (const output of outputs) {
    const result = processOutput(output);
    allImages.push(...result.images);
    if (result.errors) allErrors.push(...result.errors);
    totalNodeCount += result.metadata.nodeCount;
  }

  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];

  return {
    success: uniqueImages.length > 0,
    images: uniqueImages,
    metadata: {
      totalImages: uniqueImages.length,
      nodeCount: totalNodeCount,
    },
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

export default {
  processOutput,
  processHistoryResponse,
  getImageUrl,
  batchProcess,
};
