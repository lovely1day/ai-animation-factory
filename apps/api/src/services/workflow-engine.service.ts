/**
 * Workflow Engine Service
 * Loads workflow JSON and sends requests to ComfyUI API
 */

import { logger } from "../utils/logger";

const COMFYUI_URL = process.env.COMFYUI_URL || "http://localhost:8188";

export interface WorkflowRequest {
  /** Main generation prompt */
  prompt: string;
  /** Type of workflow to use */
  workflowType: "base" | "ipadapter";
  /** Optional negative prompt */
  negativePrompt?: string;
  /** Optional generation settings */
  settings?: {
    steps?: number;
    cfg?: number;
    width?: number;
    height?: number;
    seed?: number;
  };
}

export interface WorkflowResponse {
  /** ComfyUI prompt/job ID */
  promptId: string;
  /** Job number */
  number: number;
  /** Node errors if any */
  nodeErrors?: Record<string, unknown>;
}

/**
 * Load workflow JSON from filesystem
 */
async function loadWorkflow(workflowType: string): Promise<Record<string, unknown>> {
  const workflowPath = `workflows/${workflowType}/${workflowType === "base" ? "base_image" : "ipadapter_character"}.json`;

  try {
    // Dynamic import for JSON
    const workflow = await import(`../../${workflowPath}`);
    logger.debug({ workflowType, path: workflowPath }, "Workflow loaded");
    return workflow.default || workflow;
  } catch (error: any) {
    logger.error({ error: error.message, workflowType }, "Failed to load workflow");
    throw new Error(`Workflow not found: ${workflowType}`);
  }
}

/**
 * Inject prompt into workflow
 * Auto-detects CLIPTextEncode nodes and injects prompts
 * Supports BOTH workflow structures:
 *   1. Direct nodes: workflow["12"]
 *   2. Nested nodes: workflow.nodes["12"]
 */
function injectPrompt(
  workflow: Record<string, unknown>,
  prompt: string,
  negativePrompt: string = "blurry, low quality"
): Record<string, unknown> {
  // Deep clone to avoid mutation
  const modified = JSON.parse(JSON.stringify(workflow));

  // Detect workflow structure
  // Structure 1: workflow.nodes["12"] (nested)
  // Structure 2: workflow["12"] (direct)
  const hasNodesKey = modified.nodes && typeof modified.nodes === "object";
  const nodes = hasNodesKey ? modified.nodes : modified;

  console.log("Workflow structure:", Object.keys(modified));
  console.log("Using structure:", hasNodesKey ? "workflow.nodes" : "direct workflow");

  let positiveInjected = false;
  let negativeInjected = false;

  // Iterate through all nodes
  Object.entries(nodes).forEach(([nodeId, node]: [string, any]) => {
    // Skip non-node entries (version, last_node_id, etc.)
    if (!node || typeof node !== "object" || !node.class_type) {
      return;
    }

    // Detect CLIPTextEncode nodes
    if (node.class_type === "CLIPTextEncode") {
      // Ensure inputs exists
      if (!node.inputs) {
        return;
      }

      // Check if this looks like a positive prompt node
      // (first CLIPTextEncode encountered is typically positive)
      if (
        typeof node.inputs.text === "string" &&
        !positiveInjected &&
        !node.inputs.text.includes("negative") &&
        !node.inputs.text.includes("bad") &&
        !node.inputs.text.includes("worst")
      ) {
        node.inputs.text = prompt;
        positiveInjected = true;
        logger.debug({ nodeId, prompt }, "Injected positive prompt");
        console.log("✅ Prompt injected:", prompt);
        return;
      }

      // Check if this looks like a negative prompt node
      if (
        typeof node.inputs.text === "string" &&
        !negativeInjected &&
        (node.inputs.text.includes("negative") ||
          node.inputs.text.includes("bad") ||
          node.inputs.text.includes("worst") ||
          node.inputs.text.includes("low quality"))
      ) {
        node.inputs.text = negativePrompt;
        negativeInjected = true;
        logger.debug({ nodeId, negativePrompt }, "Injected negative prompt");
        return;
      }
    }
  });

  // If no positive prompt was injected, try a second pass (any CLIPTextEncode with text field)
  if (!positiveInjected) {
    Object.entries(nodes).forEach(([nodeId, node]: [string, any]) => {
      if (!node || typeof node !== "object" || !node.class_type) return;

      if (node.class_type === "CLIPTextEncode" && node.inputs && typeof node.inputs.text === "string") {
        if (!positiveInjected) {
          node.inputs.text = prompt;
          positiveInjected = true;
          logger.debug({ nodeId, prompt }, "Injected positive prompt (fallback)");
          console.log("✅ Prompt injected (fallback):", prompt);
        }
      }
    });
  }

  // Error if still no injection
  if (!positiveInjected) {
    throw new Error(
      "No CLIPTextEncode node found for prompt injection. " +
      "Workflow must contain at least one CLIPTextEncode node."
    );
  }

  // Debug: log the modified nodes
  console.log("Workflow after prompt injection:");
  console.log(JSON.stringify(nodes, null, 2).substring(0, 2000));

  return modified;
}

