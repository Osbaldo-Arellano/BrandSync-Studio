"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  total: number;
  amountPaid: number;
  deposit: number;
  status: string;
  cashappTag?: string | null;
  cashappQrSvg?: string | null;
}

type Outcome = "cash" | "deferred" | "cashapp";

export function PaymentButtons({ invoiceId, total, amountPaid, deposit, status, cashappTag, cashappQrSvg }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const remaining = total - amountPaid;

  async function recordOffline(choice: "cash" | "deferred" | "cashapp") {
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

  if (outcome === "cashapp") {
    return (
      <div className="space-y-4">
        <div className="rounded border border-green-200 bg-green-50 px-5 py-4 text-center space-y-1">
          <p className="text-sm font-semibold text-green-800">Cash App payment noted</p>
          <p className="text-xs text-gray-500">
            Scan the code or tap the button below to complete your payment. Once sent, let us know so we can confirm receipt.
          </p>
        </div>
        {cashappTag && cashappQrSvg && (
          <div className="rounded border border-gray-200 px-5 py-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div
                className="w-36 h-36 shrink-0"
                dangerouslySetInnerHTML={{ __html: cashappQrSvg }}
              />
              <div className="space-y-2 text-center sm:text-left">
                <a
                  href={`https://cash.app/$${cashappTag}/${(total - amountPaid).toFixed(2)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded bg-[#00D632] px-5 py-2 text-sm font-semibold text-white hover:bg-[#00b82b] transition-colors"
                >
                  Open Cash App — ${cashappTag}
                </a>
                <p className="text-xs text-gray-400">
                  {(total - amountPaid).toLocaleString("en-US", { style: "currency", currency: "USD" })} due
                </p>
              </div>
            </div>
          </div>
        )}
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

      {/* Stripe checkout — disabled */}
      {/* {status !== "partial" && deposit > 0 && (
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
      </button> */}

      {/* Cash App */}
      {cashappTag && cashappQrSvg && (
        <button
          onClick={() => recordOffline("cashapp")}
          disabled={!!loading}
          className="w-full rounded border border-[#00D632] bg-white px-6 py-3 text-sm font-semibold text-[#009922] hover:bg-green-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="#00D632">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.026 7.32l-.42 1.574c-.07.262-.367.393-.613.263a3.614 3.614 0 0 0-1.617-.39c-.595 0-1.01.262-1.01.682 0 .448.42.634 1.29.896 1.458.44 2.338 1.05 2.338 2.394 0 1.43-1.08 2.394-2.8 2.54l-.182.683c-.07.262-.367.393-.612.263l-.98-.525c-.262-.14-.35-.455-.193-.7l.42-1.574c.07-.262.367-.393.612-.263.56.28 1.22.42 1.89.42.63 0 1.08-.26 1.08-.73 0-.44-.35-.63-1.36-.95-1.35-.43-2.24-1.05-2.24-2.37 0-1.36 1.05-2.34 2.73-2.49l.175-.656c.07-.263.367-.394.613-.263l.98.524c.263.14.35.455.193.7z"/>
          </svg>
          {loading === "cashapp"
            ? "Saving…"
            : `Pay via Cash App — $${cashappTag} · ${(total - amountPaid).toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
        </button>
      )}

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
