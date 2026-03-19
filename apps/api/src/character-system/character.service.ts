/**
 * Character Service
 * Validates and normalizes character data
 */

import { logger } from "../utils/logger";
import type {
  CharacterProfile,
  CharacterInput,
  CharacterOperationResult,
  StorageConfig,
} from "./character.types";
import {
  getCharacterById,
  addCharacter as storageAddCharacter,
  getAllCharacters,
  deleteCharacter as storageDeleteCharacter,
  characterExists,
} from "./character.storage";

const DEFAULT_CONFIG: StorageConfig = {
  registryPath: "apps/api/src/configs/character-registry.json",
  imagesBasePath: "ComfyUI/input/characters",
};

/**
 * Normalize image path to standard format
 * Ensures path starts with ComfyUI/input/characters/
 */
function normalizeImagePath(imagePath: string): string {
  // Remove leading/trailing slashes
  let normalized = imagePath.trim().replace(/^\/+|\/+$/g, "");

  // If already starts with ComfyUI/input/characters, return as-is
  if (normalized.startsWith("ComfyUI/input/characters")) {
    return normalized;
  }

  // If starts with just "characters/", add prefix
  if (normalized.startsWith("characters/")) {
    return `ComfyUI/input/${normalized}`;
  }

  // Otherwise, assume it's just a filename and add full path
  const filename = normalized.split("/").pop() || normalized;
  return `ComfyUI/input/characters/${filename}`;
}

/**
 * Validate character input
 */
function validateCharacterInput(
  input: CharacterInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate ID
  if (!input.id || typeof input.id !== "string" || input.id.trim() === "") {
    errors.push("Character ID is required");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(input.id)) {
    errors.push(
      "Character ID must contain only letters, numbers, underscores, and hyphens"
    );
  }

  // Validate name
  if (!input.name || typeof input.name !== "string" || input.name.trim() === "") {
    errors.push("Character name is required");
  }

  // Validate referenceImages
  if (!input.referenceImages || !Array.isArray(input.referenceImages)) {
    errors.push("referenceImages must be an array");
  } else if (input.referenceImages.length === 0) {
    errors.push("At least one reference image is required");
  } else {
    // Check each image path
    for (let i = 0; i < input.referenceImages.length; i++) {
      const img = input.referenceImages[i];
      if (typeof img !== "string" || img.trim() === "") {
        errors.push(`referenceImages[${i}] is empty`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize character data
 */
function normalizeCharacter(input: CharacterInput): CharacterProfile {
  // Normalize all image paths
  const normalizedImages = input.referenceImages.map(normalizeImagePath);

  // Remove duplicates
  const uniqueImages = [...new Set(normalizedImages)];

  return {
    id: input.id.trim(),
    name: input.name.trim(),
    referenceImages: uniqueImages,
    metadata: input.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get character by ID
 * Returns null if not found
 */
export function getCharacter(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): CharacterProfile | null {
  logger.debug({ id }, "Getting character");

  const character = getCharacterById(id, config);

  if (!character) {
    logger.debug({ id }, "Character not found");
    return null;
  }

  // Ensure paths are normalized
  return {
    ...character,
    referenceImages: character.referenceImages.map(normalizeImagePath),
  };
}

/**
 * Create or update character
 */
export function saveCharacter(
  input: CharacterInput,
  config: StorageConfig = DEFAULT_CONFIG
): CharacterOperationResult {
  logger.info({ id: input.id }, "Saving character");

  // Validate
  const validation = validateCharacterInput(input);
  if (!validation.valid) {
    logger.warn({ id: input.id, errors: validation.errors }, "Validation failed");
    return {
      success: false,
      error: validation.errors.join(", "),
    };
  }

  // Normalize
  const normalized = normalizeCharacter(input);

  // Save to storage
  const result = storageAddCharacter(normalized, config);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  logger.info({ id: input.id }, "Character saved successfully");

  return {
    success: true,
    character: normalized,
  };
}

/**
 * List all characters
 */
export function listCharacters(
  config: StorageConfig = DEFAULT_CONFIG
): CharacterProfile[] {
  logger.debug("Listing all characters");

  const characters = getAllCharacters(config);

  // Normalize paths for all
  return characters.map((char) => ({
    ...char,
    referenceImages: char.referenceImages.map(normalizeImagePath),
  }));
}

/**
 * Delete character
 */
export function removeCharacter(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): CharacterOperationResult {
  logger.info({ id }, "Removing character");

  const result = storageDeleteCharacter(id, config);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
  };
}

/**
 * Check if character exists
 */
export function exists(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): boolean {
  return characterExists(id, config);
}

/**
 * Get character reference image for IPAdapter
 * Returns the first (primary) reference image path
 */
export function getPrimaryReferenceImage(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): string | null {
  const character = getCharacter(id, config);

  if (!character || character.referenceImages.length === 0) {
    return null;
  }

  return character.referenceImages[0];
}

/**
 * Get all reference images for a character
 */
export function getAllReferenceImages(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): string[] {
  const character = getCharacter(id, config);
  return character?.referenceImages || [];
}

export default {
  getCharacter,
  saveCharacter,
  listCharacters,
  removeCharacter,
  exists,
  getPrimaryReferenceImage,
  getAllReferenceImages,
};
