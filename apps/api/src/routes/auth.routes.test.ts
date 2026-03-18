import { Router } from 'express';
import type { Router as RouterType } from 'express';

const authRouter: RouterType = Router();

// Routes
authRouter.get('/', (req, res) => {
  res.json({ message: 'Auth routes' });
});

export { authRouter };