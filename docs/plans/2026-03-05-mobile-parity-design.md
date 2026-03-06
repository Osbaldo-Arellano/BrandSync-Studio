# Mobile Parity — Design Doc
Date: 2026-03-05

## Goal
Bring all new features from this session to mobile: stats bars on both pages, job placeholder in estimate mobile cards, and Convert to Invoice button in estimate mobile cards.

## Stats bars (both pages)

Change `hidden md:flex` → `grid grid-cols-2 gap-2 md:flex md:gap-3` on the stats bar container div in both `EstimateList.tsx` and `InvoiceList.tsx`. Cards render as 2×2 grid on mobile, horizontal row on desktop. No other card changes needed.

## EstimateList mobile card — job placeholder

Current: `{est.job && <p className="text-sm text-gray-500 mt-0.5 truncate">{est.job}</p>}`

Replace with always-rendered line:
```tsx
<p className="text-sm text-gray-500 mt-0.5 truncate">
  {est.job || <span className="text-gray-400 italic">No description</span>}
</p>
```

## EstimateList mobile card — Convert to Invoice button

The mobile card is a `<Link>` wrapping the full tile. Add a button row at the bottom, only when `est.status === "approved"`. Must call `e.stopPropagation()` + `e.preventDefault()` to prevent navigation. Calls the existing `convertToInvoice(est.id)` handler. Shows "Converting…" while `converting[est.id]` is true.

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

## Files Changed

1. `components/estimates/EstimateList.tsx` — stats bar grid, mobile card job placeholder, mobile card Convert button
2. `components/invoices/InvoiceList.tsx` — stats bar grid
