import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from './config';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');

  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
