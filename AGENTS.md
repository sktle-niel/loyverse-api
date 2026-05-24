# Loyverse API — Project Context for AI Agents

**Business:** Two Wheels Zone — motor parts & lubricants shop. Internal **inventory system UI** (auditing/stock tracking) tied to Loyverse POS (API integration planned; UI uses mock data today).

**Stack:** React + TypeScript + Vite + Tailwind CSS + DaisyUI. Navigation is **local state** inside `MainLayout` (no React Router).

---

## Current navigation / flow (system context)

`src/layouts/MainLayout.tsx` owns page switching with a `currentPage` value (e.g. `dashboard | reports | settings`). `src/components/Sidebar.tsx` calls `onPageChangeCallback(id)`.

### Audit Trail (legacy)
- `src/pages/Dashboard.tsx` (audit table + filters)
- `src/components/AuditTable.tsx` (renders audit records; includes Branch column)
- `src/components/AuditFilters.tsx` (filters card)
- `src/hooks/useAuditFilters.ts` (filter logic)

**Important:** Audit API calls are currently disabled; the UI works with mock/empty state.

### Reports / Inventory (legacy)
- `src/pages/Reports.tsx` currently uses empty/mock state.

---

## Audit Trail: filter behavior (what’s implemented)

`AuditFilters` supports:
- **Search** (itemName/adminName)
- **Branch** dropdown (filters by `record.branchId`)
- **Movement** dropdown:
  - `all`
  - `decrease` => `record.changeAmount < 0`
  - `increase` => `record.changeAmount > 0`
- **Clear Filters** button

`useAuditFilters` owns the actual filtering.

---

## Repository layout

```
src/
  App.tsx                   → renders MainLayout only
  layouts/MainLayout.tsx    → sidebar, theme toggle, page switch
  pages/
    Dashboard.tsx           → audit trail page (mock/empty)
    Reports.tsx             → inventory status page (mock/empty)
  components/
    AuditTable.tsx         → table UI (pagination, responsive)
    AuditFilters.tsx       → search + branch + movement filters
    AuditDashboard.tsx     → alternate/legacy dashboard component
    Sidebar.tsx            → navigation
    Login.tsx*, LoginCard*, Form* → exists but not mounted in the main flow
  hooks/
    useAuditFilters.ts
    useTheme.ts
  constants/
    productConstants.ts
    loginConstants.ts
  styles/
    sidebar.css
  index.css
```

---

## UI conventions (follow these when adding/rewriting UI)

- Page shell: `min-h-screen bg-base-200 p-3 sm:p-4 md:p-8`
- Center content: `max-w-7xl mx-auto`
- Card: `card bg-base-100 shadow border border-base-200`
- Forms/filters: `form-control`, `label`, `input input-bordered`, `select select-bordered`
- Table: `table text-sm`, thead `bg-base-200`, rows `border-b border-base-200 hover:bg-base-200/30` (use DaisyUI tokens)
- Pagination: follow the pattern in `AuditTable.tsx`.

---

## Data & API status

- **No active Loyverse API calls in the current UI**.
- `src/api/client.ts` exists but pages should not call it until the new flow is ready.
- When the new flow is implemented (Products list + editable stock per branch/employee), start with:
  1) **Dummy data only**
  2) UI rendering + interactions
  3) Later: replace dummy data with Loyverse API via hooks/services

---

## What NOT to do

- Do not reintroduce API calls while we are still revising UI flow.
- Do not add React Router.
- Do not move mock sources between pages without a refactor decision.
- Avoid new dependencies unless required.

---

## Typical tasks map

| User asks for… | Start here |
|----------------|------------|
| Audit table / filters updates | `Dashboard.tsx`, `AuditFilters.tsx`, `AuditTable.tsx`, `useAuditFilters.ts` |
| Inventory/products UI (new flow) | create new page/component under `src/pages/` and dummy data module under `src/data/` |
| New page in navigation | `MainLayout.tsx`, `Sidebar.tsx` |
| Theming | `useTheme.ts`, `ThemeToggleButton.tsx`, `index.css` |
| Loyverse integration | `src/api/` + new hooks like `useProducts`, `useStockUpdate` |

---

## Updating this file

Update `AGENTS.md` whenever architecture/conventions change so future agents stay aligned.

