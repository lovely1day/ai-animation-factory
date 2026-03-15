import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import { authRouter } from './auth.routes'

// Mock middleware
vi.mock('../middleware/auth', () => ({
  login: vi.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'test@example.com' },
    token: 'jwt-token-123'
  })
}))

vi.mock('../middleware/rate-limit', () => ({
  authRateLimit: (_req: Request, _res: Response, next: NextFunction) => next()
}))

describe('Auth Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRouter)
    
    // Error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      res.status(500).json({ error: err.message })
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
    })

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })

      expect(response.status).toBe(500)
    })

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'short'
        })

      expect(response.status).toBe(500)
    })

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })

      expect(response.status).toBe(500)
    })
  })
})
