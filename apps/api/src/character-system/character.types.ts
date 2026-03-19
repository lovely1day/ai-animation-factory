/**
 * Character System Types
 * Type definitions for the character registry system
 */

/**
 * Character profile data
 */
export interface CharacterProfile {
  /** Unique character identifier */
  id: string;

  /** Character name (display name) */
  name: string;

  /** Array of reference image paths */
  referenceImages: string[];

  /** Optional metadata (traits, description, etc.) */
  metadata?: {
    /** Character description/background */
    description?: string;

    /** Character traits (array of tags) */
    traits?: string[];

    /** Age or age range */
    age?: string;

    /** Gender */
    gender?: string;

    /** Clothing style */
    clothing?: string;

    /** Distinctive features */
    features?: string;

    /** Any additional custom data */
    [key: string]: unknown;
  };

  /** Creation timestamp */
  createdAt?: string;

  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Character registry structure
 */
export interface CharacterRegistry {
  /** Registry version */
  version: string;

  /** Last update timestamp */
  lastUpdated: string;

  /** Array of character profiles */
  characters: CharacterProfile[];
}

/**
 * Input for creating/updating a character
 */
export interface CharacterInput {
  id: string;
  name: string;
  referenceImages: string[];
  metadata?: CharacterProfile["metadata"];
}

/**
 * Result of character operations
 */
export interface CharacterOperationResult {
  /** Success status */
  success: boolean;

  /** Character data (if successful) */
  character?: CharacterProfile;

  /** Error message (if failed) */
  error?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Path to registry file */
  registryPath: string;

  /** Base path for character images */
  imagesBasePath: string;
}

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  registryPath: "apps/api/src/configs/character-registry.json",
  imagesBasePath: "ComfyUI/input/characters",
};
