export type EntityType =
  | "character"
  | "animal"
  | "location"
  | "vehicle"
  | "prop"
  | "organization";

export interface Entity {

  id: string;

  showId: string;

  type: EntityType;

  name: string;

  description?: string;

  referenceImage?: string;

  stylePrompt?: string;

  voiceId?: string;

  metadata?: Record<string, any>;

  createdAt: string;

  updatedAt: string;

}