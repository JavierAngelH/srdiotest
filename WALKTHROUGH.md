# Walkthrough (what we shipped & why)

Session clock: ~12:14–13:05 local on 2026-10-31 (must-have E2E). Leftover-time pass ~13:14–13:30 on `fix/follow-up-cleanup`. Built with AI assistance; milestones match `git log`.

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
7. Leftover time: Copilot draft actually fills `/zaps/new`, cookie-only session (no JWT in the query string), Angular `authGuard`, tests for signature + template + NL parse

## Notable decisions

- Prefer **repo webhook + user OAuth token** over a GitHub App (faster for the demo).
- Match Zaps by **PR author login** = signed-in user (demo: you open the PR).
- Angular kept thin; server owns OAuth, CRUD, verify, and GitHub API calls.
- Local webhook reachability via **ngrok** (cloudflared also documented).

## E2E proof

Webhook on `JavierAngelH/pdf-transfer-agent` → [PR #1](https://github.com/JavierAngelH/pdf-transfer-agent/pull/1) received the configured comment; delivery HTTP 200.

## Leftover-time pass (what I noticed after E2E)

After the live PR comment worked I still had time on the honor-system clock, so I fixed issues I found walking the Copilot and auth paths — not a second product:

- Copilot wrote `sessionStorage` then navigated to `/zaps/new`, but the editor only applied the draft when `paramMap.id === 'new'`. That route has no `:id`, so the form stayed on defaults.
- OAuth redirected to `/?token=...` *and* set an httpOnly cookie *and* Angular stored the JWT in `localStorage`. Query tokens leak via history/logs. Session is cookie-only now; `/api/me` with credentials is the source of truth.
- Create/edit/Copilot used `ngOnInit` auth checks. Those routes now use an Angular `canActivate` guard.
- Added a few server tests around webhook HMAC, `{{sender}}` templates, and Copilot parse — the first things I would have wanted if the live comment had failed.

## Known limitations (not fixed on purpose)

- GitHub **user OAuth tokens sit in Mongo in plaintext**. Fine for this demo; production would encrypt at rest or switch to a GitHub App installation token so we are not storing a user's `repo` scope forever.
- Zaps match the **PR author**, not “any PR on a repo I connected.” Demo: you open the PR. Next: repo picker / GitHub App.
- Stub apps are UI-only; no executor.
