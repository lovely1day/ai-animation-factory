import { WorkflowStep } from "@ai-animation-factory/shared";

export class WorkflowService {

  static steps: WorkflowStep[] = [
    "idea",
    "script",
    "scenes",
    "images",
    "voice",
    "music",
    "subtitles",
    "animation",
    "assembly",
    "final"
  ];

  static getNextStep(step: WorkflowStep): WorkflowStep {

    const index = this.steps.indexOf(step);

    if (index === -1) return "final";

    return this.steps[index + 1] || "final";
  }

  static shouldPause(
    step: WorkflowStep,
    approvals: WorkflowStep[]
  ) {

    return approvals.includes(step);
  }

}