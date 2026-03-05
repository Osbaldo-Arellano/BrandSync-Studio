"use client";

import { useState } from "react";
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
];

function StatusBadge({ status }: { status: EstimateStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function EstimateList({ estimates }: { estimates: Estimate[] }) {
  const [filter, setFilter] = useState<EstimateStatus | "all">("all");
  const [search, setSearch] = useState("");

  const visible = estimates.filter((est) => {
    const matchStatus = filter === "all" || est.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      est.customerName.toLowerCase().includes(q) ||
      est.job.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

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

      {/* Search + filter */}
      {estimates.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or job…"
            className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
          <div className="flex gap-1 p-1 rounded bg-gray-100 border border-gray-200 self-start flex-wrap">
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
        <div className="hidden md:block border border-gray-200 bg-white overflow-hidden rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimate #</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((est) => (
                <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">{est.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{est.customerName}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 max-w-[160px] truncate">{est.job}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(est.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={est.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {est.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/estimates/${est.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
      )}

      {/* Mobile cards */}
      {visible.length > 0 && (
        <div className="md:hidden space-y-2">
          {visible.map((est) => (
            <Link
              key={est.id}
              href={`/dashboard/estimates/${est.id}`}
              className="block rounded border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{est.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold text-gray-900 mt-0.5 truncate">{est.customerName}</p>
                  {est.job && <p className="text-sm text-gray-500 mt-0.5 truncate">{est.job}</p>}
                </div>
                <StatusBadge status={est.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-400">{new Date(est.created_at).toLocaleDateString()}</span>
                <span className="font-semibold text-gray-900">
                  {est.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
