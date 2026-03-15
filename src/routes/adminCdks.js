import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateCdkCode } from '../lib/keygen.js';

const router = Router();

// GET /api/admin/cdks - List all CDKs
router.get('/', async (req, res) => {
  const { status, page = 1, pageSize = 50 } = req.query;
  const where = status ? { status } : {};
  const [cdks, total] = await Promise.all([
    prisma.cdk.findMany({
      where,
      include: { apiKey: { select: { id: true, key: true, quotaUsed: true, quotaTotal: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
    }),
    prisma.cdk.count({ where }),
  ]);
  res.json({ cdks, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

// POST /api/admin/cdks - Create CDKs (single or batch)
router.post('/', async (req, res) => {
  const { count = 1, quota, expiryDays, note } = req.body;
  if (!quota || !expiryDays) {
    return res.status(400).json({ error: '额度和有效天数为必填项' });
  }

  const cdks = [];
  for (let i = 0; i < Math.min(count, 500); i++) {
    cdks.push({
      code: generateCdkCode(),
      quota: parseFloat(quota),
      expiryDays: parseInt(expiryDays),
      note: note || null,
    });
  }

  const created = await prisma.cdk.createMany({ data: cdks });
  // Return the created CDK codes
  const result = await prisma.cdk.findMany({
    where: { code: { in: cdks.map((c) => c.code) } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ created: created.count, cdks: result });
});

// PUT /api/admin/cdks/batch - Batch update CDKs
router.put('/batch', async (req, res) => {
  const { ids, quota, expiryDays, status, note } = req.body;
  if (!ids?.length) {
    return res.status(400).json({ error: '请选择要修改的 CDK' });
  }

  const data = {};
  if (quota !== undefined) data.quota = parseFloat(quota);
  if (expiryDays !== undefined) data.expiryDays = parseInt(expiryDays);
  if (status !== undefined) data.status = status;
  if (note !== undefined) data.note = note;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: '请提供要修改的字段' });
  }

  const updated = await prisma.cdk.updateMany({
    where: { id: { in: ids } },
    data,
  });
  res.json({ updated: updated.count });
});

// PUT /api/admin/cdks/:id - Update single CDK
router.put('/:id', async (req, res) => {
  const { quota, expiryDays, status, note } = req.body;
  const data = {};
  if (quota !== undefined) data.quota = parseFloat(quota);
  if (expiryDays !== undefined) data.expiryDays = parseInt(expiryDays);
  if (status !== undefined) data.status = status;
  if (note !== undefined) data.note = note;

  const cdk = await prisma.cdk.update({
    where: { id: req.params.id },
    data,
  });
  res.json(cdk);
});

// DELETE /api/admin/cdks/:id
router.delete('/:id', async (req, res) => {
  await prisma.cdk.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// DELETE /api/admin/cdks/batch/delete - Batch delete
router.post('/batch/delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids?.length) {
    return res.status(400).json({ error: '请选择要删除的 CDK' });
  }
  const deleted = await prisma.cdk.deleteMany({
    where: { id: { in: ids }, status: { not: 'redeemed' } },
  });
  res.json({ deleted: deleted.count });
});

export default router;
