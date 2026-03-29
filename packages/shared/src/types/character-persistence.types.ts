// ============================================================
// CHARACTER PERSISTENCE — Abstract Interface
// Each app implements this differently:
//   - feelthemusic.app → Supabase (characters table + storage)
//   - ai-animation-factory → File-based JSON registry
// ============================================================

export interface SavedCharacter {
  id: string;
  name: string;
  dna: string;
  era_code?: string;
  gender?: string;
  preview_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterInput {
  name: string;
  dna: string;
  era_code?: string;
  gender?: string;
}

export interface UpdateCharacterInput {
  name?: string;
  dna?: string;
  preview_url?: string;
}

/**
 * Abstract persistence interface for Character Studio.
 * Each consuming app provides its own implementation.
 *
 * Usage:
 *   // feelthemusic.app
 *   const persistence = createSupabasePersistence(supabaseClient);
 *
 *   // ai-animation-factory
 *   const persistence = createFilePersistence('/path/to/registry.json');
 */
export interface CharacterPersistence {
  list(): Promise<SavedCharacter[]>;
  get(id: string): Promise<SavedCharacter | null>;
  create(input: CreateCharacterInput): Promise<SavedCharacter>;
  update(id: string, input: UpdateCharacterInput): Promise<SavedCharacter>;
  delete(id: string): Promise<void>;
}
