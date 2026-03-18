/**
 * Orchestrator Service
 * Central orchestration layer for AI generation pipeline
 * Coordinates workflow execution without direct ComfyUI integration
 */

import { logger } from "../../utils/logger";
import type {
  PipelineRequest,
  PipelineResult,
  GenerationMetadata,
  PipelineStage,
} from "./pipeline.types";
import {
  buildPipelineConfig,
  validateRequest,
} from "./pipeline.builder";

/**
 * Orchestrator service class
 */
export class OrchestratorService {
  private stages: PipelineStage[] = [];

  /**
   * Execute generation pipeline
   * Main entry point for orchestration
   */
  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const startTime = Date.now();
    this.stages = [];

    try {
      logger.info(
        { workflowType: request.workflowType, hasCharacter: !!request.characterId },
        "Starting pipeline orchestration"
      );

      // Stage 1: Validate request
      await this.runStage("validation", () => this.validate(request));

      // Stage 2: Build pipeline configuration
      const config = await this.runStage("build", () =>
        buildPipelineConfig(request)
      );

      // Stage 3: Execute workflow via workflow-engine
      // NOTE: This calls the existing workflow-engine service
      const workflowResult = await this.runStage("execute", () =>
        this.callWorkflowEngine({
          workflowPath: config.workflow.workflowPath,
          prompt: request.prompt,
          settings: config.settings,
          character: config.character,
        })
      );

      // Stage 4: Process and store output
      const outputResult = await this.runStage("output", () =>
        this.processOutput(workflowResult)
      );

      // Build success response
      const duration = Date.now() - startTime;
      const metadata: GenerationMetadata = {
        workflowType: request.workflowType,
        characterId: request.characterId,
        timestamp: new Date().toISOString(),
        duration,
        settings: config.settings,
        prompt: request.prompt,
      };

      logger.info(
        { duration, imagesCount: outputResult.images.length },
        "Pipeline completed successfully"
      );

      return {
        success: true,
        images: outputResult.images,
        metadata,
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, stages: this.stages },
        "Pipeline failed"
      );

      return {
        success: false,
        images: [],
        metadata: {
          workflowType: request.workflowType,
          characterId: request.characterId,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          settings: DEFAULT_SETTINGS,
          prompt: request.prompt,
        },
        error: error.message,
      };
    }
  }

  /**
   * Validate incoming request
   */
  private validate(request: PipelineRequest): void {
    const validation = validateRequest(request);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    logger.debug("Request validated successfully");
  }

  /**
   * Call workflow-engine service
   * This delegates to the existing workflow-engine, NOT directly to ComfyUI
   */
  private async callWorkflowEngine(params: {
    workflowPath: string;
    prompt: string;
    settings: unknown;
    character?: unknown;
  }): Promise<{ images: string[]; jobId: string }> {
    logger.debug(
      { workflowPath: params.workflowPath },
      "Calling workflow-engine"
    );

    // PLACEHOLDER: In production, this calls workflow-engine.service.ts
    // For now, return mock response
    // TODO: Import and call actual workflow-engine when available

    // Simulate async work
    await this.delay(100);

    return {
      images: [`ComfyUI/output/sequences/mock_${Date.now()}.png`],
      jobId: `job_${Date.now()}`,
    };
  }

  /**
   * Process and store output
   */
  private async processOutput(result: {
    images: string[];
    jobId: string;
  }): Promise<{ images: string[] }> {
    logger.debug({ jobId: result.jobId }, "Processing output");

    // PLACEHOLDER: In production, this would:
    // - Move files to final location
    // - Generate thumbnails
    // - Update database
    // - Notify web layer

    await this.delay(50);

    return {
      images: result.images,
    };
  }

  /**
   * Run a pipeline stage with tracking
   */
  private async runStage<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const stage: PipelineStage = {
      name,
      status: "running",
    };

    this.stages.push(stage);
    logger.debug({ stage: name }, "Stage started");

    try {
      const result = await fn();
      stage.status = "completed";
      stage.data = result;
      logger.debug({ stage: name }, "Stage completed");
      return result;
    } catch (error: any) {
      stage.status = "failed";
      stage.error = error.message;
      logger.error({ stage: name, error: error.message }, "Stage failed");
      throw error;
    }
  }

  /**
   * Get current pipeline status
   */
  getStatus(): PipelineStage[] {
    return [...this.stages];
  }

  /**
   * Utility: delay for async simulation
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default settings for error responses
const DEFAULT_SETTINGS = {
  steps: 30,
  cfg: 5.5,
  sampler: "dpmpp_2m",
  scheduler: "karras",
  width: 1024,
  height: 1024,
  seed: -1,
};

/**
 * Create orchestrator instance
 */
export function createOrchestrator(): OrchestratorService {
  return new OrchestratorService();
}

/**
 * Singleton instance for convenience
 */
let orchestratorInstance: OrchestratorService | null = null;

export function getOrchestrator(): OrchestratorService {
  if (!orchestratorInstance) {
    orchestratorInstance = new OrchestratorService();
  }
  return orchestratorInstance;
}

export default OrchestratorService;
