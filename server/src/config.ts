import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srdiotest',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  /** Google AI Studio key (https://aistudio.google.com/apikey) — preferred Copilot LLM */
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
};
