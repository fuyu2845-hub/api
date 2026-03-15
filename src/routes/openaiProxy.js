import { Router } from 'express';
import prisma from '../lib/prisma.js';
import config from '../config.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';
import { recordUsage } from '../services/quota.js';

const router = Router();

// POST /v1/chat/completions - OpenAI-compatible proxy
router.post('/chat/completions', apiKeyAuth, async (req, res) => {
  const apiKeyRecord = req.apiKeyRecord;
  const isStream = req.body.stream === true;

  try {
    const upstreamUrl = `${config.cliproxy.baseUrl}/v1/chat/completions`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.cliproxy.apiKey}`,
    };

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    if (!upstreamRes.ok && !isStream) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).send(errText);
    }

    if (!isStream) {
      const data = await upstreamRes.json();
      // Extract and record usage
      if (data.usage) {
        const model = data.model || req.body.model || 'unknown';
        recordUsage(
          apiKeyRecord.id,
          model,
          data.usage.prompt_tokens || 0,
          data.usage.completion_tokens || 0,
          'openai'
        ).catch((err) => console.error('Usage recording error:', err));
      }
      return res.json(data);
    }

    // Streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let modelName = req.body.model || 'unknown';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        res.write(chunk);

        // Try to extract usage from SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.model) modelName = parsed.model;
            if (parsed.usage) {
              totalInputTokens = parsed.usage.prompt_tokens || totalInputTokens;
              totalOutputTokens = parsed.usage.completion_tokens || totalOutputTokens;
            }
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    } catch (streamErr) {
      console.error('Stream read error:', streamErr);
    }

    res.end();

    // Record usage after stream ends
    if (totalInputTokens > 0 || totalOutputTokens > 0) {
      recordUsage(apiKeyRecord.id, modelName, totalInputTokens, totalOutputTokens, 'openai').catch(
        (err) => console.error('Usage recording error:', err)
      );
    }
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: '上游服务请求失败' });
    }
  }
});

// GET /v1/models - return only priced models
router.get('/models', async (_req, res) => {
  try {
    // Get all pricing rules from database
    const pricingRules = await prisma.pricingRule.findMany();
    const pricedModels = pricingRules
      .filter((rule) => rule.modelPattern !== '*') // Exclude default rule
      .map((rule) => ({
        id: rule.modelPattern,
        object: 'model',
        created: Math.floor(rule.createdAt.getTime() / 1000),
        owned_by: 'cdk-gateway',
      }));

    res.json({ object: 'list', data: pricedModels });
  } catch {
    res.json({ object: 'list', data: [] });
  }
});

export default router;
