"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  total: number;
  amountPaid: number;
  deposit: number;
  status: string;
}

type Outcome = "cash" | "deferred";

export function PaymentButtons({ invoiceId, total, amountPaid, deposit, status }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const remaining = total - amountPaid;

  async function recordOffline(choice: "cash" | "deferred") {
    setLoading(choice);
    try {
      const res = await fetch(`/api/pay/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: choice }),
      });
      if (res.ok) {
        setOutcome(choice);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to save preference");
      }
    } finally {
      setLoading(null);
    }
  }

  async function pay(type: "deposit" | "full") {
    setLoading(type);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to start checkout");
      }
    } finally {
      setLoading(null);
    }
  }

  if (status === "paid") {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 px-6 py-5 text-center">
        <p className="text-sm font-semibold text-emerald-700">Paid in full ✓</p>
        <p className="text-xs text-gray-500 mt-1">Thank you — your payment has been received.</p>
      </div>
    );
  }

  if (outcome === "cash") {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 px-6 py-5 text-center space-y-1">
        <p className="text-sm font-semibold text-gray-800">Cash payment selected</p>
        <p className="text-xs text-gray-500">
          Please bring your payment when work begins or as arranged with us. We'll mark your
          invoice paid once received.
        </p>
      </div>
    );
  }

  if (outcome === "deferred") {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 px-6 py-5 text-center space-y-1">
        <p className="text-sm font-semibold text-gray-800">You can pay later</p>
        <p className="text-xs text-gray-500">
          We'll send a payment reminder when it's due. Reach out anytime if you have questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status === "partial" && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Deposit received. Remaining balance:{" "}
          <strong>
            {remaining.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </strong>
        </div>
      )}

      {/* Primary: pay online */}
      {status !== "partial" && deposit > 0 && (
        <button
          onClick={() => pay("deposit")}
          disabled={!!loading}
          className="w-full rounded border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "deposit"
            ? "Redirecting…"
            : `Pay Deposit — ${deposit.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
        </button>
      )}

      <button
        onClick={() => pay("full")}
        disabled={!!loading}
        className="w-full rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading === "full"
          ? "Redirecting…"
          : `Pay ${status === "partial" ? "Remaining Balance" : "Full Amount"} — ${remaining.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
      </button>

      {/* Secondary: offline options */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => recordOffline("cash")}
          disabled={!!loading}
          className="flex-1 rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "cash" ? "Saving…" : "Pay in cash"}
        </button>
        <button
          onClick={() => recordOffline("deferred")}
          disabled={!!loading}
          className="flex-1 rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "deferred" ? "Saving…" : "Pay later"}
        </button>
      </div>
    </div>
  );
}
