# Estimates Dashboard Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the estimates list page from a bare table into a business tool with pipeline stats, readable formatting, and inline "Convert to Invoice" action.

**Architecture:** Four independent changes applied in order: (1) DB migration adds a sequential `estimate_number` column, (2) type + page query wired up, (3) `EstimateList` gets a stats bar and polished table, (4) inline Convert to Invoice action added to approved rows.

**Tech Stack:** Next.js App Router, Supabase (Postgres), TypeScript, Tailwind CSS v4

---

## Task 1: Migration — add estimate_number

**Files:**
- Create: `supabase/migrations/20260305000000_add_estimate_number.sql`

**Step 1: Write the migration**

```sql
-- Create a global sequence for human-readable estimate numbers
CREATE SEQUENCE IF NOT EXISTS estimate_number_seq START 1;

-- Add the column (nullable so backfill can run first)
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimate_number INTEGER;

-- Backfill existing rows in created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM estimates
)
UPDATE estimates
SET estimate_number = numbered.rn
FROM numbered
WHERE estimates.id = numbered.id;

-- Reset sequence to continue after existing rows
SELECT setval('estimate_number_seq', COALESCE((SELECT MAX(estimate_number) FROM estimates), 0));

-- Now make it non-nullable
ALTER TABLE estimates ALTER COLUMN estimate_number SET NOT NULL;

-- Trigger function: assign next sequence value on every new insert
CREATE OR REPLACE FUNCTION assign_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estimate_number := nextval('estimate_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS estimates_assign_number ON estimates;
CREATE TRIGGER estimates_assign_number
  BEFORE INSERT ON estimates
  FOR EACH ROW
  EXECUTE FUNCTION assign_estimate_number();
```

**Step 2: Apply the migration**

Run this in Supabase SQL editor or via `supabase db push`. Verify by running:
```sql
SELECT id, estimate_number, created_at FROM estimates ORDER BY estimate_number LIMIT 10;
```
Expected: rows have sequential integers starting at 1.

**Step 3: Commit**

```bash
git add supabase/migrations/20260305000000_add_estimate_number.sql
git commit -m "feat: add estimate_number sequential column with trigger"
```

---

## Task 2: Wire estimate_number into types and page query

**Files:**
- Modify: `types/estimates.ts`
- Modify: `app/dashboard/estimates/page.tsx`

**Step 1: Add field to Estimate type**

In `types/estimates.ts`, add `estimate_number: number;` to the `Estimate` interface after the `id` field:

```ts
export interface Estimate {
  id: string;
  estimate_number: number;
  // ... rest unchanged
}
```

**Step 2: Map the field in the page**

In `app/dashboard/estimates/page.tsx`, add `estimate_number: row.estimate_number ?? 0,` to the mapping object (after `id: row.id`):

```ts
const estimates: Estimate[] = (data ?? []).map((row) => ({
  id: row.id,
  estimate_number: row.estimate_number ?? 0,
  customer_id: row.customer_id ?? null,
  // ... rest unchanged
}));
```

**Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no type errors.

**Step 4: Commit**

```bash
git add types/estimates.ts app/dashboard/estimates/page.tsx
git commit -m "feat: wire estimate_number through type and page query"
```

---

## Task 3: Stats summary bar in EstimateList

**Files:**
- Modify: `components/estimates/EstimateList.tsx`

**Step 1: Add a helper to compute stats**

At the top of `EstimateList.tsx`, before the component, add:

```ts
function computeStats(estimates: Estimate[]) {
  return {
    drafts:   estimates.filter(e => e.status === "draft").length,
    sent:     estimates.filter(e => e.status === "sent").length,
    approved: estimates.filter(e => e.status === "approved").length,
    pipeline: estimates
      .filter(e => ["draft", "sent", "approved"].includes(e.status))
      .reduce((sum, e) => sum + e.total, 0),
  };
}
```

**Step 2: Render the stats bar inside EstimateList**

Inside the `EstimateList` component, compute stats and render the bar between the header and search/filter section. Insert this block after the closing `</div>` of the header section and before the search/filter `{estimates.length > 0 && (` block:

```tsx
{/* Stats bar — desktop only */}
{estimates.length > 0 && (() => {
  const stats = computeStats(estimates);
  return (
    <div className="hidden md:flex gap-3 mb-5">
      {[
        { label: "Drafts",   value: String(stats.drafts) },
        { label: "Sent",     value: String(stats.sent) },
        { label: "Approved", value: String(stats.approved) },
        {
          label: "Pipeline",
          value: stats.pipeline.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
        },
      ].map(({ label, value }) => (
        <div key={label} className="border border-gray-200 bg-white rounded px-4 py-3 min-w-[100px]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
})()}
```

**Step 3: Start dev server and visually verify**

```bash
npm run dev
```
Navigate to `/dashboard/estimates`. Confirm 4 stat cards render above the filter tabs on desktop; cards are absent on mobile (narrow viewport).

**Step 4: Commit**

```bash
git add components/estimates/EstimateList.tsx
git commit -m "feat: add pipeline stats bar to estimate list"
```

---

## Task 4: Table polish — IDs, text contrast, empty job

**Files:**
- Modify: `components/estimates/EstimateList.tsx`

**Step 1: Add a display ID helper**

