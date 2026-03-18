/**
 * Pipeline Types
 * Central type definitions for the AI generation orchestrator
 */

/**
 * High-level request for the generation pipeline
 */
export interface PipelineRequest {
  /** Main generation prompt */
  prompt: string;
  
  /** Optional character ID for consistency */
  characterId?: string;
  
  /** Type of workflow to use */
  workflowType: "base" | "ipadapter";
  
  /** Optional scene context */
  sceneContext?: string;
  
  /** Generation settings override */
  settings?: Partial<GenerationSettings>;
}

/**
 * Generation settings configuration
 */
export interface GenerationSettings {
  /** Number of sampling steps */
  steps: number;
  
  /** CFG scale (guidance) */
  cfg: number;
  
  /** Sampler name */
  sampler: string;
  
  /** Scheduler name */
  scheduler: string;
  
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** Random seed (-1 for random) */
  seed: number;
}

/**
 * Character reference data
 */
export interface CharacterReference {
  /** Unique character identifier */
  id: string;
  
  /** Character name */
  name: string;
  
  /** Path to reference image */
  imagePath: string;
  
  /** Character description/traits */
  description?: string;
  
  /** IPAdapter weight for consistency */
  consistencyWeight?: number;
}

/**
 * Final pipeline result
 */
export interface PipelineResult {
  /** Success status */
  success: boolean;
  
  /** Generated image paths */
  images: string[];
  
  /** Generation metadata */
  metadata: GenerationMetadata;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Workflow type used */
  workflowType: string;
  
  /** Character used (if any) */
  characterId?: string;
  
  /** Generation timestamp */
  timestamp: string;
  
  /** Execution time in ms */
  duration: number;
  
  /** Settings applied */
  settings: GenerationSettings;
  
  /** Prompt used */
  prompt: string;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;
  
  /** Workflow type */
  type: "base" | "ipadapter";
  
  /** Path to workflow JSON */
  workflowPath: string;
  
  /** Default settings */
  defaults: GenerationSettings;
}

/**
 * Pipeline stage status
 */
export interface PipelineStage {
  /** Stage name */
  name: string;
  
  /** Stage status */
  status: "pending" | "running" | "completed" | "failed";
  
  /** Stage result data */
  data?: unknown;
  
  /** Error if failed */
  error?: string;
}
