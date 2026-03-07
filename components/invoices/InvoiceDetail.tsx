"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InvoiceStatus } from "@/types/invoices";
import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceDetailData {
  id: string;
  estimate_id: string | null;
  customer_name: string;
  customer_address: string | null;
  status: InvoiceStatus;
  total: number;
  created_at: string;
  items: InvoiceItem[];
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue:  "bg-red-50 text-red-700 border border-red-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  cash:     "bg-teal-50 text-teal-700 border border-teal-200",
  deferred: "bg-orange-50 text-orange-700 border border-orange-200",
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft:    "Draft",
  sent:     "Sent",
  paid:     "Paid",
  overdue:  "Overdue",
  partial:  "Partial",
  cash:     "Cash",
  deferred: "Pay Later",
};

export function InvoiceDetail({
  invoice,
  tenant,
}: {
  invoice: InvoiceDetailData;
  tenant: TenantProfile;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [updating, setUpdating] = useState(false);
  const { street, cityLine, ccbLine } = formatTenantAddress(tenant);

  async function updateStatus(next: InvoiceStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    } finally {
      setUpdating(false);
    }
  }

  const subtotal = invoice.items.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const invoiceNum = `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const createdDate = new Date(invoice.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">

      {/* Back */}
      <div className="mb-5">
        <button
          onClick={() => router.push("/dashboard/invoices")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>
      </div>

      {/* Document card */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">

        {/* Company header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto mb-3 object-contain" />
              )}
              <p className="text-base font-bold text-gray-900">{tenant.name}</p>
              {street && <p className="text-sm text-gray-500">{street}</p>}
              {cityLine && <p className="text-sm text-gray-500">{cityLine}</p>}
              {tenant.phone && <p className="text-sm text-gray-500">{tenant.phone}</p>}
              {tenant.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
              {ccbLine && <p className="text-xs text-gray-400 mt-1">{ccbLine}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-gray-900">INVOICE</p>
              <p className="text-sm text-gray-500 font-mono mt-1">{invoiceNum}</p>
              <p className="text-sm text-gray-500 mt-1">{createdDate}</p>
              <span className={`inline-flex mt-2 rounded px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bill To</p>
          <p className="text-sm font-semibold text-gray-900">{invoice.customer_name || "—"}</p>
          {invoice.customer_address && (
            <p className="text-sm text-gray-500 mt-0.5">{invoice.customer_address}</p>
          )}
          {invoice.estimate_id && (
            <Link
              href={`/dashboard/estimates/${invoice.estimate_id}`}
              className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View source estimate →
            </Link>
          )}
        </div>

        {/* Line items */}
        <div className="px-8 py-6">
          {invoice.items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Unit Price</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 text-gray-900">{item.description || "—"}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.unit_price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {(item.quantity * item.unit_price).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 italic">No line items.</p>
          )}

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>{invoice.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="mt-4 bg-white border border-gray-200 rounded p-4 flex flex-wrap items-center gap-3">
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          download
          className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
        <div className="w-px h-5 bg-gray-200" />
        {status === "draft" && (
          <button
            onClick={() => updateStatus("sent")}
            disabled={updating}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Mark as Sent
          </button>
        )}
        {(status === "sent" || status === "cash" || status === "deferred" || status === "partial" || status === "overdue") && (
          <button
            onClick={() => updateStatus("paid")}
            disabled={updating}
            className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            Mark as Paid
          </button>
        )}
        {(status === "sent" || status === "deferred") && (
          <button
            onClick={() => updateStatus("overdue")}
            disabled={updating}
            className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Mark as Overdue
          </button>
        )}
        {status === "cash" && (
          <span className="text-sm text-teal-700 font-medium">Customer paying in cash</span>
        )}
        {status === "deferred" && (
          <span className="text-sm text-orange-700 font-medium">Customer requested to pay later</span>
        )}
        {status === "paid" && (
          <span className="text-sm text-emerald-600 font-medium">Paid ✓</span>
        )}
      </div>
    </div>
  );
}
