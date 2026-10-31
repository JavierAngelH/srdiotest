# srdiotest — tiny Zapier-style workflows (MEAN + TypeScript)

**Clock notes:** Started: 2026-10-31 ~12:14 local · Stopped: _(fill when done)_

Small workflow automation demo: sign in with GitHub, create Zaps owned by you, and run one real path — **GitHub PR opened → comment on that PR**. Other apps in the picker are stubs. Built for a ~4 hour take-home; prefer a working demo over polish.

## Prerequisites

- Node.js 20+ (22/26 may warn on Angular CLI but work for this demo)
- MongoDB running locally (`mongod`)
- A GitHub OAuth App (see below)
- Cloudflare Tunnel (`cloudflared`) for webhook reachability — preferred over ngrok  
  `brew install cloudflare/cloudflare/cloudflared`

## Env vars

Copy `.env.example` → `.env` at the **repo root** (the server loads root `.env` then `server/.env`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string (default `mongodb://127.0.0.1:27017/srdiotest`) |
| `PORT` | Express port (default `3000`) |
| `CLIENT_URL` | Angular origin (default `http://localhost:4200`) |
| `JWT_SECRET` | Signs session JWTs |
| `GITHUB_CLIENT_ID` | OAuth App client id |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret |
| `GITHUB_WEBHOOK_SECRET` | Shared secret for `X-Hub-Signature-256` |
| `OPENAI_API_KEY` | Optional; Copilot uses rule-based parse without it |

## How to run

```bash
# Terminal 1 — API
cd server && npm install && npm run dev

# Terminal 2 — UI
cd client && npm install && npm start
```

Open http://localhost:4200 — Sign in with GitHub.

## GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Application name:** `srdiotest` (or anything)
3. **Homepage URL:** `http://localhost:4200`
4. **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
5. Paste **Client ID** / **Client Secret** into `.env`

Scopes requested at runtime: `read:user`, `repo` (needed to comment on PRs you control).

## Tunnel + repo webhook

```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the printed `https://….trycloudflare.com` URL (do not commit it).

On a **repo you control**: Settings → Webhooks → Add webhook

- **Payload URL:** `https://YOUR-TUNNEL/webhooks/github`
- **Content type:** `application/json`
- **Secret:** same value as `GITHUB_WEBHOOK_SECRET`
- **Which events:** Let me select individual events → **Pull requests**
- Save; confirm the ping delivery is green (HTTP 200)

## Demo the must-have Zap

1. Sign in with GitHub in the UI
2. **New Zap** (or use **Copilot**):  
   - Trigger: GitHub → Pull request opened  
   - Action: GitHub → Create issue/PR comment  
   - Body e.g. `Thanks @{{sender}} — looking at this PR.`
3. Toggle the Zap **On**
4. Open a **real PR** on the webhook-configured repo **as the same GitHub user** you signed in with (Zaps match the PR author)
5. Confirm the comment appears on the PR

## Stubbed vs real

| Piece | Status |
|---|---|
| GitHub OAuth | Real |
| Zap CRUD (list/create/edit/toggle) | Real |
| GitHub PR opened → comment | Real |
| Slack / Linear / Jira / Notion in picker | Stub (UI only; saved config will not execute) |
| Copilot (NL → Zap draft) | Real draft path (rule-based; optional OpenAI) — execution unchanged |

## Copilot

`/copilot` (or API `POST /api/copilot/draft`) turns a sentence like “When a PR is opened, comment thanks” into the same Zap shape. You land on the create form, review, then enable. Without `OPENAI_API_KEY`, parsing is rule-based.
