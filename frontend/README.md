# ESMS frontend

React 19 + Vite 7 + React Router 7 + TanStack Query 5 + Tailwind CSS 4 single-page app (plain JSX).

```bash
npm ci
npm run dev
```

The dev server runs on http://localhost:5173 and calls the backend on
http://localhost:3000/api/v1 unless `VITE_API_URL` is set.

Commands and tests: [developer guide](../docs/developer-guide.md). Architecture (data layer,
guards, screens, Excel export): [docs/architecture.md](../docs/architecture.md#frontend). UI rules:
[docs/style-guide.md](../docs/style-guide.md).
