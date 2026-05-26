# Two Wheels Zone — Inventory UI

React + Vite frontend for inventory stock editing and audit trail. Talks to **loyverse-api-backend** (Fastify + Loyverse + MySQL).

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

Open http://localhost:5173 (or the port Vite prints).

## Environment

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_API_BASE_URL` | `https://loyverse-api-backend-2.onrender.com/api` | Must end with `/api` |

**Local dev:** `npm run dev` always calls `/api` on the same origin; Vite proxies to Render (see `vite.config.ts`). You do **not** need `VITE_API_BASE_URL` in `.env` for dev — avoids CORS.

**Production build:** set `VITE_API_BASE_URL=https://your-backend.onrender.com/api` before `npm run build`.

## Main pages

| Page | Route (in-app) | API |
|------|----------------|-----|
| Audit Trail | Dashboard | `GET /api/audit` |
| Inventory | Reports (sidebar) | `GET /api/products`, `PATCH /api/products/:id/stock` |
| Approval queue | Inventory tab | `GET /api/stock-requests?status=pending`, approve/reject |

## Stock change flow

1. Staff edits stock → **Submit for approval** (`PATCH` → pending in MySQL)
2. Admin opens **Approval Queue** tab → Approve or Reject
3. On approve → backend updates Loyverse; audit appears on Dashboard

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

## Backend repo

Separate project: `loyverse-api-backend` — deploy on Render/Hostinger with `LOYVERSE_ACCESS_TOKEN` and `MYSQL_*`.
