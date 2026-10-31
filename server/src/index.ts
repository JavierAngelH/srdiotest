import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from './config';
import authRoutes, { meHandler } from './routes/auth';
import { requireAuth } from './middleware/auth';
import zapRoutes from './routes/zaps';
import webhookRoutes from './routes/webhooks';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');

  const app = express();

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());

  // Capture raw body for GitHub webhook signature verification
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.get('/api/me', requireAuth, meHandler);
  app.use('/api/zaps', zapRoutes);
  app.use('/webhooks', webhookRoutes);

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
