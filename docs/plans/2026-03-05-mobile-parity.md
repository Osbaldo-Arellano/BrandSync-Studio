# Mobile Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring all new session features to mobile — stats bars on both pages, job placeholder in estimate cards, and Convert to Invoice button in estimate mobile cards.

**Architecture:** Two files, four targeted edits. Stats bars switch from `hidden md:flex` to `grid grid-cols-2 md:flex`. Mobile estimate cards get a job placeholder and a Convert button that prevents link navigation via `e.preventDefault()` + `e.stopPropagation()`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4

---

## Task 1: EstimateList mobile parity

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/components/estimates/EstimateList.tsx`

Read the file first to confirm current line numbers before making any edits.

**Step 1: Fix the stats bar container class**

Find the stats bar container div — it currently has `className="hidden md:flex gap-3 mb-5"`. Change it to:

```tsx
<div className="grid grid-cols-2 gap-2 mb-5 md:flex md:gap-3">
```

**Step 2: Fix the mobile card job line**

Find this line in the mobile cards section (inside the `<Link>` card):
```tsx
{est.job && <p className="text-sm text-gray-500 mt-0.5 truncate">{est.job}</p>}
```

Replace it with:
```tsx
<p className="text-sm text-gray-500 mt-0.5 truncate">
  {est.job || <span className="text-gray-400 italic">No description</span>}
</p>
```

**Step 3: Add Convert to Invoice button to mobile cards**

Find the closing part of the mobile card's bottom row — it currently ends with the total amount span and the closing `</div>` and `</Link>`. The mobile card structure looks like:

```tsx
<Link key={est.id} href={...} className="block rounded border ...">
  <div className="flex items-start justify-between gap-3">
    ...
  </div>
  <div className="mt-3 flex items-center justify-between text-sm">
    <span className="text-gray-400">...</span>
    <span className="font-semibold text-gray-900">...</span>
  </div>
</Link>
```

Insert this block AFTER the `mt-3 flex` date/total div and BEFORE the closing `</Link>`:

```tsx
{est.status === "approved" && (
  <div className="mt-3 pt-3 border-t border-gray-100">
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        convertToInvoice(est.id);
      }}
      disabled={converting[est.id]}
      className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {converting[est.id] ? "Converting…" : "Convert to Invoice"}
    </button>
  </div>
)}
```

**Step 4: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 2: InvoiceList mobile parity

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/components/invoices/InvoiceList.tsx`

Read the file first to confirm current line numbers.

**Step 1: Fix the stats bar container class**

Find the stats bar container div — it currently has `className="hidden md:flex gap-3 mb-5"`. Change it to:

```tsx
<div className="grid grid-cols-2 gap-2 mb-5 md:flex md:gap-3">
```

**Step 2: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.
