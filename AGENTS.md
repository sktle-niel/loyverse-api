# Loyverse API — Frontend Context for AI Agents

**Business:** Two Wheels Zone — motor parts & lubricants. Internal back-office UI (inventory, approvals, branch transfers, audit) backed by Loyverse POS via a backend proxy.

**Stack:** React 19 · TypeScript · Vite 8 · Tailwind 4 · DaisyUI · **React Router 7** · PWA (`vite-plugin-pwa`).

> ⚠️ **Docs reconciled with code on 2026-06-10.** Active branch: `design-phase`.

---

## Auth (required)

- `AuthProvider` (`context/AuthContext`) + `AppGate` (`components/AppGate`) — show **Login** until authenticated.
- `localStorage`: access token (`auth.token`), refresh token, and user (`utils/authStorage.ts`).
- All API calls send `Authorization: Bearer <token>`.
- On `401`, the client tries `POST /auth/refresh` once (deduped); if that fails it clears the session and
  fires an `auth:session-expired` event.
- Login: `POST /api/auth/login` with `{ login | username, password }`.

**Roles**
- **admin:** Dashboard (audit), Inventory, Approvals, History, Operators.
- **operator:** Inventory, Queue, Pending, Transfer (+ Transfer History, shared).

---

## Architecture

```
[React frontend]  VITE_API_BASE_URL →  [loyverse-api-backend]  →  Loyverse API + MySQL
```

Frontend **never** holds the Loyverse token. All Loyverse access is server-side.

---

## Routing (`layouts/MainLayout.tsx`, paths in `constants/app.ts`)

Uses React Router (`Routes`/`Route`/`Navigate`). Role-gated redirects live in `MainLayout`.

| Path | Page | Access |
|------|------|--------|
| `/dashboard` | `Dashboard.tsx` (audit trail) | admin |
| `/inventory` | `Inventory.tsx` (stock editor) | both |
| `/approvals` | `AdminApprovals.tsx` (stock-request queue; Transfers tab **disabled**) | admin |
| `/history` | `History.tsx` | admin |
| `/operators` | `AdminOperators.tsx` | admin |
| `/queue` | `OperatorQueue.tsx` | operator |
| `/pending` | `PendingRequests.tsx` | operator |
| `/transfer` | `Transfer.tsx` (branch-to-branch) | operator |
| `/transfer-history` | `TransferHistory.tsx` | both |
| `/` and `*` | redirect → `/dashboard` (admin) or `/inventory` (operator) | — |

---

## Two stock flows (must match backend)

**1. Stock change — REQUIRES admin approval**
1. `useProducts()` → `GET /api/products` (products + `stores[]`).
2. Operator edits stock → `PATCH /api/products/:itemId/stock` `{ storeId, stock, requestedBy }` → **202 pending** (Loyverse not touched).
3. `useStockRequests()` / `useMyStockRequests()` → `GET /api/stock-requests[?status=]` / `/stock-requests/mine`.
4. Admin approve → `POST /api/stock-requests/:id/approve` → Loyverse updated + audit.
5. Reject → `POST /api/stock-requests/:id/reject`; Cancel → `POST /api/stock-requests/:id/cancel`.

**2. Transfer — NO approval (direct mode)**
- `Transfer.tsx` → `useTransferRequests()` → `POST /api/transfer-requests` → backend **executes in Loyverse immediately**. UI toast: *"Transfer done. Stock updated in Loyverse."*
- Because of this, the **Transfers tab in `AdminApprovals` is labeled "disabled"** — transfers never sit in a pending queue in production.
- Transfer stock data comes from `useStockLevels()` → `GET /api/stocks` (cached sync engine with progress/ETA; `/stocks/stop` + `/stocks/resume` control the background sync).

---

## API client (`src/api/client.ts`)

- `getApiBaseUrl()` — **dev:** `/api` (Vite proxy, no CORS). **prod:** `VITE_API_BASE_URL` (auto-appends `/api`).
- `apiFetchJson` (GET), `apiPatchJson` (PATCH), `apiPostJson` (POST) — all add the Bearer header, enforce a 15s timeout, refresh-on-401, and surface backend `{ message | error }`.
- Types in `src/api/types.ts` — `Product`, `StoreInfo`, `StockChangeRequest`, `TransferRequest`, etc.

---

## Hooks (`src/hooks/`)

`useProducts` · `useProductSearch` · `useStores` · `useStockRequests` · `useMyStockRequests` ·
`useStockLevels` · `useTransferRequests` · `useAudit` · `useAuditFilters` · `useOperators` ·
`useLoginForm` · `usePushNotifications` · `useTheme`.

---

## Push notifications (PWA)

`usePushNotifications` + `NotificationBell` subscribe via the backend `/api/push/*` endpoints
(VAPID). Admins get a browser notification on new stock/transfer requests. Requires the service
worker (PWA build) and backend VAPID keys.

---

## UI conventions

- Page shell: `min-h-screen bg-base-200 p-3 sm:p-4 md:p-8`
- Cards: `card bg-base-100 shadow border border-base-200`
- Tables: `table text-sm`, thead `bg-base-200`
- Theme toggle via `useTheme` + `ThemeToggleButton`; toasts via `ToastContext` / `ToastLayer`.

---

## Do NOT

- Put Loyverse secrets in `VITE_*` env vars.
- Call Loyverse directly from the frontend.
- Re-enable a transfer-approval UI without coordinating with the backend (`transferRequestService` is in direct mode).

---

## Backend repo

`loyverse-api-backend` — see its `AGENTS.md` for the full route table, the stock-levels sync engine, and MySQL setup.
