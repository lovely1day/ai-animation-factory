import { z } from 'zod';

export const createEpisodeSchema = z.object({
  idea: z.string().min(5, 'الفكرة يجب أن تكون 5 أحرف على الأقل'),
  genre: z.enum(['action', 'comedy', 'drama', 'scifi', 'horror', 'romance']),
  style: z.enum(['anime', 'realistic', 'cartoon', '3d']),
  duration: z.number().min(30).max(300).default(60),
  target_audience: z.enum(['kids', 'teens', 'adults', 'all']).default('all')
});

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل')
});

export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
