import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/admin/pricing
router.get('/', async (_req, res) => {
  const rules = await prisma.pricingRule.findMany({ orderBy: { modelPattern: 'asc' } });
  res.json(rules);
});

// POST /api/admin/pricing - Create or update
router.post('/', async (req, res) => {
  const { modelPattern, inputPricePerM, outputPricePerM } = req.body;
  if (!modelPattern || inputPricePerM == null || outputPricePerM == null) {
    return res.status(400).json({ error: '所有字段为必填项' });
  }

  const rule = await prisma.pricingRule.upsert({
    where: { modelPattern },
    create: {
      modelPattern,
      inputPricePerM: parseFloat(inputPricePerM),
      outputPricePerM: parseFloat(outputPricePerM),
    },
    update: {
      inputPricePerM: parseFloat(inputPricePerM),
      outputPricePerM: parseFloat(outputPricePerM),
    },
  });
  res.json(rule);
});

// DELETE /api/admin/pricing/:id
router.delete('/:id', async (req, res) => {
  await prisma.pricingRule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
