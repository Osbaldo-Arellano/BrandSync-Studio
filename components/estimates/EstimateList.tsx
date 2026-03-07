"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Estimate, EstimateStatus } from "@/types/estimates";

function PdfIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

const STATUS_STYLES: Record<EstimateStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const FILTER_TABS: { label: string; value: EstimateStatus | "all" }[] = [
  { label: "All",      value: "all" },
  { label: "Draft",    value: "draft" },
  { label: "Sent",     value: "sent" },
  { label: "Approved", value: "approved" },
  { label: "Invoiced", value: "invoiced" },
  { label: "Declined", value: "declined" },
];

function StatusBadge({ status }: { status: EstimateStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

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

function fmtEstimateId(est: Estimate): string {
  const year = new Date(est.created_at).getFullYear();
  const num  = String(est.estimate_number).padStart(3, "0");
  return `EST-${year}-${num}`;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function EstimateList({ estimates }: { estimates: Estimate[] }) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("status") as EstimateStatus | null) ?? "all";
  const [filter, setFilter] = useState<EstimateStatus | "all">(initialFilter);
  const [search, setSearch] = useState("");
  const [converting, setConverting] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const router = useRouter();

  const statusCounts = FILTER_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === "all"
      ? estimates.length
      : estimates.filter(e => e.status === tab.value).length;
    return acc;
  }, {});

  const [tableHeight, setTableHeight] = useState(560);

  function startHeightResize(e: React.MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = tableHeight;
    const onMove = (ev: MouseEvent) => {
      setTableHeight(Math.max(120, startH + ev.clientY - startY));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

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
      window.location.href = "/dashboard/invoices";
    } finally {
      setConverting(prev => ({ ...prev, [estimateId]: false }));
    }
  }

  const visible = estimates.filter((est) => {
    const matchStatus = filter === "all" || est.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      est.customerName.toLowerCase().includes(q) ||
      est.job.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            Create and manage job estimates — approve to generate an invoice
          </p>
        </div>
        <Link
          href="/dashboard/estimates/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap transition-colors"
        >
          + New Estimate
        </Link>
      </div>

      {/* Stats bar — desktop only */}
      {estimates.length > 0 && (() => {
        const stats = computeStats(estimates);
        return (
          <div className="grid grid-cols-2 gap-2 mb-5 md:flex md:gap-3">
            {[
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
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-200 bg-white rounded px-4 py-3 min-w-[100px]">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Search + filter */}
      {estimates.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer or job…"
            className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
          <div className="flex gap-1.5 flex-wrap self-start">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilter(tab.value); setPage(1); }}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border ${
                  filter === tab.value
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label} ({statusCounts[tab.value]})
              </button>
            ))}
          </div>
        </div>
      )}

      {estimates.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No estimates yet</p>
          <p className="text-sm text-gray-400 mt-1">Click &quot;+ New Estimate&quot; to create your first one.</p>
        </div>
      )}

      {estimates.length > 0 && visible.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">No estimates match your search.</p>
      )}

      {/* Desktop table */}
      {visible.length > 0 && (
        <div className="hidden md:block relative">
        <div className="border border-gray-200 bg-white overflow-y-auto rounded" style={{ maxHeight: tableHeight }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50 sticky top-0 z-10">
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Estimate #</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Job</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide text-right">Total</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((est) => (
                <tr
                  key={est.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/estimates/${est.id}`)}
                >
                  <td className="px-5 py-4 text-xs text-gray-700 font-mono">{fmtEstimateId(est)}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{est.customerName}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 max-w-[160px] truncate">
                    {est.job
                      ? est.job
                      : <span className="text-gray-400 italic">No description</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(est.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={est.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {est.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-s-resize flex items-end justify-end pb-0.5 pr-0.5 text-gray-300 hover:text-gray-500 select-none"
          onMouseDown={startHeightResize}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <rect x="5" y="0" width="1.5" height="1.5" rx="0.5" />
            <rect x="5" y="3" width="1.5" height="1.5" rx="0.5" />
            <rect x="2" y="3" width="1.5" height="1.5" rx="0.5" />
            <rect x="5" y="6" width="1.5" height="1.5" rx="0.5" />
            <rect x="2" y="6" width="1.5" height="1.5" rx="0.5" />
            <rect x="0" y="6" width="1.5" height="1.5" rx="0.5" />
          </svg>
        </div>
        </div>
      )}

      {/* Pagination */}
      {visible.length > 0 && (
        <div className="mt-6 pb-2 grid grid-cols-3 items-center text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="text-center text-xs text-gray-500">
            {visible.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, visible.length)}`} of {visible.length}
          </div>
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ‹ Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {visible.length > 0 && (
        <div className="md:hidden space-y-2">
          {paginated.map((est) => (
            <Link
              key={est.id}
              href={`/dashboard/estimates/${est.id}`}
              className="block rounded border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 font-mono">{fmtEstimateId(est)}</p>
                  <p className="font-semibold text-gray-900 mt-0.5 truncate">{est.customerName}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {est.job || <span className="text-gray-400 italic">No description</span>}
                  </p>
                </div>
                <StatusBadge status={est.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-400">{new Date(est.created_at).toLocaleDateString()}</span>
                <span className="font-semibold text-gray-900">
                  {est.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </span>
              </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
