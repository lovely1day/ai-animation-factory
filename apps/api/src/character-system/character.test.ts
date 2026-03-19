/**
 * Character System Tests
 * Comprehensive tests for character storage and service
 */

import * as fs from "fs";
import * as path from "path";
import {
  readRegistry,
  writeRegistry,
  getCharacterById,
  getAllCharacters,
  addCharacter,
  deleteCharacter,
} from "./character.storage";
import {
  getCharacter,
  saveCharacter,
  listCharacters,
  removeCharacter,
  exists,
  getPrimaryReferenceImage,
} from "./character.service";
import type { CharacterProfile, StorageConfig } from "./character.types";

// Test configuration (uses temp file)
const TEST_CONFIG: StorageConfig = {
  registryPath: path.join(process.cwd(), "temp/test-character-registry.json"),
  imagesBasePath: "ComfyUI/input/characters",
};

// Setup: Ensure temp directory exists
function setupTestDir() {
  const dir = path.dirname(TEST_CONFIG.registryPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Cleanup: Remove test file
function cleanupTestFile() {
  if (fs.existsSync(TEST_CONFIG.registryPath)) {
    fs.unlinkSync(TEST_CONFIG.registryPath);
  }
}

// ============================================================================
// TEST 1: Missing Registry File → Auto Create
// ============================================================================

export function testMissingRegistry(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 1: Missing Registry File → Auto Create");

  try {
    // Ensure file doesn't exist
    cleanupTestFile();

    // Attempt to read (should create empty)
    const registry = readRegistry(TEST_CONFIG);

    // Verify structure
    const valid =
      registry.version === "1.0.0" &&
      Array.isArray(registry.characters) &&
      registry.characters.length === 0;

    if (valid && fs.existsSync(TEST_CONFIG.registryPath)) {
      console.log("✅ TEST 1 PASSED - Registry auto-created");
      return {
        name: "Missing Registry Auto-Create",
        success: true,
        details: "Empty registry created with valid structure",
      };
    } else {
      console.log("❌ TEST 1 FAILED - Registry not created properly");
      return {
        name: "Missing Registry Auto-Create",
        success: false,
        details: "Registry structure invalid or file not created",
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 1 FAILED - Exception:", error.message);
    return {
      name: "Missing Registry Auto-Create",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 2: Add Character → Then Fetch
// ============================================================================

export function testAddAndFetch(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 2: Add Character → Then Fetch");

  try {
    setupTestDir();

    // Input character
    const input = {
      id: "char_001",
      name: "Pirate Captain",
      referenceImages: ["ComfyUI/input/characters/char_001.png"],
      metadata: {
        description: "A fierce pirate captain",
        traits: ["brave", "clever"],
      },
    };

    console.log("Input:", JSON.stringify(input, null, 2));

    // Save character
    const saveResult = saveCharacter(input, TEST_CONFIG);

    if (!saveResult.success) {
      console.log("❌ TEST 2 FAILED - Save failed:", saveResult.error);
      return {
        name: "Add and Fetch Character",
        success: false,
        details: `Save failed: ${saveResult.error}`,
      };
    }

    // Fetch character
    const fetched = getCharacter("char_001", TEST_CONFIG);

    if (!fetched) {
      console.log("❌ TEST 2 FAILED - Character not found after save");
      return {
        name: "Add and Fetch Character",
        success: false,
        details: "Character not found after save",
      };
    }

    // Verify data matches
    const matches =
      fetched.id === input.id &&
      fetched.name === input.name &&
      fetched.referenceImages.length === input.referenceImages.length;

    if (matches) {
      console.log("Fetched:", JSON.stringify(fetched, null, 2));
      console.log("✅ TEST 2 PASSED - Character saved and fetched correctly");
      return {
        name: "Add and Fetch Character",
        success: true,
        details: `Character ${fetched.id} saved and retrieved with normalized paths`,
      };
    } else {
      console.log("❌ TEST 2 FAILED - Data mismatch");
      return {
        name: "Add and Fetch Character",
        success: false,
        details: "Data mismatch after fetch",
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 2 FAILED - Exception:", error.message);
    return {
      name: "Add and Fetch Character",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 3: Invalid ID → Returns Null (No Crash)
// ============================================================================

export function testInvalidId(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 3: Invalid ID → Returns Null (No Crash)");

  try {
    // Try to get non-existent character
    const result = getCharacter("non_existent_id", TEST_CONFIG);

    if (result === null) {
      console.log("✅ TEST 3 PASSED - Returns null for invalid ID");
      return {
        name: "Invalid ID Returns Null",
        success: true,
        details: "Correctly returned null without throwing",
      };
    } else {
      console.log("❌ TEST 3 FAILED - Should return null");
      return {
        name: "Invalid ID Returns Null",
        success: false,
        details: "Returned non-null value for invalid ID",
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 3 FAILED - Exception (should not throw):", error.message);
    return {
      name: "Invalid ID Returns Null",
      success: false,
      details: `Threw exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 4: Empty Registry → Returns Empty Array
// ============================================================================

export function testEmptyRegistry(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 4: Empty Registry → Returns Empty Array");

  try {
    // Start fresh
    cleanupTestFile();
    setupTestDir();

    // Write empty registry
    writeRegistry(
      {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        characters: [],
      },
      TEST_CONFIG
    );

    // List characters
    const characters = listCharacters(TEST_CONFIG);

    if (Array.isArray(characters) && characters.length === 0) {
      console.log("✅ TEST 4 PASSED - Empty array returned");
      return {
        name: "Empty Registry Returns []",
        success: true,
        details: "Correctly returned empty array",
      };
    } else {
      console.log("❌ TEST 4 FAILED - Not empty:", characters);
      return {
        name: "Empty Registry Returns []",
        success: false,
        details: `Returned: ${JSON.stringify(characters)}`,
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 4 FAILED - Exception:", error.message);
    return {
      name: "Empty Registry Returns []",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 5: Path Normalization
// ============================================================================

export function testPathNormalization(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 5: Path Normalization");

  try {
    const testCases = [
      {
        input: "char_001.png",
        expected: "ComfyUI/input/characters/char_001.png",
      },
      {
        input: "characters/char_002.jpg",
        expected: "ComfyUI/input/characters/char_002.jpg",
      },
      {
        input: "ComfyUI/input/characters/char_003.png",
        expected: "ComfyUI/input/characters/char_003.png",
      },
    ];

    let allPassed = true;

    for (const tc of testCases) {
      const character = {
        id: `test_${Date.now()}`,
        name: "Test",
        referenceImages: [tc.input],
      };

      const result = saveCharacter(character, TEST_CONFIG);

      if (!result.success) {
        console.log(`❌ Failed to save: ${tc.input}`);
        allPassed = false;
        continue;
      }

      const fetched = getCharacter(character.id, TEST_CONFIG);
      const actual = fetched?.referenceImages[0];

      if (actual === tc.expected) {
        console.log(`✅ "${tc.input}" → "${actual}"`);
      } else {
        console.log(`❌ "${tc.input}" → "${actual}" (expected: "${tc.expected}")`);
        allPassed = false;
      }

      // Cleanup
      deleteCharacter(character.id, TEST_CONFIG);
    }

    if (allPassed) {
      console.log("✅ TEST 5 PASSED - All paths normalized correctly");
      return {
        name: "Path Normalization",
        success: true,
        details: "All path formats correctly normalized to ComfyUI/input/characters/",
      };
    } else {
      return {
        name: "Path Normalization",
        success: false,
        details: "Some paths not normalized correctly",
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 5 FAILED - Exception:", error.message);
    return {
      name: "Path Normalization",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 6: Validation - Missing Name
// ============================================================================

export function testValidationMissingName(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 6: Validation - Missing Name");

  try {
    const input = {
      id: "char_invalid",
      name: "", // Empty name
      referenceImages: ["test.png"],
    };

    const result = saveCharacter(input, TEST_CONFIG);

    if (!result.success && result.error?.includes("name")) {
      console.log("✅ TEST 6 PASSED - Correctly rejected empty name");
      console.log("Error:", result.error);
      return {
        name: "Validation - Missing Name",
        success: true,
        details: `Correctly rejected: ${result.error}`,
      };
    } else {
      console.log("❌ TEST 6 FAILED - Should reject empty name");
      return {
        name: "Validation - Missing Name",
        success: false,
        details: "Did not reject empty name",
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 6 FAILED - Exception:", error.message);
    return {
      name: "Validation - Missing Name",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// TEST 7: Get Primary Reference Image
// ============================================================================

export function testPrimaryImage(): {
  name: string;
  success: boolean;
  details: string;
} {
  console.log("\n🧪 TEST 7: Get Primary Reference Image");

  try {
    // Create character with multiple images
    const character = {
      id: `primary_test_${Date.now()}`,
      name: "Multi Image Character",
      referenceImages: [
        "char_main.png",
        "char_side.png",
        "char_back.png",
      ],
    };

    saveCharacter(character, TEST_CONFIG);

    // Get primary image
    const primary = getPrimaryReferenceImage(character.id, TEST_CONFIG);

    // Cleanup
    deleteCharacter(character.id, TEST_CONFIG);

    const expected = "ComfyUI/input/characters/char_main.png";

    if (primary === expected) {
      console.log("✅ TEST 7 PASSED - Primary image:", primary);
      return {
        name: "Get Primary Reference Image",
        success: true,
        details: `Returned first image: ${primary}`,
      };
    } else {
      console.log("❌ TEST 7 FAILED - Expected:", expected, "Got:", primary);
      return {
        name: "Get Primary Reference Image",
        success: false,
        details: `Expected ${expected}, got ${primary}`,
      };
    }
  } catch (error: any) {
    console.log("❌ TEST 7 FAILED - Exception:", error.message);
    return {
      name: "Get Primary Reference Image",
      success: false,
      details: `Exception: ${error.message}`,
    };
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runAllTests(): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 CHARACTER SYSTEM TESTS");
  console.log("=".repeat(70));

  // Setup
  setupTestDir();

  const results = [];

  // Run tests
  results.push(testMissingRegistry());
  results.push(testAddAndFetch());
  results.push(testInvalidId());
  results.push(testEmptyRegistry());
  results.push(testPathNormalization());
  results.push(testValidationMissingName());
  results.push(testPrimaryImage());

  // Cleanup
  cleanupTestFile();

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${result.name}`);
    console.log(`   ${result.details}`);
    if (result.success) passed++;
    else failed++;
  }

  console.log("\n" + "-".repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=".repeat(70));
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
