/**
 * Orchestrator Integration Tests
 * Tests for orchestrator + workflow-engine + output-manager
 */

import { createOrchestrator } from "./orchestrator.service";
import { executeWorkflow, checkWorkflowStatus } from "../workflow-engine.service";
import { processOutput, getImageUrl } from "../output-manager.service";
import type { PipelineRequest } from "./pipeline.types";

// ============================================================================
// TEST 1: Happy Path - Base Workflow
// ============================================================================

export async function testBaseWorkflow(): Promise<{
  name: string;
  input: PipelineRequest;
  success: boolean;
  output: unknown;
  error?: string;
}> {
  const orchestrator = createOrchestrator();

  const input: PipelineRequest = {
    prompt: "cinematic portrait of a hero, dramatic lighting",
    workflowType: "base",
    settings: {
      steps: 20,
      cfg: 5.0,
      width: 512,
      height: 512,
    },
  };

  try {
    console.log("\n🧪 TEST 1: Base Workflow");
    console.log("Input:", JSON.stringify(input, null, 2));

    const result = await orchestrator.execute(input);

    console.log("Output:", JSON.stringify(result, null, 2));
    console.log("✅ TEST 1 PASSED\n");

    return {
      name: "Base Workflow",
      input,
      success: result.success,
      output: result,
    };
  } catch (error: any) {
    console.log("❌ TEST 1 FAILED:", error.message);
    return {
      name: "Base Workflow",
      input,
      success: false,
      output: null,
      error: error.message,
    };
  }
}

// ============================================================================
// TEST 2: Happy Path - IPAdapter Workflow
// ============================================================================

export async function testIPAdapterWorkflow(): Promise<{
  name: string;
  input: PipelineRequest;
  success: boolean;
  output: unknown;
  error?: string;
}> {
  const orchestrator = createOrchestrator();

  const input: PipelineRequest = {
    prompt: "character in action scene",
    workflowType: "ipadapter",
    characterId: "hero_001",
    sceneContext: "battle scene",
    settings: {
      steps: 25,
      cfg: 4.5,
    },
  };

  try {
    console.log("\n🧪 TEST 2: IPAdapter Workflow");
    console.log("Input:", JSON.stringify(input, null, 2));

    const result = await orchestrator.execute(input);

    console.log("Output:", JSON.stringify(result, null, 2));
    console.log("✅ TEST 2 PASSED\n");

    return {
      name: "IPAdapter Workflow",
      input,
      success: result.success,
      output: result,
    };
  } catch (error: any) {
    console.log("❌ TEST 2 FAILED:", error.message);
    return {
      name: "IPAdapter Workflow",
      input,
      success: false,
      output: null,
      error: error.message,
    };
  }
}

// ============================================================================
// TEST 3: Edge Case - Missing Prompt (Should Fail)
// ============================================================================

