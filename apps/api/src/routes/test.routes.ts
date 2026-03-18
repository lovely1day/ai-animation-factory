import { Router } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

// Routes
router.get('/', (req, res) => {
  res.json({ message: 'Test routes' });
});

export { router };