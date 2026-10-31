# Walkthrough (what we shipped & why)

Session clock: ~12:14–12:54 local on 2026-10-31. Built with AI assistance; milestones match `git log` on `feature/zap-mvp`.

## Product shape

- **User** signs in with GitHub OAuth; we store `githubId`, `login`, and `accessToken`.
- **Zap** = `{ name, enabled, trigger, action(+mapping) }`, scoped to `userId`.
- **Must-have path:** GitHub webhook `pull_request` + `opened` → find enabled GitHub→comment Zaps for the PR author → `POST .../issues/{n}/comments` with mapped body (`{{sender}}`, etc.).
- **Stub apps** (Slack, Linear, Jira, Notion) appear in the picker but have no executor.
- **Copilot (bonus):** `POST /api/copilot/draft` (rule-based; optional OpenAI) → same Zap shape → create form → user enables.

## Milestone order (also the commit story)

1. Scaffold MEAN+TS monorepo (`server/`, `client/`, `.env.example`, README)
2. GitHub OAuth + JWT + `/api/me`
3. Zap CRUD API + Angular list/editor/toggle + app picker
4. Webhook signature verify + PR comment action
5. Copilot draft endpoint/UI
6. Docs (OAuth, ngrok/tunnel, demo) + E2E proof on a real PR

## Notable decisions

- Prefer **repo webhook + user OAuth token** over a GitHub App (faster for the demo).
- Match Zaps by **PR author login** = signed-in user (demo: you open the PR).
- Angular kept thin; server owns OAuth, CRUD, verify, and GitHub API calls.
- Local webhook reachability via **ngrok** (cloudflared also documented).

## E2E proof

Webhook on `JavierAngelH/pdf-transfer-agent` → [PR #1](https://github.com/JavierAngelH/pdf-transfer-agent/pull/1) received the configured comment; delivery HTTP 200.
