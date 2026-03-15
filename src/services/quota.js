import prisma from '../lib/prisma.js';
import config from '../config.js';

/**
 * Get pricing for a given model name.
 * Tries exact match first, then falls back to "*" default, then env defaults.
 */
export async function getPricing(modelName) {
  // Try exact match
  let rule = await prisma.pricingRule.findUnique({
    where: { modelPattern: modelName },
  });

  // Fallback to wildcard
  if (!rule) {
    rule = await prisma.pricingRule.findUnique({
      where: { modelPattern: '*' },
    });
  }

  return {
    inputPricePerM: rule?.inputPricePerM ?? config.defaultInputPrice,
    outputPricePerM: rule?.outputPricePerM ?? config.defaultOutputPrice,
  };
}

/**
 * Calculate cost and record usage for an API request.
 */
export async function recordUsage(apiKeyId, model, inputTokens, outputTokens, endpoint) {
  const pricing = await getPricing(model);
  const cost =
    (inputTokens / 1_000_000) * pricing.inputPricePerM +
    (outputTokens / 1_000_000) * pricing.outputPricePerM;

  await prisma.$transaction([
    prisma.usageLog.create({
      data: { apiKeyId, model, inputTokens, outputTokens, cost, endpoint },
    }),
    prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { quotaUsed: { increment: cost } },
    }),
  ]);

  return cost;
}
