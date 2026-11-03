# Phase 11 — Offline & server deployment

**Goal:** the app runs on one internal server with no internet. Vercel is dropped here.

**Decisions:** D6, D37, D38 (+ D47 backups).

## Offline (D37)
- Self-host Inter and Material Symbols (font files in the repo or via npm packages like `@fontsource/inter` / `material-symbols`); remove the Google Fonts `@import`s in `index.css` and any `<link>` in `index.html`.
- Replace remote images (`googleusercontent` in `ProjectContextCard.jsx`, `LoginPage.jsx` if still there) with local assets.
- Remove `@vercel/speed-insights` (`main.jsx`, `package.json`) and `vercel.json`.
- Verify: run with the network cable / adapter off — no failed requests in DevTools.

## Single process (D38)
- Express serves `frontend/dist` with SPA fallback (non-`/api` GET → `index.html`), correct cache headers (hashed assets long-cache, `index.html` no-cache).
- Same origin → `VITE_API_URL` defaults to `/api/v1`; CORS only when `FRONTEND_URL` is set.
- One `npm run build` at the root or a documented two-step build; one start command.
- HTTPS: either Node with cert/key paths from env, or IIS/nginx in front with `TRUST_PROXY=1` (D6). Document both.
- Service: Windows (NSSM) and Linux (systemd) instructions + example config files in `deploy/`.
- Health check and log location documented.

## Backups
- Daily `mongodump` + copy of `UPLOADS_DIR`, retention N days, restore procedure tested once (script in `deploy/`).

## Security for production
- `NODE_ENV=production` checks: strong `JWT_SECRET`, no dev scripts, `clean-test-data` refused, helmet CSP that works with self-hosted assets.
- `npm audit --omit=dev` in both apps: no high/critical findings; anything moderate left is listed with a reason in this file.
- Server runs the Node LTS pinned in `.nvmrc` (26 as of phase 0); check it is still the current LTS and bump if a newer LTS line exists.

## Done when
- [ ] A clean machine with only Node + MongoDB can install and run the app from the docs, offline.
- [ ] Backup and restore tested.
- [ ] `CLAUDE.md` deployment section rewritten.

## Found during phase
- **MongoDB 8 vs Linux kernel (found while adding CI, 2026-11-03):** MongoDB 8.x refuses to start on Linux kernels 6.19 to 7.0.13 (tcmalloc/rseq bug, SERVER-121912; startup check changed in 8.0.30 / 8.3.9 by SERVER-125742). The GitHub runners (ubuntu-24.04 and 26.04) hit it, so CI uses `mongo:7.0` for now. When choosing the server OS/kernel and MongoDB version here, check this matrix first (kernel < 6.19 or a fixed kernel, MongoDB ≥ 8.0.30 / 8.3.9).
