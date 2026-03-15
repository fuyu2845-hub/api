import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/admin/apikeys
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const [keys, total] = await Promise.all([
    prisma.apiKey.findMany({
      include: {
        cdks: { select: { code: true } },
        _count: { select: { usageLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
    }),
    prisma.apiKey.count(),
  ]);
  res.json({ keys, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

// PUT /api/admin/apikeys/:id - Enable/disable
router.put('/:id', async (req, res) => {
  const { status, quotaTotal } = req.body;
  const data = {};
  if (status !== undefined) data.status = status;
  if (quotaTotal !== undefined) data.quotaTotal = parseFloat(quotaTotal);

  const key = await prisma.apiKey.update({
    where: { id: req.params.id },
    data,
  });
  res.json(key);
});

export default router;
