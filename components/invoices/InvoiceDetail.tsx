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
  customer_email?: string | null;
  customer_phone?: string | null;
  payment_terms?: string | null;
  salesperson?: string | null;
  status: InvoiceStatus;
  total: number;
  amount_paid?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  due_date?: string | null;
  notes?: string;
  delivery_method?: "email" | "link" | "print" | null;
  created_at: string;
  invoice_number?: number;
  items: InvoiceItem[];
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue:  "bg-red-50 text-red-700 border border-red-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  cash:     "bg-teal-50 text-teal-700 border border-teal-200",
  cashapp:  "bg-green-50 text-green-700 border border-green-200",
  deferred: "bg-orange-50 text-orange-700 border border-orange-200",
  void:     "bg-gray-100 text-gray-400 border border-gray-200",
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

  // Send modal state
  const [deliveryMethod, setDeliveryMethod] = useState(invoice.delivery_method ?? null);

  // Send email modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [modalEmail, setModalEmail] = useState(invoice.customer_email ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Copy link
  const [copyFeedback, setCopyFeedback] = useState(false);

  // PDF download → deliver prompt
  const [showDeliverPrompt, setShowDeliverPrompt] = useState(false);

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

  async function handleSend() {
    if (!modalEmail.trim()) {
      setSendError("Enter a customer email address");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: modalEmail.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        setSendError(body.error ?? "Failed to send");
        return;
      }
      setStatus("sent");
      setDeliveryMethod("email");
      setSendSuccess(true);
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(false);
      }, 2500);
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(paymentLink);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    if (status === "draft") {
      await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", delivery_method: "link" }),
      });
      setStatus("sent");
      setDeliveryMethod("link");
    }
  }

  async function handleMarkDelivered() {
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent", delivery_method: "print" }),
    });
    setStatus("sent");
    setDeliveryMethod("print");
    setShowDeliverPrompt(false);
  }

  const invoiceNum = invoice.invoice_number
    ? `INV-${String(invoice.invoice_number).padStart(4, "0")}`
    : `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  const createdDate = new Date(invoice.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const subtotal = invoice.items.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const discountAmount = invoice.discount_amount ?? 0;
  const taxAmount = invoice.tax_amount ?? 0;
  const amountPaid = invoice.amount_paid ?? 0;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const paymentLink = `${appUrl}/pay/${invoice.id}`;

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded border border-gray-200 bg-white p-6 shadow-xl">
            {sendSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Invoice sent</p>
                  <p className="text-sm text-gray-500 mt-0.5">{modalEmail}</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Send Invoice to Customer</h3>
                <p className="text-sm text-gray-500 mb-5">
                  We&apos;ll email the customer a link to view and pay this invoice.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Customer email</label>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                {sendError && <p className="mt-3 text-sm text-red-600">{sendError}</p>}
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => { setShowSendModal(false); setSendError(null); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-100">
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
              {invoice.due_date && (
                <p className="text-sm text-gray-500 mt-0.5">Due: {invoice.due_date}</p>
              )}
              <span className={`inline-flex mt-2 rounded px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              {deliveryMethod && (
                <p className="text-xs text-gray-400 mt-1">
                  via {deliveryMethod === "email" ? "email" : deliveryMethod === "link" ? "shared link" : "physical delivery"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="px-4 sm:px-8 py-3 sm:py-5 border-b border-gray-100 bg-gray-50">
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
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {invoice.items.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[400px]">
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
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No line items.</p>
          )}

          {/* Totals */}
          <div className="mt-4 sm:mt-6 flex justify-end">
            <div className="w-full sm:w-56 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span className="text-emerald-600">−{discountAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax{invoice.tax_rate ? ` (${invoice.tax_rate}%)` : ""}</span>
                  <span>{taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>{invoice.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
              {amountPaid > 0 && status !== "paid" && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Deposit Paid</span>
                  <span className="text-emerald-600">−{amountPaid.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              )}
              {amountPaid > 0 && status !== "paid" && (
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Balance Due</span>
                  <span>{(invoice.total - amountPaid).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-4 sm:px-8 pb-4 sm:pb-6">
            <div className="rounded border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Deliver prompt (shown after PDF download) */}
      {showDeliverPrompt && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 flex-1 min-w-0">PDF downloaded. Did you physically deliver this invoice?</p>
          <div className="flex gap-2 items-center shrink-0">
            <button
              onClick={handleMarkDelivered}
              className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Yes, delivered
            </button>
            <button
              onClick={() => setShowDeliverPrompt(false)}
              className="text-xs text-amber-600 hover:text-amber-800 whitespace-nowrap"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Action panel */}
      <div className="mt-4 bg-white border border-gray-200 rounded p-4 flex flex-wrap items-center gap-3">

        {/* Download PDF */}
        <button
          onClick={() => {
            window.location.href = `/api/invoices/${invoice.id}/pdf`;
            setShowDeliverPrompt(status === "draft");
          }}
          className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
        >
          {copyFeedback ? (
            <>
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        {status !== "void" && status !== "paid" && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            {(status === "draft" || status === "sent") && (
              <button
                onClick={() => setShowSendModal(true)}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Send Email
              </button>
            )}
            {(status === "sent" || status === "cash" || status === "cashapp" || status === "deferred" || status === "partial" || status === "overdue") && (
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
            <div className="ml-auto">
              <button
                onClick={() => updateStatus("void")}
                disabled={updating}
                className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 transition-colors"
              >
                Void Invoice
              </button>
            </div>
          </>
        )}

        {status === "cashapp" && (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-green-800">Customer selected Cash App payment</p>
            <p className="text-xs text-gray-600">Have you received a payment? Mark it paid once confirmed.</p>
            <button
              onClick={() => updateStatus("paid")}
              disabled={updating}
              className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
            >
              {updating ? "Saving…" : "Mark Paid"}
            </button>
          </div>
        )}
        {status === "paid" && (
          <span className="text-sm text-emerald-600 font-medium">Paid ✓</span>
        )}
        {status === "void" && (
          <span className="text-sm text-gray-400">This invoice has been voided.</span>
        )}
      </div>
    </div>
  );
}
