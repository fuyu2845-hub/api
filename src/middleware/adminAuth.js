import { verifyToken } from '../lib/jwt.js';

export default function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权：缺少管理员令牌' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}
