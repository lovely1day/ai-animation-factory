export interface Show {

  id: string;

  title: string;

  description?: string;

  genre?: string;

  targetAudience?: "kids" | "family" | "adult";

  visualStyle?: string;

  renderQuality?: "1080p" | "4k" | "8k";

  defaultLanguage?: "ar" | "en";

  createdAt: string;

  updatedAt: string;

}