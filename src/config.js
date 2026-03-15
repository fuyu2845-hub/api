import 'dotenv/config';

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  cliproxy: {
    baseUrl: process.env.CLIPROXY_BASE_URL || 'http://localhost:8080',
    apiKey: process.env.CLIPROXY_API_KEY || '',
  },
  claudeProxy: {
    baseUrl: process.env.CLAUDE_PROXY_BASE_URL || 'http://localhost:8081',
    apiKey: process.env.CLAUDE_PROXY_API_KEY || '',
  },
  defaultInputPrice: parseFloat(process.env.DEFAULT_INPUT_PRICE || '3.0'),
  defaultOutputPrice: parseFloat(process.env.DEFAULT_OUTPUT_PRICE || '15.0'),
};
