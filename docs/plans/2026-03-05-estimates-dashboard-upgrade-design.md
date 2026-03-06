# Estimates Dashboard Upgrade — Design Doc
Date: 2026-03-05

## Goal
Elevate the estimates list from "admin table" to a business tool: readable at a glance, actionable per-row, with a clear sense of pipeline health.

## Section 1: Database — estimate_number

**Migration file:** `supabase/migrations/20260305000000_add_estimate_number.sql`

Changes:
- Create global sequence `estimate_number_seq`
- Add `estimate_number INTEGER` column to `estimates`
- Add `BEFORE INSERT` trigger `estimates_assign_number` that calls `nextval('estimate_number_seq')`
- Backfill existing rows ordered by `created_at` using `ROW_NUMBER()`
- Reset sequence to `MAX(estimate_number)` after backfill

Display format: `EST-${year}-${padStart(3, '0')}` e.g. `EST-2026-014`

Type update: add `estimate_number: number` to `Estimate` interface in `types/estimates.ts`

Page query update: `estimates` page must select `estimate_number` and map it through.

## Section 2: Stats Summary Bar

Rendered inside `EstimateList`, above search/filter, hidden on mobile (`hidden md:flex`).

4 stat cards computed client-side from the full `estimates` prop (no extra fetch):

| Card | Computation |
|---|---|
| Drafts | `estimates.filter(e => e.status === 'draft').length` |
| Sent | `estimates.filter(e => e.status === 'sent').length` |
| Approved | `estimates.filter(e => e.status === 'approved').length` |
| Pipeline | `sum of totals where status in [draft, sent, approved]` |

Card style: white bg, `border border-gray-200 rounded px-4 py-3`, small uppercase label (`text-xs text-gray-500`), large value (`text-xl font-bold text-gray-900`). Pipeline card shows currency format.

## Section 3: Row Actions

Replace current "View" text link + PDF icon column with a proper actions cell.

Actions rendered per row:
- **View**: small outlined button (`border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2 py-1 rounded`)
- **Convert to Invoice**: only shown when `status === 'approved'`. Solid blue (`bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700`). On click: POST /api/invoices with `{ estimateId: est.id }`, show per-row loading state via `converting: Record<string, boolean>` state, on success update row status optimistically to `invoiced` and redirect to `/dashboard/invoices`
- **PDF icon**: stays, same style, sits beside View button

Error handling: if Convert fails, show a brief inline error message below the row or use `alert()` as a fallback.

## Section 4: Table Polish

- Header text: `text-gray-500` → `text-gray-700`, keep `text-xs font-semibold uppercase tracking-wide`
- Estimate # cell: replace `est.id.slice(0,8).toUpperCase()` with `EST-${year}-${padded}`, color `text-gray-700` (was `text-gray-400`)
- Customer cell: keep `font-medium text-gray-900`
- Job cell: `text-gray-500` → `text-gray-600`; if `est.job` is empty, render `—`
- Date cell: `text-gray-500` → `text-gray-600`
- Actions column: right-align, use flex gap-2

## Files Changed

1. `supabase/migrations/20260305000000_add_estimate_number.sql` — new
2. `types/estimates.ts` — add `estimate_number: number`
3. `app/dashboard/estimates/page.tsx` — map `estimate_number` from DB row
4. `components/estimates/EstimateList.tsx` — stats bar, row actions, table polish
