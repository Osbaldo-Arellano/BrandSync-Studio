# Dashboard Metrics V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an Invoiced $ card to the estimates stats bar, a styled placeholder for blank job fields, and a financial stats bar (Outstanding / Paid / Overdue / Total Revenue) to the invoices page.

**Architecture:** All three changes are purely client-side — no query changes, no new API routes. Stats are computed from already-fetched arrays. Two files touched total.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4

---

## Task 1: Estimates stats bar — add Invoiced card + job placeholder

**Files:**
- Modify: `components/estimates/EstimateList.tsx`

**Step 1: Add `invoicedTotal` to `computeStats`**

The current `computeStats` function is at lines 39–48. Add one new field:

```ts
function computeStats(estimates: Estimate[]) {
  return {
    drafts:   estimates.filter(e => e.status === "draft").length,
    sent:     estimates.filter(e => e.status === "sent").length,
    approved: estimates.filter(e => e.status === "approved").length,
    invoicedTotal: estimates
      .filter(e => e.status === "invoiced")
      .reduce((sum, e) => sum + e.total, 0),
    pipeline: estimates
      .filter(e => ["draft", "sent", "approved"].includes(e.status))
      .reduce((sum, e) => sum + e.total, 0),
  };
}
```

**Step 2: Add the Invoiced card to the stats bar**

The stats bar array is at lines 113–120. It currently has 4 entries. Add the Invoiced entry between Approved and Pipeline:

```tsx
{ label: "Drafts",   value: String(stats.drafts) },
{ label: "Sent",     value: String(stats.sent) },
{ label: "Approved", value: String(stats.approved) },
{
  label: "Invoiced",
  value: stats.invoicedTotal.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
},
{
  label: "Pipeline",
  value: stats.pipeline.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
},
```

**Step 3: Update the Job cell placeholder**

Line 190 currently renders `{est.job || "—"}`. Replace with a styled placeholder:

```tsx
<td className="px-5 py-4 text-sm text-gray-600 max-w-[160px] truncate">
  {est.job
    ? est.job
    : <span className="text-gray-400 italic">No description</span>
  }
</td>
```

**Step 4: Verify build passes**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 2: Invoice page — financial stats bar

**Files:**
- Modify: `components/invoices/InvoiceList.tsx`

**Step 1: Add `computeInvoiceStats` helper**

Add this function before the `InvoiceList` component (e.g. after the `StatusBadge` component, around line 46):

```ts
function computeInvoiceStats(invoices: Invoice[]) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return {
    outstanding: fmt(invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0)),
    paid:        fmt(invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0)),
    overdue:     fmt(invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0)),
    revenue:     fmt(invoices.reduce((s, i) => s + i.total, 0)),
  };
}
```

**Step 2: Render the stats bar**

Inside `InvoiceList`, insert this block after the closing `</div>` of the header section (the one with the h1) and before the search/filter row. Use the full `invoices` state (not filtered `visible`):

```tsx
{/* Stats bar — desktop only */}
{invoices.length > 0 && (() => {
  const stats = computeInvoiceStats(invoices);
  return (
    <div className="hidden md:flex gap-3 mb-5">
      {[
        { label: "Outstanding", value: stats.outstanding },
        { label: "Paid",        value: stats.paid },
        { label: "Overdue",     value: stats.overdue },
        { label: "Total Revenue", value: stats.revenue },
      ].map(({ label, value }) => (
        <div key={label} className="border border-gray-200 bg-white rounded px-4 py-3 min-w-[120px]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
})()}
```

**Step 3: Verify build passes**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.
