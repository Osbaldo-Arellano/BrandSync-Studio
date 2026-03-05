"use client";

import { useState } from "react";
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
  items: InvoiceItem[];
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:   "bg-gray-100 text-gray-600 border border-gray-200",
  sent:    "bg-blue-50 text-blue-700 border border-blue-200",
  paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-50 text-red-700 border border-red-200",
};

const FILTER_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All",     value: "all" },
  { label: "Draft",   value: "draft" },
  { label: "Sent",    value: "sent" },
  { label: "Paid",    value: "paid" },
  { label: "Overdue", value: "overdue" },
];

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function InvoiceList({ invoices: initial }: { invoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initial);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

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

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            Invoices generated from approved estimates
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer…"
          className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
        <div className="flex gap-1 p-1 rounded bg-gray-100 border border-gray-200 self-start">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
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
        <div className="hidden md:block border border-gray-200 bg-white overflow-hidden rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-400 font-mono">
                      INV-{inv.id.slice(0, 8).toUpperCase()}
                    </div>
                    {inv.estimate_id && (
                      <Link
                        href={`/dashboard/estimates/${inv.estimate_id}`}
                        className="text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        View estimate
                      </Link>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{inv.customer_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {inv.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {inv.status === "draft" && (
                        <button
                          onClick={() => updateStatus(inv.id, "sent")}
                          disabled={updating === inv.id}
                          className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Mark Sent
                        </button>
                      )}
                      {inv.status === "sent" && (
                        <button
                          onClick={() => updateStatus(inv.id, "paid")}
                          disabled={updating === inv.id}
                          className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status === "paid" && (
                        <span className="text-xs text-emerald-600 font-medium">Paid ✓</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {visible.length > 0 && (
        <div className="md:hidden space-y-2">
          {visible.map((inv) => (
            <div key={inv.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-mono">INV-{inv.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{inv.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {inv.status === "draft" && (
                    <button
                      onClick={() => updateStatus(inv.id, "sent")}
                      disabled={updating === inv.id}
                      className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark Sent
                    </button>
                  )}
                  {inv.status === "sent" && (
                    <button
                      onClick={() => updateStatus(inv.id, "paid")}
                      disabled={updating === inv.id}
                      className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                  )}
                  {inv.status === "paid" && (
                    <span className="text-xs text-emerald-600 font-medium">Paid ✓</span>
                  )}
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
