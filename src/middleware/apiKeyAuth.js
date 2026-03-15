import prisma from '../lib/prisma.js';

export default async function apiKeyAuth(req, res, next) {
  // Extract API key from Authorization header or x-api-key
  let key = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    key = authHeader.slice(7);
  } else if (req.headers['x-api-key']) {
    key = req.headers['x-api-key'];
  }

  if (!key) {
    return res.status(401).json({ error: '缺少 API Key' });
  }

  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { key } });

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key 无效' });
    }
    if (apiKey.status !== 'active') {
      return res.status(403).json({ error: 'API Key 已被禁用' });
    }
    if (new Date() > apiKey.expiresAt) {
      return res.status(403).json({ error: 'API Key 已过期' });
    }
    if (apiKey.quotaUsed >= apiKey.quotaTotal) {
      return res.status(429).json({ error: '额度已用尽' });
    }

    req.apiKeyRecord = apiKey;
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    return res.status(500).json({ error: '认证服务内部错误' });
  }
}