After the `computeStats` function, add:

```ts
function fmtEstimateId(est: Estimate): string {
  const year = new Date(est.created_at).getFullYear();
  const num  = String(est.estimate_number).padStart(3, "0");
  return `EST-${year}-${num}`;
}
```

**Step 2: Update the desktop table**

In the `<tbody>` rows, make these changes:

1. **Estimate # cell** — replace `{est.id.slice(0, 8).toUpperCase()}` with `{fmtEstimateId(est)}` and change color from `text-gray-400` to `text-gray-700`:
```tsx
<td className="px-5 py-4 text-xs text-gray-700 font-mono">{fmtEstimateId(est)}</td>
```

2. **Job cell** — change `text-gray-500` to `text-gray-600` and show em-dash when empty:
```tsx
<td className="px-5 py-4 text-sm text-gray-600 max-w-[160px] truncate">
  {est.job || "—"}
</td>
```

3. **Date cell** — change `text-gray-500` to `text-gray-600`:
```tsx
<td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
```

**Step 3: Update table header contrast**

Change all `<th>` elements from `text-gray-500` to `text-gray-700`:
```tsx
<th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">
```
(Do this for all 6 labelled `<th>` elements.)

**Step 4: Update mobile cards**

In the mobile card section, replace `{est.id.slice(0, 8).toUpperCase()}` with `{fmtEstimateId(est)}` and change `text-gray-400` to `text-gray-600`:
```tsx
<p className="text-xs text-gray-600 font-mono">{fmtEstimateId(est)}</p>
```

**Step 5: Verify visually**

Check desktop and mobile views — IDs should read `EST-2026-001`, job column shows `—` when blank, text is noticeably darker.

**Step 6: Commit**

```bash
git add components/estimates/EstimateList.tsx
git commit -m "feat: EST-YYYY-NNN IDs and table contrast polish"
```

---

## Task 5: Inline "Convert to Invoice" row action

**Files:**
- Modify: `components/estimates/EstimateList.tsx`

**Step 1: Add converting state**

Inside the `EstimateList` component, add state to track which rows are mid-conversion. Add this alongside the existing `useState` calls:

```ts
const [converting, setConverting] = useState<Record<string, boolean>>({});
```

**Step 2: Add the convertToInvoice handler**

Add this function inside the component, before the `return`:

```ts
async function convertToInvoice(estimateId: string) {
  setConverting(prev => ({ ...prev, [estimateId]: true }));
  try {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateId }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert(error ?? "Failed to create invoice");
      return;
    }
    // Redirect to invoices list — page refresh will reflect updated estimate status
    window.location.href = "/dashboard/invoices";
  } finally {
    setConverting(prev => ({ ...prev, [estimateId]: false }));
  }
}
```

**Step 3: Replace the actions cell**

Find the actions `<td>` in the desktop table (the one with the `View` link and `PdfIcon`). Replace the entire `<div className="flex items-center gap-3">` block with:

```tsx
<div className="flex items-center justify-end gap-2">
  {est.status === "approved" && (
    <button
      onClick={() => convertToInvoice(est.id)}
      disabled={converting[est.id]}
      className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {converting[est.id] ? "Converting…" : "Convert to Invoice"}
    </button>
  )}
  <Link
    href={`/dashboard/estimates/${est.id}`}
    className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
  >
    View
  </Link>
  <a
    href={`/api/estimates/${est.id}/pdf`}
    download
    title="Export PDF"
    className="text-gray-400 hover:text-gray-600 transition-colors"
  >
    <PdfIcon />
  </a>
</div>
```

Also update the `<th>` for this column to add `text-right`:
```tsx
<th className="px-5 py-3 text-right"></th>
```

**Step 4: Test the convert flow manually**

1. Start dev server: `npm run dev`
2. Navigate to `/dashboard/estimates`
3. Find an estimate with status `approved` — confirm the blue "Convert to Invoice" button appears
4. Find a `draft` or `sent` estimate — confirm no Convert button
5. Click Convert on an approved estimate — confirm it redirects to `/dashboard/invoices` and the new invoice appears there
6. Return to estimates — confirm the converted estimate now shows `invoiced` status

**Step 5: Commit**

```bash
git add components/estimates/EstimateList.tsx
git commit -m "feat: inline Convert to Invoice action for approved estimates"
```

---

## Task 6: Final verification

**Step 1: Full build check**

```bash
npm run build
```
Expected: clean build, no TypeScript errors.

**Step 2: Run tests**

```bash
npm test
```
Expected: all existing tests pass.

**Step 3: Manual smoke test checklist**

- [ ] Stats bar shows correct counts for each status
- [ ] Pipeline value is sum of draft + sent + approved totals only
- [ ] All estimate IDs display as `EST-YYYY-NNN`
- [ ] Empty job column shows `—`
- [ ] Table headers are visibly darker
- [ ] "Convert to Invoice" button only appears on `approved` rows
- [ ] Convert flow creates invoice and redirects
- [ ] Mobile card view shows `EST-YYYY-NNN` IDs
- [ ] Stats bar is hidden on mobile

**Step 4: Commit if any fixups needed**

```bash
git add -A
git commit -m "fix: estimates dashboard upgrade final adjustments"
```