export async function testMissingPrompt(): Promise<{
  name: string;
  input: PipelineRequest;
  success: boolean;
  expectedBehavior: string;
  actualBehavior: string;
}> {
  const orchestrator = createOrchestrator();

  const input: PipelineRequest = {
    prompt: "", // Empty prompt
    workflowType: "base",
  };

  try {
    console.log("\n🧪 TEST 3: Missing Prompt (Edge Case)");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Expected: Should fail with validation error");

    const result = await orchestrator.execute(input);

    if (!result.success && result.error) {
      console.log("✅ TEST 3 PASSED - Correctly rejected empty prompt");
      console.log("Error:", result.error);
      return {
        name: "Missing Prompt",
        input,
        success: true, // Test passed (rejection worked)
        expectedBehavior: "Fail with validation error",
        actualBehavior: `Failed: ${result.error}`,
      };
    } else {
      console.log("❌ TEST 3 FAILED - Should have rejected empty prompt");
      return {
        name: "Missing Prompt",
        input,
        success: false,
        expectedBehavior: "Fail with validation error",
        actualBehavior: "Unexpectedly succeeded",
      };
    }
  } catch (error: any) {
    console.log("✅ TEST 3 PASSED - Threw expected error");
    console.log("Error:", error.message);
    return {
      name: "Missing Prompt",
      input,
      success: true,
      expectedBehavior: "Fail with validation error",
      actualBehavior: `Threw: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 4: Edge Case - Invalid Workflow Type (Should Fail)
// ============================================================================

export async function testInvalidWorkflowType(): Promise<{
  name: string;
  input: PipelineRequest;
  success: boolean;
  expectedBehavior: string;
  actualBehavior: string;
}> {
  const orchestrator = createOrchestrator();

  const input = {
    prompt: "test prompt",
    workflowType: "invalid_type" as any,
  };

  try {
    console.log("\n🧪 TEST 4: Invalid Workflow Type (Edge Case)");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Expected: Should fail with 'Unknown workflow type'");

    const result = await orchestrator.execute(input);

    if (!result.success) {
      console.log("✅ TEST 4 PASSED - Correctly rejected invalid type");
      return {
        name: "Invalid Workflow Type",
        input,
        success: true,
        expectedBehavior: "Fail with unknown workflow type error",
        actualBehavior: `Failed: ${result.error}`,
      };
    } else {
      console.log("❌ TEST 4 FAILED - Should have rejected invalid type");
      return {
        name: "Invalid Workflow Type",
        input,
        success: false,
        expectedBehavior: "Fail with unknown workflow type error",
        actualBehavior: "Unexpectedly succeeded",
      };
    }
  } catch (error: any) {
    console.log("✅ TEST 4 PASSED - Threw expected error");
    console.log("Error:", error.message);
    return {
      name: "Invalid Workflow Type",
      input,
      success: true,
      expectedBehavior: "Fail with unknown workflow type error",
      actualBehavior: `Threw: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 5: Output Manager - Process Mock ComfyUI Response
// ============================================================================

export function testOutputManager(): {
  name: string;
  input: unknown;
  success: boolean;
  imagesCount: number;
  errors?: string[];
} {
  console.log("\n🧪 TEST 5: Output Manager");

  // Mock ComfyUI response
  const mockOutput = {
    outputs: {
      "9": {
        images: [
          { filename: "ComfyUI_00001_.png", subfolder: "", type: "output" },
          { filename: "ComfyUI_00002_.png", subfolder: "", type: "output" },
        ],
      },
    },
  };

  console.log("Input (mock ComfyUI output):", JSON.stringify(mockOutput, null, 2));

  const result = processOutput(mockOutput);

  console.log("Output:", JSON.stringify(result, null, 2));

  if (result.success && result.images.length === 2) {
    console.log("✅ TEST 5 PASSED\n");
    return {
      name: "Output Manager",
      input: mockOutput,
      success: true,
      imagesCount: result.images.length,
    };
  } else {
    console.log("❌ TEST 5 FAILED\n");
    return {
      name: "Output Manager",
      input: mockOutput,
      success: false,
      imagesCount: result.images.length,
      errors: result.errors,
    };
  }
}

// ============================================================================
// TEST 6: Output Manager - Empty Response (Edge Case)
// ============================================================================

export function testEmptyOutput(): {
  name: string;
  input: unknown;
  success: boolean;
  expectedBehavior: string;
  actualBehavior: string;
} {
  console.log("\n🧪 TEST 6: Empty Output (Edge Case)");

  const emptyOutput = { outputs: {} };

  console.log("Input:", JSON.stringify(emptyOutput));
  console.log("Expected: Should fail gracefully");

  const result = processOutput(emptyOutput);

  console.log("Output:", JSON.stringify(result, null, 2));

  if (!result.success && result.images.length === 0) {
    console.log("✅ TEST 6 PASSED - Handled empty output correctly\n");
    return {
      name: "Empty Output",
      input: emptyOutput,
      success: true,
      expectedBehavior: "Fail with no outputs error",
      actualBehavior: `Failed: ${result.errors?.[0]}`,
    };
  } else {
    console.log("❌ TEST 6 FAILED\n");
    return {
      name: "Empty Output",
      input: emptyOutput,
      success: false,
      expectedBehavior: "Fail with no outputs error",
      actualBehavior: "Unexpected behavior",
    };
  }
}

// ============================================================================
// MANUAL TEST: curl command for direct ComfyUI testing
// ============================================================================

export const manualTestCurl = `
# Manual Test: Direct ComfyUI API Call
# =====================================

# 1. Test ComfyUI is running
curl http://localhost:8188/system_stats

# 2. Test workflow submission (minimal payload)
curl -X POST http://localhost:8188/prompt \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": {
      "1": {
        "inputs": {"text": "test prompt"},
        "class_type": "CLIPTextEncode"
      }
    }
  }'

# 3. Check job status (replace PROMPT_ID with actual ID from step 2)
curl http://localhost:8188/history/PROMPT_ID
`;

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runAllTests(): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 ORCHESTRATOR INTEGRATION TESTS");
  console.log("=".repeat(70));

  const results = [];

  // Run tests
  results.push(await testBaseWorkflow());
  results.push(await testIPAdapterWorkflow());
  results.push(await testMissingPrompt());
  results.push(await testInvalidWorkflowType());
  results.push(testOutputManager());
  results.push(testEmptyOutput());

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${result.name}`);
    if (result.success) passed++;
    else failed++;
  }

  console.log("\n" + "-".repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=".repeat(70));

  // Print manual test
  console.log("\n📝 MANUAL TEST COMMANDS:");
  console.log(manualTestCurl);
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
