import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const authRouter: Router = Router();

function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY } as jwt.SignOptions);
}

/**
 * Register new user
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role = 'viewer' } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name: full_name?.trim() || null,
        role: ['admin', 'editor', 'viewer'].includes(role) ? role : 'viewer',
        is_active: true,
      })
      .select('id, email, role, full_name, created_at')
      .single();

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user');
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    logger.info({ user_id: user.id, email: user.email }, 'User registered');

    return res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } },
    });
  } catch (err: any) {
    logger.error({ error: 'Internal server error' }, 'Registration failed');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Login
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, password_hash, full_name, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is disabled' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    logger.info({ user_id: user.id }, 'User logged in');

    return res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } },
    });
  } catch (err: any) {
    logger.error({ error: 'Internal server error' }, 'Login failed');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, avatar_url, is_active, last_login_at, created_at')
      .eq('id', req.user!.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
authRouter.post('/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const token = signToken({
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
    });

    return res.json({ success: true, data: { token } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Update current user profile
 * PATCH /api/auth/me
 */
authRouter.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, avatar_url } = req.body;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (full_name !== undefined) update.full_name = full_name?.trim() || null;
    if (avatar_url !== undefined) update.avatar_url = avatar_url || null;

    const { data: user, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', req.user!.id)
      .select('id, email, role, full_name, avatar_url')
      .single();

    if (error) throw error;

    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
authRouter.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'current_password and new_password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user!.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id);

    logger.info({ user_id: req.user!.id }, 'Password changed');

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { authRouter };
export default authRouter;
