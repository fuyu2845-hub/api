import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/admin/stats
router.get('/', async (_req, res) => {
  const [
    totalCdks,
    activeCdks,
    redeemedCdks,
    totalKeys,
    activeKeys,
    totalLogs,
    usageAgg,
  ] = await Promise.all([
    prisma.cdk.count(),
    prisma.cdk.count({ where: { status: 'active' } }),
    prisma.cdk.count({ where: { status: 'redeemed' } }),
    prisma.apiKey.count(),
    prisma.apiKey.count({ where: { status: 'active' } }),
    prisma.usageLog.count(),
    prisma.usageLog.aggregate({
      _sum: { inputTokens: true, outputTokens: true, cost: true },
    }),
  ]);

  res.json({
    cdks: { total: totalCdks, active: activeCdks, redeemed: redeemedCdks },
    apiKeys: { total: totalKeys, active: activeKeys },
    usage: {
      totalRequests: totalLogs,
      totalInputTokens: usageAgg._sum.inputTokens || 0,
      totalOutputTokens: usageAgg._sum.outputTokens || 0,
      totalCost: usageAgg._sum.cost || 0,
    },
  });
});

// GET /api/admin/usage - Usage logs with pagination
router.get('/usage', async (req, res) => {
  const { page = 1, pageSize = 50, apiKeyId } = req.query;
  const where = apiKeyId ? { apiKeyId } : {};
  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      include: { apiKey: { select: { key: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
    }),
    prisma.usageLog.count({ where }),
  ]);
  res.json({ logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

export default router;
