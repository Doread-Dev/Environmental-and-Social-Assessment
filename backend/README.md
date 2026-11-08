# ESMS backend

Node.js 26 + Express 4 + Mongoose 8 REST API under `/api/v1` (CommonJS, JWT auth, Joi validation).
In production it also serves the built frontend on the same origin.

```bash
npm ci
npm run seed
node scripts/create-admin.js
npm run dev
```

Settings (`backend/.env`), commands and tests: [developer guide](../docs/developer-guide.md).
Architecture: [docs/architecture.md](../docs/architecture.md). Endpoints:
[docs/api-reference.md](../docs/api-reference.md). Server install and backups:
[deploy/README.md](../deploy/README.md).
