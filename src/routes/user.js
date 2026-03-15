import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateApiKey } from '../lib/keygen.js';

const router = Router();

// POST /api/redeem - Redeem CDK for API key
router.post('/redeem', async (req, res) => {
  const { cdk } = req.body;
  if (!cdk) {
    return res.status(400).json({ error: '请输入 CDK' });
  }

  const cdkRecord = await prisma.cdk.findUnique({ where: { code: cdk } });
  if (!cdkRecord) {
    return res.status(404).json({ error: 'CDK 不存在' });
  }
  if (cdkRecord.status === 'redeemed') {
    return res.status(400).json({ error: '该 CDK 已被兑换' });
  }
  if (cdkRecord.status === 'disabled') {
    return res.status(400).json({ error: '该 CDK 已被禁用' });
  }

  const key = generateApiKey();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + cdkRecord.expiryDays);

  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      quotaTotal: cdkRecord.quota,
      expiresAt,
    },
  });

  await prisma.cdk.update({
    where: { id: cdkRecord.id },
    data: {
      status: 'redeemed',
      redeemedAt: new Date(),
      apiKeyId: apiKey.id,
    },
  });

  res.json({
    apiKey: key,
    quota: apiKey.quotaTotal,
    expiresAt: apiKey.expiresAt,
  });
});

// GET /api/status - Check API key status
router.get('/status', async (req, res) => {
  let key = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    key = authHeader.slice(7);
  } else if (req.headers['x-api-key']) {
    key = req.headers['x-api-key'];
  } else if (req.query.key) {
    key = req.query.key;
  }

  if (!key) {
    return res.status(400).json({ error: '请提供 API Key' });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { _count: { select: { usageLogs: true } } },
  });

  if (!apiKey) {
    return res.status(404).json({ error: 'API Key 不存在' });
  }

  res.json({
    status: apiKey.status,
    quotaTotal: apiKey.quotaTotal,
    quotaUsed: apiKey.quotaUsed,
    quotaRemaining: Math.max(0, apiKey.quotaTotal - apiKey.quotaUsed),
    expiresAt: apiKey.expiresAt,
    isExpired: new Date() > apiKey.expiresAt,
    totalRequests: apiKey._count.usageLogs,
    createdAt: apiKey.createdAt,
  });
});

// GET /api/usage - Usage logs for an API key
router.get('/usage', async (req, res) => {
  let key = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    key = authHeader.slice(7);
  } else if (req.headers['x-api-key']) {
    key = req.headers['x-api-key'];
  } else if (req.query.key) {
    key = req.query.key;
  }

  if (!key) {
    return res.status(400).json({ error: '请提供 API Key' });
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { key } });
  if (!apiKey) {
    return res.status(404).json({ error: 'API Key 不存在' });
  }

  const { page = 1, pageSize = 50 } = req.query;
  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where: { apiKeyId: apiKey.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
    }),
    prisma.usageLog.count({ where: { apiKeyId: apiKey.id } }),
  ]);

  res.json({ logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

export default router;
