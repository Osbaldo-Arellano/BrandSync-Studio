# Dashboard Metrics V2 — Design Doc
Date: 2026-03-05

## Goal
Three small improvements: add Invoiced $ to estimates stats bar, add a styled placeholder for blank job rows, and add a financial stats bar to the invoices page.

## Section 1: Estimates stats bar — Invoiced card

Add a 5th card between Approved and Pipeline:

- **Invoiced**: sum of `total` for all estimates where `status === "invoiced"`
- **Pipeline**: unchanged — sum of draft + sent + approved totals
- `computeStats` in `EstimateList.tsx` gets one new field: `invoicedTotal`
- Card renders with same style as existing four cards

New bar order: Drafts | Sent | Approved | Invoiced | Pipeline

## Section 2: Estimates table — Job column placeholder

When `est.job` is empty, instead of `—`, render:
```tsx
<span className="text-gray-400 italic">No description</span>
```
When non-empty, render the job text as before (plain string, `text-gray-600`).

One change in `EstimateList.tsx` Job cell only.

## Section 3: Invoice page — financial stats bar

Add a stats bar to `InvoiceList.tsx` above the search/filter row. Four cards, all dollar values, desktop-only (`hidden md:flex`):

| Card | Computation |
|---|---|
| Outstanding | sum of totals where `status === "sent"` |
| Paid | sum of totals where `status === "paid"` |
| Overdue | sum of totals where `status === "overdue"` |
| Total Revenue | sum of all invoice totals |

Add `computeInvoiceStats(invoices)` helper before the `InvoiceList` component. All values formatted as USD with `maximumFractionDigits: 0`. Stats computed from the full `invoices` state (not filtered `visible`). Bar only shown when `invoices.length > 0`.

## Files Changed

1. `components/estimates/EstimateList.tsx` — add invoicedTotal to computeStats, add Invoiced card, update job placeholder
2. `components/invoices/InvoiceList.tsx` — add computeInvoiceStats helper, render stats bar
