# Loyverse API — Project Context for AI Agents

**Business:** Two Wheels Zone — motor parts & lubricants. Internal inventory UI + audit trail via Loyverse (backend proxy).

**Stack:** React + TypeScript + Vite + Tailwind 4 + DaisyUI. Navigation in `MainLayout` state (no React Router).

---

## Architecture

```
[React frontend]  VITE_API_BASE_URL →  [loyverse-api-backend]
                                              ↓
                                         Loyverse API
                                         MySQL (pending requests)
```

Frontend never holds Loyverse token.

---

## Navigation

| Sidebar id | Page | File |
|------------|------|------|
| `dashboard` | Audit Trail | `Dashboard.tsx` |
| `reports` | Inventory | `Inventory.tsx` |
| `settings` | Placeholder | `MainLayout.tsx` |

---

## Inventory flow (wired)

1. `useProducts()` → `GET /api/products` (products + `stores[]` from Loyverse)
2. Staff edits stock → `PATCH /api/products/:itemId/stock` with `{ updates: [{ storeId, stock }], requestedBy }` → **202 pending** (not Loyverse yet)
3. `useStockRequests()` → `GET /api/stock-requests?status=pending`
4. Approve → `POST /api/stock-requests/:id/approve` with `{ reviewedBy }` → Loyverse updated
5. Reject → `POST /api/stock-requests/:id/reject`

Approval queue UI is a tab inside `Inventory.tsx` (admin website can use same API later).

---

## API client

- `src/api/client.ts` — **dev:** always `/api` (Vite proxy, no CORS). **production:** `VITE_API_BASE_URL`
- `src/api/types.ts` — `Product`, `StoreInfo`, `StockChangeRequest`, etc.

---

## Key files

```
src/
  pages/Inventory.tsx      # stock editor + approval tab
  pages/Dashboard.tsx      # audit (useAudit)
  hooks/useProducts.ts
  hooks/useStockRequests.ts
  hooks/useAudit.ts
  api/client.ts
  api/types.ts
```

---

## UI conventions

- Page shell: `min-h-screen bg-base-200 p-3 sm:p-4 md:p-8`
- Cards: `card bg-base-100 shadow border border-base-200`
- Tables: `table text-sm`, thead `bg-base-200`

---

## Do NOT

- Put Loyverse secrets in `VITE_*` env vars
- Add React Router unless asked
- Call Loyverse directly from the frontend

---

## Backend repo

`loyverse-api-backend` — see its `AGENTS.md` for routes and MySQL setup.
