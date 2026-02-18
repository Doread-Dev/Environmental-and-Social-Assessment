# Environmental and Social Assessment (ESMS)

> A two-app system for managing environmental and social assessments of development projects — React frontend and Express/MongoDB backend.

## Overview

**Why this project exists.** Development projects often need structured environmental and social due diligence: screening, assessment, SEMP (Social and Environmental Management Plan), and monitoring. Doing this in spreadsheets or ad-hoc tools is error-prone and hard to audit. This project provides a single, auditable workflow from screening through monitoring, with role-based access and document storage.

**What it is.** The **Environmental and Social Management System (ESMS)** is one product from a user’s perspective: you log in, work with projects, run screenings and assessments, maintain SEMPs and monitoring, and attach annex files. Under the hood it is **two applications**: a **frontend** (React 19, Vite 7, Tailwind CSS, React Router 7) and a **backend** (Node.js, Express, MongoDB, Mongoose, JWT). The frontend talks to the backend REST API; the backend handles auth, business logic, and persistence. It is **not** a generic project-management tool — it is focused on the ESMS workflow (screening → assessment → SEMP → monitoring) and related lookups, users, and attachments.

## Quick Start

1. **Prerequisites:** Node.js (LTS), MongoDB running locally or a connection string.
2. **Backend:** From the repo root, go to the backend, install deps, set env, and run:
   ```bash
   cd backend && npm install
   ```
   Create a `.env` (see [Environment setup](#environment-setup) and [backend/README.md](backend/README.md)). Then:
   ```bash
   npm run dev
   ```
3. **Frontend:** In another terminal, from the repo root:
   ```bash
   cd frontend && npm install && npm run dev
   ```
4. Open the URL shown by Vite (e.g. `http://localhost:5173`) and sign in. The frontend is configured to call the backend API (typically `http://localhost:3000` or the URL in `frontend` env).

For backend seed data (users, lookups), see [backend/README.md](backend/README.md) and backend docs (e.g. configuration and seed).

## Documentation

| Area | Where to go |
|------|-------------|
| **Frontend** — setup, scripts, tech stack | [frontend/README.md](frontend/README.md) |
| **Frontend** — architecture, routing, state, API, components, hooks, features | [frontend/docs/](frontend/docs/) (e.g. [ARCHITECTURE.md](frontend/docs/ARCHITECTURE.md), [SERVICES_AND_API.md](frontend/docs/SERVICES_AND_API.md), [FEATURES.md](frontend/docs/FEATURES.md)) |
| **Backend** — setup, scripts, env vars | [backend/README.md](backend/README.md) |
| **Backend** — architecture, API reference, models, auth, middlewares, config | [backend/docs/](backend/docs/) (e.g. [ARCHITECTURE.md](backend/docs/ARCHITECTURE.md), [API_REFERENCE.md](backend/docs/API_REFERENCE.md), [CONFIGURATION_AND_DEPLOYMENT.md](backend/docs/CONFIGURATION_AND_DEPLOYMENT.md)) |

## Environment Setup

- **Node:** Use an LTS version. Both `frontend` and `backend` have their own `package.json`; install in each folder with `npm install`.
- **MongoDB:** Required for the backend. Run MongoDB locally or use a cloud instance and set the connection string in the backend `.env`.
- **Backend `.env`:** In `backend/`, define at least the MongoDB URL, JWT secret, and any port/CORS/origin you need. All supported variables and production notes are in [backend/README.md](backend/README.md) and [backend/docs/CONFIGURATION_AND_DEPLOYMENT.md](backend/docs/CONFIGURATION_AND_DEPLOYMENT.md).
- **Frontend API base URL:** The frontend uses an API base URL (often via env or config) to call the backend. Point it to your backend (e.g. `http://localhost:3000` in development). Details in [frontend/README.md](frontend/README.md) and [frontend/docs/SERVICES_AND_API.md](frontend/docs/SERVICES_AND_API.md).

After cloning, run `npm install` in both `frontend` and `backend`, configure the backend `.env`, then start backend and frontend as in [Quick Start](#quick-start).
