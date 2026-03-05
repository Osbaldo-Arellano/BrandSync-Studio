"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

interface FormLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

function newLineItem(): FormLineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, line_total: 0 };
}

/** Currency input: formats with commas as the user types, 2 decimals on blur */
function USDInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focused = useRef(false);

  function toDisplay(n: number) {
    return n ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "";
  }

  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    if (!focused.current) setDisplay(toDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cursor = e.target.selectionStart ?? raw.length;
    const sigBefore = raw.slice(0, cursor).replace(/[^0-9.]/g, "").length;
    const stripped = raw.replace(/[^0-9.]/g, "");
    const dotIdx = stripped.indexOf(".");
    const cleaned =
      dotIdx === -1
        ? stripped
        : stripped.slice(0, dotIdx + 1) +
          stripped.slice(dotIdx + 1).replace(/\./g, "").slice(0, 2);
    const [intPart = "", decPart] = cleaned.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = decPart !== undefined ? `$${formattedInt}.${decPart}` : (formattedInt ? `$${formattedInt}` : "");
    setDisplay(formatted);
    onChange(parseFloat(cleaned) || 0);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let sig = 0;
      let pos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9.]/.test(formatted[i])) sig++;
        if (sig === sigBefore) { pos = i + 1; break; }
      }
      inputRef.current.setSelectionRange(pos, pos);
    });
  }

  function handleBlur() {
    focused.current = false;
    const n = parseFloat(display.replace(/[$,]/g, "")) || 0;
    setDisplay(n ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "");
    onChange(n);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder ?? ""}
      value={display}
      onFocus={() => { focused.current = true; }}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  );
}

export function NewEstimateForm({ tenant }: { tenant: TenantProfile }) {
  const { street, cityLine, ccbLine } = formatTenantAddress(tenant);
  const addrSubtitle = [street, cityLine].filter(Boolean).join(", ");
  const logoUrl = tenant.logo_url ?? null;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [job, setJob] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("End of project");
  const [isTBD, setIsTBD] = useState(true);
  const [dateValue, setDateValue] = useState("");
  const [items, setItems] = useState<FormLineItem[]>([newLineItem()]);
  const [deposit, setDeposit] = useState(0);
  const [cashNote, setCashNote] = useState("-$500.00 off if paid in cash");
  const [notes, setNotes] = useState("");

  const dueDate = isTBD ? "TBD" : dateValue;
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const total = subtotal - deposit;

  function updateItem(id: string, patch: Partial<FormLineItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (("quantity" in patch || "unit_price" in patch) && !("line_total" in patch)) {
          next.line_total = next.quantity * next.unit_price;
        }
        return next;
      }),
    );
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName, customerAddress, salesperson, job,
          paymentTerms, dueDate, deposit, cashNote, notes, items, total,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSaveError(error ?? "Failed to save estimate");
        return;
      }
      const { id } = await res.json();
      router.push(`/dashboard/estimates/${id}`);
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/estimates"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Estimates
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">New Estimate</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Document card ── */}
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
                <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString("en-US")}</p>
              </div>
            </div>

            {/* To / Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Customer name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Company or person name"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Job site address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main St, Portland, OR 97201"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Job info table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[480px]">
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
                    <td className="border border-gray-300 px-2 py-1.5">
                      <input
                        type="text"
                        value={salesperson}
                        onChange={(e) => setSalesperson(e.target.value)}
                        placeholder="Name"
                        className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <input
                        type="text"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        placeholder="Job description"
                        className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <input
                        type="text"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full text-sm text-gray-900 focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {isTBD ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">TBD</span>
                          <button
                            type="button"
                            onClick={() => setIsTBD(false)}
                            className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            Set date
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            className="text-sm text-gray-900 focus:outline-none bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setIsTBD(true)}
                            className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
                          >
                            TBD
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-[#e8f0e8]">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-16">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-28">Unit price</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-28">Line total</th>
                    <th className="border border-gray-300 w-7"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-sm text-gray-900 text-center focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, { description: e.target.value })
                          }
                          placeholder="e.g. Panel upgrade — labor (8 hrs)"
                          className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <USDInput
                          value={item.unit_price}
                          onChange={(v) => updateItem(item.id, { unit_price: v })}
                          placeholder="$0.00"
                          className="w-full text-sm text-gray-900 text-right focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <USDInput
                          value={item.line_total}
                          onChange={(v) => updateItem(item.id, { line_total: v })}
                          placeholder="$0.00"
                          className="w-full text-sm text-gray-900 text-right focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="border border-gray-300 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-gray-300 hover:text-red-500 disabled:opacity-20 p-1"
                          aria-label="Remove line"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, newLineItem()])}
                className="mt-2 text-xs text-gray-500 hover:text-gray-800"
              >
                + Add line
              </button>
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
                    <td className="border border-gray-300 bg-[#e8f0e8] px-2 py-1">
                      <USDInput
                        value={deposit}
                        onChange={setDeposit}
                        placeholder="$0.00"
                        className="w-full text-sm text-gray-900 text-right focus:outline-none bg-transparent"
                      />
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

            {/* NOTE */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-red-600 whitespace-nowrap pt-1.5">NOTE:</span>
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="flex-1 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-sm text-red-700 placeholder-red-300 focus:border-red-400 focus:outline-none"
                  placeholder="-$500.00 off if paid in cash"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Additional notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder={"Plywood $75.00 a sheet\nFasia boards $200.00 (20 ft)\nSkylight (standard 2x4) $650"}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-y"
                />
              </div>
            </div>

            {/* Signature */}
            <div className="border-t border-gray-200 pt-6 space-y-5">
              <p className="text-sm text-gray-600">
                To accept this estimate sign and return{" "}
                <span className="inline-block border-b border-gray-500 w-48 sm:w-64 align-bottom">&nbsp;</span>
              </p>
              <p className="text-center text-sm font-medium text-gray-600">Thank you for your business!</p>
            </div>

          </div>
        </div>

        {/* Submit bar */}
        {saveError && (
          <p className="text-sm text-red-600 text-right">{saveError}</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Link
            href="/dashboard/estimates"
            className="rounded border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 text-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Estimate"}
          </button>
        </div>

      </form>
    </div>
  );
}
