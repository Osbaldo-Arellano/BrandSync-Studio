"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { InvoiceStatus } from "@/types/invoices";

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: string;
  estimate_id: string | null;
  customer_name: string;
  status: InvoiceStatus;
  total: number;
  created_at: string;
  invoice_number?: number;
  due_date?: string | null;
  items: InvoiceItem[];
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue:  "bg-red-50 text-red-700 border border-red-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  cash:     "bg-teal-50 text-teal-700 border border-teal-200",
  cashapp:  "bg-green-50 text-green-700 border border-green-200",
  deferred: "bg-orange-50 text-orange-700 border border-orange-200",
  void:     "bg-gray-100 text-gray-400 border border-gray-200 line-through",
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft:    "Draft",
  sent:     "Sent",
  paid:     "Paid",
  overdue:  "Overdue",
  partial:  "Partial",
  cash:     "Cash",
  cashapp:  "Cash App",
  deferred: "Pay Later",
  void:     "Void",
};

const FILTER_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Draft",     value: "draft" },
  { label: "Sent",      value: "sent" },
  { label: "Partial",   value: "partial" },
  { label: "Cash",      value: "cash" },
  { label: "Cash App",  value: "cashapp" },
  { label: "Pay Later", value: "deferred" },
  { label: "Paid",      value: "paid" },
  { label: "Overdue",   value: "overdue" },
  { label: "Void",      value: "void" },
];

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

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

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function InvoiceList({ invoices: initial }: { invoices: Invoice[] }) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("status") as InvoiceStatus | null) ?? "all";
  const [invoices, setInvoices] = useState(initial);
  const [filter, setFilter] = useState<InvoiceStatus | "all">(initialFilter);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const router = useRouter();

  const statusCounts = FILTER_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === "all"
      ? invoices.length
      : invoices.filter(i => i.status === tab.value).length;
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

  async function deleteInvoice(id: string) {
    if (!confirm("Delete this draft invoice? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete invoice");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function updateStatus(id: string, status: InvoiceStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const visible = invoices.filter((inv) => {
    const matchStatus = filter === "all" || inv.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || inv.customer_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            Invoices generated from approved estimates
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0"
        >
          + New Invoice
        </Link>
      </div>

      {/* Stats bar — desktop only */}
      {invoices.length > 0 && (() => {
        const stats = computeInvoiceStats(invoices);
        return (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {[
              { label: "Outstanding",   value: stats.outstanding },
              { label: "Paid",          value: stats.paid },
              { label: "Overdue",       value: stats.overdue },
              { label: "Total Revenue", value: stats.revenue },
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-200 bg-white rounded px-4 py-3 shrink-0 min-w-[110px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Search + filter */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by customer…"
          className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border shrink-0 ${
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

      {visible.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">
            {invoices.length === 0
              ? "No invoices yet"
              : "No invoices match your filters."}
          </p>
          {invoices.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Generate one from an approved estimate.</p>
          )}
        </div>
      )}

      {/* Desktop table */}
      {visible.length > 0 && (
        <div className="hidden sm:block relative">
        <div className="border border-gray-200 bg-white overflow-y-auto rounded" style={{ maxHeight: tableHeight }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50 sticky top-0 z-10">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-400 font-mono">
                      {inv.invoice_number
                        ? `INV-${String(inv.invoice_number).padStart(4, "0")}`
                        : `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                    </div>
                    {inv.estimate_id && (
                      <Link
                        href={`/dashboard/estimates/${inv.estimate_id}`}
                        className="text-[11px] text-blue-600 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View estimate
                      </Link>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{inv.customer_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                    <div>{new Date(inv.created_at).toLocaleDateString()}</div>
                    {inv.due_date && (
                      <div className={`text-xs mt-0.5 ${
                        inv.due_date < new Date().toISOString().slice(0, 10) && inv.status !== "paid" && inv.status !== "void"
                          ? "text-red-500 font-medium"
                          : "text-gray-400"
                      }`}>
                        Due {inv.due_date}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {inv.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      {inv.status === "draft" && (
                        <button
                          onClick={() => updateStatus(inv.id, "sent")}
                          disabled={!!updating}
                          className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Mark Sent
                        </button>
                      )}
                      {(inv.status === "sent" || inv.status === "cash" || inv.status === "cashapp" || inv.status === "deferred" || inv.status === "partial") && (
                        <button
                          onClick={() => updateStatus(inv.id, "paid")}
                          disabled={!!updating}
                          className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {(inv.status === "sent" || inv.status === "deferred") && (
                        <button
                          onClick={() => updateStatus(inv.id, "overdue")}
                          disabled={!!updating}
                          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Overdue
                        </button>
                      )}
                      {inv.status === "paid" && (
                        <span className="text-xs text-emerald-600 font-medium">Paid ✓</span>
                      )}
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="ml-auto rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                      {inv.status === "draft" && (
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          disabled={deleting === inv.id}
                          className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {deleting === inv.id ? "…" : "Delete"}
                        </button>
                      )}
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        download
                        title="Download PDF"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
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
        <div className="mt-4 pb-2 flex flex-col-reverse sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2 sm:mr-auto">
            <span className="text-xs text-gray-500">Rows:</span>
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
          <div className="text-xs text-gray-500 sm:text-center">
            {visible.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, visible.length)}`} of {visible.length}
          </div>
          <div className="flex gap-1">
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
        <div className="sm:hidden space-y-2">
          {paginated.map((inv) => (
            <div key={inv.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-mono">
                    {inv.invoice_number
                      ? `INV-${String(inv.invoice_number).padStart(4, "0")}`
                      : `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5">{inv.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</p>
                  {inv.due_date && (
                    <p className={`text-xs mt-0.5 ${
                      inv.due_date < new Date().toISOString().slice(0, 10) && inv.status !== "paid" && inv.status !== "void"
                        ? "text-red-500 font-medium"
                        : "text-gray-400"
                    }`}>Due {inv.due_date}</p>
                  )}
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center flex-wrap">
                  {inv.status === "draft" && (
                    <button
                      onClick={() => updateStatus(inv.id, "sent")}
                      disabled={!!updating}
                      className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark Sent
                    </button>
                  )}
                  {(inv.status === "sent" || inv.status === "cash" || inv.status === "cashapp" || inv.status === "deferred" || inv.status === "partial") && (
                    <button
                      onClick={() => updateStatus(inv.id, "paid")}
                      disabled={!!updating}
                      className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                  )}
                  {(inv.status === "sent" || inv.status === "deferred") && (
                    <button
                      onClick={() => updateStatus(inv.id, "overdue")}
                      disabled={!!updating}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Overdue
                    </button>
                  )}
                  {inv.status === "paid" && (
                    <span className="text-xs text-emerald-600 font-medium">Paid ✓</span>
                  )}
                  <Link
                    href={`/dashboard/invoices/${inv.id}`}
                    className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>
                  {inv.status === "draft" && (
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      disabled={deleting === inv.id}
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === inv.id ? "…" : "Delete"}
                    </button>
                  )}
                  <a
                    href={`/api/invoices/${inv.id}/pdf`}
                    download
                    title="Download PDF"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
                <span className="font-semibold text-gray-900">
                  {inv.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
