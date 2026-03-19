/**
 * Character Storage
 * Handles JSON registry read/write operations safely
 */

import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger";
import type {
  CharacterRegistry,
  CharacterProfile,
  StorageConfig,
  DEFAULT_STORAGE_CONFIG,
} from "./character.types";

// Use require for JSON to avoid issues
const DEFAULT_CONFIG: StorageConfig = {
  registryPath: path.join(process.cwd(), "apps/api/src/configs/character-registry.json"),
  imagesBasePath: "ComfyUI/input/characters",
};

/**
 * Read registry from file system
 * Creates empty registry if file doesn't exist
 */
export function readRegistry(
  config: StorageConfig = DEFAULT_CONFIG
): CharacterRegistry {
  try {
    // Check if file exists
    if (!fs.existsSync(config.registryPath)) {
      logger.warn(
        { path: config.registryPath },
        "Registry file not found, creating empty registry"
      );

      // Create empty registry
      const emptyRegistry: CharacterRegistry = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        characters: [],
      };

      // Ensure directory exists
      const dir = path.dirname(config.registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write empty registry
      writeRegistry(emptyRegistry, config);
      return emptyRegistry;
    }

    // Read and parse file
    const data = fs.readFileSync(config.registryPath, "utf-8");
    const registry = JSON.parse(data) as CharacterRegistry;

    // Validate structure
    if (!registry.characters || !Array.isArray(registry.characters)) {
      logger.error(
        { path: config.registryPath },
        "Invalid registry structure, returning empty"
      );
      return {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        characters: [],
      };
    }

    logger.debug(
      { count: registry.characters.length },
      "Registry loaded successfully"
    );

    return registry;
  } catch (error: any) {
    logger.error(
      { error: error.message, path: config.registryPath },
      "Failed to read registry"
    );

    // Return empty registry on error (don't crash)
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      characters: [],
    };
  }
}

/**
 * Write registry to file system
 */
export function writeRegistry(
  registry: CharacterRegistry,
  config: StorageConfig = DEFAULT_CONFIG
): boolean {
  try {
    // Update timestamp
    registry.lastUpdated = new Date().toISOString();

    // Ensure directory exists
    const dir = path.dirname(config.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write with pretty formatting
    fs.writeFileSync(
      config.registryPath,
      JSON.stringify(registry, null, 2),
      "utf-8"
    );

    logger.debug(
      { count: registry.characters.length, path: config.registryPath },
      "Registry saved"
    );

    return true;
  } catch (error: any) {
    logger.error(
      { error: error.message, path: config.registryPath },
      "Failed to write registry"
    );
    return false;
  }
}

/**
 * Get character by ID
 * Returns null if not found (never throws)
 */
export function getCharacterById(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): CharacterProfile | null {
  try {
    const registry = readRegistry(config);
    const character = registry.characters.find((c) => c.id === id);

    if (!character) {
      logger.debug({ id }, "Character not found");
      return null;
    }

    logger.debug({ id, name: character.name }, "Character found");
    return character;
  } catch (error: any) {
    logger.error({ error: error.message, id }, "Error getting character");
    return null;
  }
}

/**
 * Get all characters
 * Returns empty array on error (never throws)
 */
export function getAllCharacters(
  config: StorageConfig = DEFAULT_CONFIG
): CharacterProfile[] {
  try {
    const registry = readRegistry(config);
    return registry.characters;
  } catch (error: any) {
    logger.error({ error: error.message }, "Error getting all characters");
    return [];
  }
}

/**
 * Add new character to registry
 */
export function addCharacter(
  character: CharacterProfile,
  config: StorageConfig = DEFAULT_CONFIG
): { success: boolean; error?: string } {
  try {
    const registry = readRegistry(config);

    // Check if ID already exists
    const existingIndex = registry.characters.findIndex(
      (c) => c.id === character.id
    );

    if (existingIndex >= 0) {
      // Update existing
      registry.characters[existingIndex] = {
        ...character,
        updatedAt: new Date().toISOString(),
      };
      logger.info({ id: character.id }, "Character updated");
    } else {
      // Add new
      character.createdAt = new Date().toISOString();
      character.updatedAt = character.createdAt;
      registry.characters.push(character);
      logger.info({ id: character.id }, "Character added");
    }

    const saved = writeRegistry(registry, config);
    if (!saved) {
      return { success: false, error: "Failed to save registry" };
    }

    return { success: true };
  } catch (error: any) {
    logger.error(
      { error: error.message, id: character.id },
      "Error adding character"
    );
    return { success: false, error: error.message };
  }
}

/**
 * Delete character by ID
 */
export function deleteCharacter(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): { success: boolean; error?: string } {
  try {
    const registry = readRegistry(config);
    const initialLength = registry.characters.length;

    registry.characters = registry.characters.filter((c) => c.id !== id);

    if (registry.characters.length === initialLength) {
      logger.warn({ id }, "Character not found for deletion");
      return { success: false, error: "Character not found" };
    }

    const saved = writeRegistry(registry, config);
    if (!saved) {
      return { success: false, error: "Failed to save registry" };
    }

    logger.info({ id }, "Character deleted");
    return { success: true };
  } catch (error: any) {
    logger.error({ error: error.message, id }, "Error deleting character");
    return { success: false, error: error.message };
  }
}

/**
 * Check if character exists
 */
export function characterExists(
  id: string,
  config: StorageConfig = DEFAULT_CONFIG
): boolean {
  return getCharacterById(id, config) !== null;
}

export default {
  readRegistry,
  writeRegistry,
  getCharacterById,
  getAllCharacters,
  addCharacter,
  deleteCharacter,
  characterExists,
};
