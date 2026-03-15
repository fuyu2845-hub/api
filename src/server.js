import config from './config.js';
import app from './app.js';

app.listen(config.port, () => {
  console.log(`CDK Gateway running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
