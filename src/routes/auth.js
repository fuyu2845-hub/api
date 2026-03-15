import { Router } from 'express';
import config from '../config.js';
import { signToken } from '../lib/jwt.js';

const router = Router();

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: '密码错误' });
  }
  const token = signToken({ role: 'admin' });
  res.json({ token });
});

export default router;
