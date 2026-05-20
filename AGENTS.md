# Loyverse API — Project Context for AI Agents

**Business:** Two Wheels Zone — motor parts & lubricants shop. Internal **audit / inventory dashboard** tied to Loyverse POS (API integration planned; UI uses mock data today).

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + DaisyUI 5. No router library — page switching is local state in `MainLayout`.

---

## Repository layout

```
src/
  App.tsx                 → renders MainLayout only
  layouts/MainLayout.tsx  → sidebar, theme toggle, page switch (dashboard | reports | settings)
  pages/
    Dashboard.tsx         → audit trail page; exports MOCK_AUDIT_RECORDS
    Reports.tsx           → inventory status by stock level (tabs + table)
  components/
    AuditTable.tsx        → shared table UI + pagination (15/page)
    AuditFilters.tsx      → search, item, date filters (card layout)
    Sidebar.tsx           → nav: dashboard, reports, settings
    Login.tsx, LoginCard, Form* → login UI exists but NOT wired into App yet
    AuditDashboard.tsx    → legacy/unused alternate dashboard
  hooks/
    useAuditFilters.ts    → filter logic for audit records
    useTheme.ts           → light/dark (DaisyUI themes: cmyk / forest)
    useLoginForm.ts       → login form state (unused in main flow)
  constants/
    productConstants.ts   → product & admin name lists
    loginConstants.ts
  styles/sidebar.css
  index.css               → Tailwind + DaisyUI plugin (cmyk default, forest dark)
```

---

## Routing & navigation

- **No React Router.** `MainLayout` holds `currentPage: 'dashboard' | 'reports' | 'settings'`.
- `Sidebar` calls `onPageChangeCallback(id)` then closes mobile drawer.
- **Settings** is a placeholder page only.

---

## Pages (behavior)

### Dashboard (`src/pages/Dashboard.tsx`)

- **Purpose:** Audit trail — who changed which item stock and when.
- **Data:** `MOCK_AUDIT_RECORDS` exported from this file (replace with Loyverse API later).
- **UI:** `AuditFilters` + `AuditTable`.
- **Record shape** (`AuditRecord`): `id`, `itemName`, `adminName`, `oldStock`, `newStock`, `changeAmount`, `timestamp`.

### Reports (`src/pages/Reports.tsx`)

- **Purpose:** Current inventory snapshot derived from latest `newStock` per item in audit data.
- **Imports:** `MOCK_AUDIT_RECORDS` from `Dashboard.tsx` (single source of mock truth).
- **Stock rules:**
  - `0` → Out of Stock
  - `1–3` → Low Stock
  - `4+` → In Stock
- **UI:** DaisyUI `tabs tabs-boxed` (Out of Stock / Low Stock / In Stock with counts), search field, one inventory table.
- **Pagination:** 15 items per page; reset page on tab or search change.

---

## UI conventions (follow these when adding UI)

| Pattern | Classes / location |
|--------|---------------------|
| Page shell | `min-h-screen bg-base-200 p-3 sm:p-4 md:p-8` |
| Content width | `max-w-7xl mx-auto` |
| Page title | `text-2xl sm:text-3xl md:text-4xl font-bold` + subtitle `text-base-content/60 text-sm sm:text-base` |
| Data card | `card bg-base-100 shadow border border-base-200` |
| Table | `table text-sm`, thead `bg-base-200`, rows `border-b border-base-200 hover:bg-base-200/30` |
| Pagination | Bottom of card: Prev/Next, `Showing X to Y of Z`, page `N / total` — see `AuditTable.tsx` |
| Items per page | **15** (`ITEMS_PER_PAGE` in `AuditTable`; duplicate constant in `Reports` until extracted) |
| Forms / filters | `form-control`, `label`, `input input-bordered`, `select select-bordered` |
| Semantic colors | success = in stock / positive change; warning = low stock; error = out of stock / negative change |

**Theme:** `useTheme` + `ThemeToggleButton` in `MainLayout`. Do not hardcode colors outside DaisyUI tokens (`base-*`, `primary`, `success`, etc.).

**Responsive:** Sidebar fixed right on mobile (`translate-x`), left on `lg+`. Tables use desktop table; `AuditTable` also has `sm:hidden` mobile list (Reports table is desktop-only for now).

---

## Environment variables

- Copy `.env.example` → `.env` locally. **Never commit `.env`** (listed in `.gitignore`).
- Use `VITE_` prefix only for values safe to expose in the browser; keep Loyverse tokens on a backend when possible.

## Data & API status

- **All data is mock** — no fetch/axios yet.
- **Do not** duplicate mock arrays; extend `MOCK_AUDIT_RECORDS` in `Dashboard.tsx` or add a dedicated `src/data/` module when refactoring.
- **Loyverse API:** not implemented; sidebar shows “Loyverse Connected” as UI copy only.
- When adding API: prefer hooks (`useAuditRecords`, `useInventory`) and keep presentational components dumb.

---

## What NOT to do

- Do not reintroduce heavy “report” styling (gradient headers, KPI card grids, 3-column card breakdowns) unless explicitly requested.
- Do not move `MOCK_AUDIT_RECORDS` into `Reports.tsx` — Reports imports from Dashboard.
- Do not add React Router without a product decision — navigation is centralized in `MainLayout`.
- Avoid new dependencies unless necessary; stack is intentionally minimal.
- Login flow exists under `components/Login.tsx` but is **not** mounted — do not assume auth gates exist.

---

## Commands

```bash
npm run dev      # local dev
npm run build    # tsc + vite build
npm run lint     # eslint
```

---

## Typical tasks map

| User asks for… | Start here |
|----------------|------------|
| Audit table / filters | `Dashboard.tsx`, `AuditTable.tsx`, `AuditFilters.tsx`, `useAuditFilters.ts` |
| Inventory / stock report | `Reports.tsx` |
| Navigation / new page | `MainLayout.tsx`, `Sidebar.tsx` |
| Theming | `useTheme.ts`, `index.css`, `ThemeToggleButton.tsx` |
| Loyverse integration | new `src/services/` or `src/api/` + replace mock in Dashboard |

---

## Updating this file

When architecture or conventions change, update **AGENTS.md** and the short rule in `.cursor/rules/loyverse-project.mdc` so agents stay aligned.
