# Phase 11 — Offline & server deployment

**Goal:** the app runs on one internal server with no internet. Vercel is dropped here.

**Decisions:** D6, D37, D38 (+ D47 backups, D64 viewer, D65 critical-actions log).

## Offline (D37)
- Self-host the Material Symbols icons (e.g. the `material-symbols` npm package); remove the last Google Fonts `@import` in `index.css` and drop the Material Symbols exception in `src/test/fonts.test.js`. The text font (IBM Plex Sans + Arabic) is already self-hosted since phase 10 (D72).
- Replace remote images (`LoginPage.jsx` if still there) with local assets. (`ProjectContextCard.jsx`'s map was removed in phase 10.)
- Phase 10 (D72): the text font is offline already; only the icons are left.
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
- Daily `mongodump` (includes the audit log) + copy of `UPLOADS_DIR` (project files and `library/`), retention N days, restore procedure tested once (script in `deploy/`).

## Atomic bulk saves (owner, phase 4)
- Run MongoDB as a **single-node replica set** on the server (`replication.replSetName: rs0` in `mongod.cfg` + `rs.initiate()` once; connection string with `replicaSet=rs0`). Document it in `deploy/`.
- Put each critical action and its audit entry (D65) in the same transaction, so it never happens without its entry; keep the purge entry written first.
- Then wrap the phase 4 bulk saves (`utils/replaceProjectRows.js`, `upsertForProject` in `monitoring.service.js`) in a transaction when the connection supports one, and keep today's path (validate everything, then one `bulkWrite`) as the fallback. Test both (CI needs a replica-set MongoDB for the transaction path).

## Security for production
- Helmet CSP must allow the in-app PDF viewer (D64): it shows the PDF in an `iframe` on a `blob:` URL (`components/files/PdfViewer.jsx`), so `frame-src blob:` (and `object-src blob:` only if the viewer ever moves to `<object>`), nothing wider. Test it in the production build.
- `NODE_ENV=production` checks: strong `JWT_SECRET`, no dev scripts, `clean-test-data` refused, helmet CSP that works with self-hosted assets.
- `npm audit --omit=dev` in both apps: no high/critical findings; anything moderate left is listed with a reason in this file.
- Server runs the Node LTS pinned in `.nvmrc` (26 as of phase 0); check it is still the current LTS and bump if a newer LTS line exists.
- Upgrade `express-rate-limit` to 8.x (D63 d) and use its `ipKeyGenerator` for the IP fallback key in `middlewares/rateLimiter.js` (IPv6 addresses grouped by subnet); keep the per-user key for signed-in requests. Test both keys, including an IPv6 address.

## Tests
- Offline: `src/test/fonts.test.js` with the Material Symbols exception removed (no `fonts.googleapis.com` / `fonts.gstatic.com` anywhere); a test that `index.html`, the CSS and the source load no other remote URL (no `googleusercontent`, no CDN); `@vercel/speed-insights` gone from `package.json` and `main.jsx`.
- Single process: Express serves `frontend/dist`; a non-`/api` GET returns `index.html` (no-cache); hashed assets get the long cache header; `/api/v1/*` and `/health` are unchanged; an unknown `/api/v1` path is still 401/404, never `index.html`.
- CORS only when `FRONTEND_URL` is set (one test with, one without).
- Production checks: the server refuses to start with a short `JWT_SECRET`; `clean-test-data` and the demo seed refuse `NODE_ENV=production`; the CSP header contains `frame-src blob:` and nothing wider.
- Rate limiter (`express-rate-limit` 8.x): per-user key for a valid token; IP key via `ipKeyGenerator`, with two IPv6 addresses of the same subnet sharing one bucket.
- Transactions: on a replica-set connection a failing bulk save (and a critical action whose audit entry fails) writes nothing; on a standalone connection the existing path still works (CI job with a replica-set MongoDB).
- Backup script: a dump + uploads copy restores into an empty database with the same counts (scripted test in `deploy/`, run once and recorded here).

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] A clean machine with only Node + MongoDB can install and run the app from the docs, offline.
- [ ] Backup and restore tested.
- [ ] `CLAUDE.md` deployment section rewritten.

## Found during phase
- **MongoDB 8 vs Linux kernel (found while adding CI, 2026-11-03):** MongoDB 8.x refuses to start on Linux kernels 6.19 to 7.0.13 (tcmalloc/rseq bug, SERVER-121912; startup check changed in 8.0.30 / 8.3.9 by SERVER-125742). The GitHub runners (ubuntu-24.04 and 26.04) hit it, so CI uses `mongo:7.0` for now. When choosing the server OS/kernel and MongoDB version here, check this matrix first (kernel < 6.19 or a fixed kernel, MongoDB ≥ 8.0.30 / 8.3.9).
