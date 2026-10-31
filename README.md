# srdiotest — tiny Zapier-style workflows (MEAN + TypeScript)

**Clock notes:** Started: 2026-10-31 ~12:14 local · Stopped: _(fill when done)_

Small workflow automation demo on MongoDB, Express, Angular, and Node (TypeScript everywhere). Sign in with GitHub, own Zaps, run one real path: **GitHub PR opened → comment on that PR**.

## Prerequisites

- Node.js 20+
- MongoDB running locally
- GitHub OAuth App
- Cloudflare Tunnel (`cloudflared`) for webhooks

## Env vars

Copy `.env.example` → `.env` (loaded from repo root or `server/.env`):

- `MONGODB_URI`
- `PORT` / `CLIENT_URL`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`

## How to run

```bash
cd server && npm install && npm run dev
cd client && npm install && npm start
```

More OAuth / webhook / demo steps will land as milestones land.
