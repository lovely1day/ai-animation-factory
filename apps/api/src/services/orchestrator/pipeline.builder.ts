/**
 * Pipeline Builder
 * Constructs pipeline configuration based on request type
 */

import type {
  PipelineRequest,
  WorkflowConfig,
  GenerationSettings,
  CharacterReference,
} from "./pipeline.types";

/**
 * Default generation settings
 */
const DEFAULT_SETTINGS: GenerationSettings = {
  steps: 30,
  cfg: 5.5,
  sampler: "dpmpp_2m",
  scheduler: "karras",
  width: 1024,
  height: 1024,
  seed: -1,
};

/**
 * Workflow configurations registry
 */
const WORKFLOW_REGISTRY: Record<string, WorkflowConfig> = {
  base: {
    name: "base_image",
    type: "base",
    workflowPath: "workflows/base/base_image.json",
    defaults: { ...DEFAULT_SETTINGS },
  },
  ipadapter: {
    name: "ipadapter_character",
    type: "ipadapter",
    workflowPath: "workflows/ipadapter/ipadapter_character.json",
    defaults: {
      ...DEFAULT_SETTINGS,
      // IPAdapter works better with slightly different settings
      cfg: 4.5,
    },
  },
};

/**
 * Build pipeline configuration from request
 */
export function buildPipelineConfig(
  request: PipelineRequest
): {
  workflow: WorkflowConfig;
  settings: GenerationSettings;
  character?: CharacterReference;
} {
  // Select workflow based on type
  const workflow = selectWorkflow(request.workflowType);

  // Merge settings (request overrides defaults)
  const settings = mergeSettings(workflow.defaults, request.settings);

  // Build character reference if provided
  const character = request.characterId
    ? buildCharacterReference(request.characterId, request)
    : undefined;

  return {
    workflow,
    settings,
    character,
  };
}

/**
 * Select appropriate workflow configuration
 */
function selectWorkflow(type: string): WorkflowConfig {
  const config = WORKFLOW_REGISTRY[type];

  if (!config) {
    throw new Error(`Unknown workflow type: ${type}`);
  }

  return config;
}

/**
 * Merge settings with defaults
 */
function mergeSettings(
  defaults: GenerationSettings,
  overrides?: Partial<GenerationSettings>
): GenerationSettings {
  if (!overrides) {
    return { ...defaults };
  }

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Build character reference (placeholder implementation)
 * In production, this would fetch from character database
 */
function buildCharacterReference(
  characterId: string,
  request: PipelineRequest
): CharacterReference {
  // Placeholder: In production, fetch from database
  return {
    id: characterId,
    name: `Character_${characterId}`,
    imagePath: `ComfyUI/input/characters/${characterId}.png`,
    description: request.sceneContext || "No description",
    consistencyWeight: 0.8,
  };
}

/**
 * Validate pipeline request
 */
export function validateRequest(
  request: PipelineRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate prompt
  if (!request.prompt || request.prompt.trim().length === 0) {
    errors.push("Prompt is required");
  }

  // Validate workflow type
  if (!["base", "ipadapter"].includes(request.workflowType)) {
    errors.push(`Invalid workflow type: ${request.workflowType}`);
  }

  // Validate character reference for ipadapter
  if (request.workflowType === "ipadapter" && !request.characterId) {
    errors.push("characterId is required for ipadapter workflow");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available workflow types
 */
export function getAvailableWorkflows(): string[] {
  return Object.keys(WORKFLOW_REGISTRY);
}

/**
 * Get workflow defaults
 */
export function getWorkflowDefaults(
  type: string
): GenerationSettings | null {
  const config = WORKFLOW_REGISTRY[type];
  return config ? { ...config.defaults } : null;
}
