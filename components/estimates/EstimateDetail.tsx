"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Estimate, EstimateStatus } from "@/types/estimates";
import type { InvoiceStatus } from "@/types/invoices";
import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

interface Props {
  estimate: Estimate;
  tenant: TenantProfile;
  existingInvoice?: { id: string; status: string } | null;
}

const ESTIMATE_STATUS_STEPS: EstimateStatus[] = ["draft", "sent", "approved", "invoiced"];

const STATUS_BADGE: Record<EstimateStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const INV_STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue:  "bg-red-50 text-red-700 border border-red-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  cash:     "bg-teal-50 text-teal-700 border border-teal-200",
  deferred: "bg-orange-50 text-orange-700 border border-orange-200",
};

export function EstimateDetail({ estimate, tenant, existingInvoice }: Props) {
  const { street, cityLine, ccbLine } = formatTenantAddress(tenant);
  const addrSubtitle = [street, cityLine].filter(Boolean).join(", ");
  const logoUrl = tenant.logo_url ?? null;
  const router = useRouter();
  const [status, setStatus] = useState<EstimateStatus>(estimate.status);
  const [invoiceId, setInvoiceId] = useState<string | null>(existingInvoice?.id ?? null);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>((existingInvoice?.status as InvoiceStatus) ?? "draft");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [modalEmail, setModalEmail] = useState(estimate.customer_email ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(estimate.sent_at ?? null);
  const [savedEmail, setSavedEmail] = useState(estimate.customer_email ?? "");

  async function handleDiscard() {
    setDiscarding(true);
    try {
      await fetch(`/api/estimates/${estimate.id}`, { method: "DELETE" });
      router.push("/dashboard/estimates");
    } finally {
      setDiscarding(false);
    }
  }

  async function updateStatus(next: EstimateStatus) {
    setUpdating(true);
    try {
      await fetch(`/api/estimates/${estimate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
    } finally {
      setUpdating(false);
    }
  }

  async function handleGenerateInvoice() {
    setGeneratingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: estimate.id }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setInvoiceId(id);
        setStatus("invoiced");
      }
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function updateInvoiceStatus(next: InvoiceStatus) {
    if (!invoiceId) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setInvoiceStatus(next);
    } finally {
      setUpdating(false);
    }
  }

  async function handleSend() {
    if (!modalEmail.trim()) {
      setSendError("Enter a client email address");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: modalEmail.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        setSendError(body.error ?? "Failed to send");
        return;
      }
      setSentAt(new Date().toISOString());
      setSavedEmail(modalEmail.trim());
      setStatus("sent");
      setShowSendModal(false);
    } finally {
      setSending(false);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareableLink = `${appUrl}/e/${estimate.id}`;
  const subtotal = estimate.items.reduce((s, i) => s + i.line_total, 0);
  const total = subtotal - estimate.deposit;
  const currentStep = ESTIMATE_STATUS_STEPS.indexOf(status);

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-4">

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Send Estimate to Client</h3>
            <p className="text-sm text-gray-500 mb-5">
              We&apos;ll send a link to review and sign the estimate.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client email</label>
                <input
                  type="email"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Or share this link directly</label>
                <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="flex-1 text-xs text-gray-500 truncate font-mono">{shareableLink}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(shareableLink)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
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
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/estimates" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Estimates</span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`/api/estimates/${estimate.id}/pdf`}
            download
            className="flex items-center gap-1.5 rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </a>
          <span className={`inline-flex rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[status]}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center flex-wrap gap-1 text-xs">
        {ESTIMATE_STATUS_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step} className="flex items-center gap-1">
              <span className={`font-medium capitalize ${active ? "text-gray-900" : done ? "text-gray-400" : "text-gray-300"}`}>
                {done && (
                  <svg className="inline h-3 w-3 text-emerald-500 mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step}
              </span>
              {i < ESTIMATE_STATUS_STEPS.length - 1 && (
                <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Document card */}
      <div className="rounded border border-gray-300 bg-white text-gray-900 shadow-sm">
        <div className="p-5 sm:p-8 md:p-10 space-y-6">

          {/* Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold">{tenant.name}</h2>
              <p className="text-sm text-gray-500 leading-snug mt-0.5">
                {addrSubtitle && <>{addrSubtitle}<br /></>}
                {ccbLine && <>{ccbLine}<br /></>}
                {tenant.tagline || "Licensed, Bonded, Insured"}
              </p>
            </div>
            <div className="sm:text-right flex flex-col items-end gap-1">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="max-h-14 max-w-[180px] object-contain" />
              )}
              <p className="text-base font-bold">Estimate</p>
              <p className="text-sm text-gray-500">
                Date: {new Date(estimate.created_at).toLocaleDateString("en-US")}
              </p>
            </div>
          </div>

          {/* To */}
          <div>
            <p className="text-sm font-semibold text-gray-900">To: {estimate.customerAddress}</p>
          </div>

          {/* Job info */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-[#e8f0e8]">
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-1/4">Salesperson</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-1/4">Job</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-1/4">Payment terms</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-1/4">Due date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800">{estimate.salesperson || "—"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800">{estimate.job || "—"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800">{estimate.payment_terms || "—"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800">{estimate.due_date || "TBD"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[420px]">
              <thead>
                <tr className="bg-[#e8f0e8]">
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-16">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-24">Unit price</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-24">Line total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2.5 text-gray-700 align-top">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2.5 text-gray-800">{item.description}</td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right text-gray-700 align-top">
                      {item.unit_price ? item.unit_price.toLocaleString("en-US", { style: "currency", currency: "USD" }) : ""}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right text-gray-800 align-top font-medium">
                      {item.line_total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 3 - estimate.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-300 px-3 py-3 bg-[#f5f8f5]" colSpan={4}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <table className="text-sm border-collapse min-w-[260px]">
              <tbody>
                <tr>
                  <td className="px-4 py-1.5 text-gray-600 text-right">Subtotal</td>
                  <td className="px-4 py-1.5 text-right text-gray-900 border border-gray-300 bg-[#e8f0e8] min-w-[110px]">
                    {subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-1.5 text-gray-600 text-right">Deposit</td>
                  <td className="px-4 py-1.5 text-right text-gray-900 border border-gray-300 bg-[#e8f0e8]">
                    {estimate.deposit.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-1.5 font-semibold text-gray-900 text-right">Total</td>
                  <td className="px-4 py-1.5 text-right font-semibold text-gray-900 border border-gray-300 bg-[#e8f0e8]">
                    {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            {estimate.cash_note && (
              <p className="text-sm font-semibold text-red-600">NOTE: {estimate.cash_note}</p>
            )}
            {estimate.notes && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
            )}
          </div>

          {/* Signature block (if signed) */}
          {estimate.signed_at && (
            <div className="border-t border-gray-200 pt-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Electronic Signature</p>
              <div className="flex flex-wrap items-end gap-8">
                {estimate.signature_url && (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={estimate.signature_url} alt="Signature" className="h-16 border-b border-gray-400" />
                    <p className="text-xs text-gray-500 mt-1">Signature</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 border-b border-gray-400 pb-0.5 min-w-[160px]">{estimate.signed_by_name}</p>
                  <p className="text-xs text-gray-500 mt-1">Printed name</p>
                </div>
                <div>
                  <p className="text-gray-800 border-b border-gray-400 pb-0.5">
                    {new Date(estimate.signed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Date</p>
                </div>
              </div>
            </div>
          )}

          {/* Signature line (if not signed) */}
          {!estimate.signed_at && (
            <div className="border-t border-gray-200 pt-6 space-y-5">
              <p className="text-sm text-gray-600">
                To accept this estimate sign and return{" "}
                <span className="inline-block border-b border-gray-500 w-48 sm:w-64 align-bottom">&nbsp;</span>
              </p>
              <p className="text-center text-sm font-medium text-gray-600">Thank you for your business!</p>
            </div>
          )}

        </div>
      </div>

      {/* Delivery log */}
      {sentAt && (
        <div className="rounded border border-gray-200 bg-white px-5 py-3 flex items-center gap-3">
          <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">
            Sent {new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {savedEmail && <> · <span className="text-gray-700">{savedEmail}</span></>}
          </p>
          {(status === "sent" || status === "draft") && (
            <button
              onClick={() => setShowSendModal(true)}
              className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
            >
              Resend
            </button>
          )}
        </div>
      )}

      {/* Declined banner */}
      {status === "declined" && (
        <div className="rounded border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">This estimate was declined by the client.</p>
          <p className="text-xs text-gray-500 mt-1">You may create a new estimate with revised terms.</p>
        </div>
      )}

      {/* Action bar */}
      {(status === "draft" || status === "sent") && (
        <div className="rounded border border-gray-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-500">
            {status === "draft" && "Ready to send to the customer?"}
            {status === "sent" && "Has the customer approved this estimate?"}
          </p>
          <div className="flex shrink-0 gap-2">
            {status === "draft" && (
              <>
                {confirmDiscard ? (
                  <>
                    <span className="text-sm text-gray-500 self-center">Discard this estimate?</span>
                    <button
                      onClick={() => setConfirmDiscard(false)}
                      className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDiscard}
                      disabled={discarding}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {discarding ? "Discarding…" : "Yes, discard"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmDiscard(true)}
                      className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => setShowSendModal(true)}
                      className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      Send to Client
                    </button>
                  </>
                )}
              </>
            )}
            {status === "sent" && (
              <>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Resend
                </button>
                <button
                  onClick={() => updateStatus("approved")}
                  disabled={updating}
                  className="rounded bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  Mark as Approved
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded border border-gray-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-500">Generate an invoice — line items are copied automatically.</p>
          <button
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shrink-0 transition-colors"
          >
            {generatingInvoice ? "Creating…" : "Generate Invoice"}
          </button>
        </div>
      )}

      {/* Invoice panel — shows after generating */}
      {status === "invoiced" && (
        <div className="rounded border border-emerald-200 bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Invoice Created</p>
                {invoiceId && (
                  <p className="text-xs text-gray-400 font-mono">
                    INV-{invoiceId.slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${INV_STATUS_BADGE[invoiceStatus]}`}>
              {invoiceStatus}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
            <div className="flex gap-2">
              {invoiceStatus === "draft" && (
                <button
                  onClick={() => updateInvoiceStatus("sent")}
                  disabled={updating}
                  className="rounded border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Mark as Sent
                </button>
              )}
              {invoiceStatus === "sent" && (
                <button
                  onClick={() => updateInvoiceStatus("paid")}
                  disabled={updating}
                  className="rounded border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                >
                  Mark as Paid
                </button>
              )}
              {invoiceStatus === "paid" && (
                <span className="text-sm font-medium text-emerald-600">Paid ✓</span>
              )}
            </div>
            <a
              href="/dashboard/invoices"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all invoices →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
