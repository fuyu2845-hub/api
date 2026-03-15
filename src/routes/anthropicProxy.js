import { Router } from 'express';
import config from '../config.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';
import { recordUsage } from '../services/quota.js';

const router = Router();

// POST /v1/messages - Anthropic-compatible proxy
router.post('/messages', apiKeyAuth, async (req, res) => {
  const apiKeyRecord = req.apiKeyRecord;
  const isStream = req.body.stream === true;

  try {
    const upstreamUrl = `${config.claudeProxy.baseUrl}/v1/messages`;

    // Forward with upstream auth headers
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeProxy.apiKey,
      'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
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
      if (data.usage) {
        const model = data.model || req.body.model || 'unknown';
        const usage = data.usage;
        // Sum all input tokens (including cache tokens)
        const totalInput = (usage.input_tokens || 0) +
          (usage.cache_read_input_tokens || 0) +
          (usage.cache_creation_input_tokens || 0);
        recordUsage(
          apiKeyRecord.id,
          model,
          totalInput,
          usage.output_tokens || 0,
          'anthropic'
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

        // Parse SSE events for Anthropic format
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            // message_start contains initial input token count
            if (parsed.type === 'message_start' && parsed.message?.usage) {
              const usage = parsed.message.usage;
              // Sum all input tokens (including cache read tokens)
              totalInputTokens = (usage.input_tokens || 0) +
                (usage.cache_read_input_tokens || 0) +
                (usage.cache_creation_input_tokens || 0);
              if (parsed.message.model) modelName = parsed.message.model;
            }
            // message_delta contains output token count
            if (parsed.type === 'message_delta' && parsed.usage) {
              totalOutputTokens = parsed.usage.output_tokens || 0;
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

    if (totalInputTokens > 0 || totalOutputTokens > 0) {
      recordUsage(
        apiKeyRecord.id,
        modelName,
        totalInputTokens,
        totalOutputTokens,
        'anthropic'
      ).catch((err) => console.error('Usage recording error:', err));
    }
  } catch (err) {
    console.error('Anthropic proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: '上游服务请求失败' });
    }
  }
});

export default router;
