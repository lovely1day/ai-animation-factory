import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login } from '../middleware/auth';
import { authRateLimit } from '../middleware/rate-limit';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post('/login', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