/**
 * Apply generation settings to workflow
 */
function applySettings(
  workflow: Record<string, unknown>,
  settings: WorkflowRequest["settings"]
): Record<string, unknown> {
  if (!settings) return workflow;

  const modified = JSON.parse(JSON.stringify(workflow));

  for (const [nodeId, node] of Object.entries(modified)) {
    if (typeof node !== "object" || node === null) continue;

    const nodeData = node as Record<string, unknown>;

    // KSampler node
    if (nodeData.class_type === "KSampler") {
      const inputs = nodeData.inputs as Record<string, unknown>;
      if (settings.steps !== undefined) inputs.steps = settings.steps;
      if (settings.cfg !== undefined) inputs.cfg = settings.cfg;
      if (settings.seed !== undefined) inputs.seed = settings.seed;
    }

    // EmptyLatentImage node
    if (nodeData.class_type === "EmptyLatentImage") {
      const inputs = nodeData.inputs as Record<string, unknown>;
      if (settings.width !== undefined) inputs.width = settings.width;
      if (settings.height !== undefined) inputs.height = settings.height;
    }
  }

  return modified;
}

/**
 * Send workflow to ComfyUI
 */
async function sendToComfyUI(workflow: Record<string, unknown>): Promise<WorkflowResponse> {
  const url = `${COMFYUI_URL}/prompt`;

  logger.debug({ url }, "Sending request to ComfyUI");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, error: errorText }, "ComfyUI request failed");
    throw new Error(`ComfyUI error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as WorkflowResponse;
  logger.info({ promptId: data.promptId }, "Workflow submitted to ComfyUI");

  return data;
}

/**
 * Execute workflow
 * Main entry point
 */
export async function executeWorkflow(
  request: WorkflowRequest
): Promise<WorkflowResponse> {
  logger.info(
    { workflowType: request.workflowType, promptLength: request.prompt.length },
    "Executing workflow"
  );

  try {
    // 1. Load workflow
    const workflow = await loadWorkflow(request.workflowType);

    // 2. Inject prompts
    const withPrompts = injectPrompt(
      workflow,
      request.prompt,
      request.negativePrompt
    );

    // 3. Apply settings
    const finalWorkflow = applySettings(withPrompts, request.settings);

    // 4. Send to ComfyUI
    const result = await sendToComfyUI(finalWorkflow);

    return result;
  } catch (error: any) {
    logger.error({ error: error.message }, "Workflow execution failed");
    throw error;
  }
}

/**
 * Check workflow status
 */
export async function checkWorkflowStatus(
  promptId: string
): Promise<{
  status: "pending" | "running" | "completed" | "failed";
  outputs?: Record<string, unknown>;
  error?: string;
}> {
  const url = `${COMFYUI_URL}/history/${promptId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const history = (await response.json()) as Record<string, unknown>;
    const jobData = history[promptId] as Record<string, unknown> | undefined;

    if (!jobData) {
      return { status: "pending" };
    }

    const status = jobData.status as Record<string, unknown> | undefined;

    if (status?.status_str === "error") {
      return {
        status: "failed",
        error: "Execution error occurred",
      };
    }

    if (status?.completed) {
      return {
        status: "completed",
        outputs: jobData.outputs as Record<string, unknown>,
      };
    }

    return { status: "running" };
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to check workflow status");
    return { status: "failed", error: error.message };
  }
}

export default {
  executeWorkflow,
  checkWorkflowStatus,
};
