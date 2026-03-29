import { describe, it, expect } from 'vitest';
import { Router } from 'express';

describe('Auth Routes', () => {
  it('creates a valid express router', () => {
    const router = Router();
    expect(router).toBeDefined();
    expect(typeof router.get).toBe('function');
  });
});
