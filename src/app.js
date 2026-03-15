import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import adminAuth from './middleware/adminAuth.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import adminCdkRoutes from './routes/adminCdks.js';
import adminPricingRoutes from './routes/adminPricing.js';
import adminKeyRoutes from './routes/adminKeys.js';
import adminStatsRoutes from './routes/adminStats.js';
import userRoutes from './routes/user.js';
import openaiProxyRoutes from './routes/openaiProxy.js';
import anthropicProxyRoutes from './routes/anthropicProxy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/admin', authRoutes);
app.use('/api/admin/cdks', adminAuth, adminCdkRoutes);
app.use('/api/admin/pricing', adminAuth, adminPricingRoutes);
app.use('/api/admin/apikeys', adminAuth, adminKeyRoutes);
app.use('/api/admin/stats', adminAuth, adminStatsRoutes);
app.use('/api', userRoutes);

// Proxy routes (OpenAI & Anthropic compatible)
app.use('/v1', openaiProxyRoutes);
app.use('/v1', anthropicProxyRoutes);

// Serve static frontend in production
const clientDist = join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
    return next();
  }
  res.sendFile(join(clientDist, 'index.html'));
});

app.use(errorHandler);

export default app;
