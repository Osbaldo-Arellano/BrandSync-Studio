"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface CustomerSuggestion {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

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
    const stripped = raw.replace(/[^0-9.]/g, "");
    const dotIdx = stripped.indexOf(".");
    const cleaned =
      dotIdx === -1
        ? stripped
        : stripped.slice(0, dotIdx + 1) + stripped.slice(dotIdx + 1).replace(/\./g, "").slice(0, 2);
    const [intPart = "", decPart] = cleaned.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = decPart !== undefined ? `$${formattedInt}.${decPart}` : (formattedInt ? `$${formattedInt}` : "");
    setDisplay(formatted);
    onChange(parseFloat(cleaned) || 0);
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

export function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId") ?? "";
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState(searchParams.get("customerName") ?? "");
  const [customerAddress, setCustomerAddress] = useState(searchParams.get("customerAddress") ?? "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("customerPhone") ?? "");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [allCustomers, setAllCustomers] = useState<CustomerSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.ok ? r.json() : [])
      .then((data: CustomerSuggestion[]) => setAllCustomers(data))
      .catch(() => {});
  }, []);

  function handleCustomerNameChange(val: string) {
    setCustomerName(val);
    if (!val.trim()) { setSuggestions([]); return; }
    const lower = val.toLowerCase();
    setSuggestions(
      allCustomers.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 5)
    );
  }

  function selectCustomer(c: CustomerSuggestion) {
    setCustomerName(c.name);
    setCustomerAddress(c.address ?? "");
    setCustomerEmail(c.email ?? "");
    setCustomerPhone(c.phone ?? "");
    setSuggestions([]);
  }
  const [items, setItems] = useState<FormLineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const taxAmount = (subtotal - discountAmount) > 0 ? ((subtotal - discountAmount) * taxRate) / 100 : 0;
  const total = subtotal - discountAmount + taxAmount;

  function updateItem(id: string, patch: Partial<FormLineItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if ("line_total" in patch && !("unit_price" in patch) && !("quantity" in patch)) {
          // User edited total directly — back-calculate unit_price
          next.unit_price = next.quantity > 0 ? next.line_total / next.quantity : next.line_total;
        } else if ("quantity" in patch || "unit_price" in patch) {
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
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          paymentTerms: paymentTerms || null,
          items,
          total,
          notes,
          dueDate: dueDate || null,
          taxRate,
          taxAmount,
          discountAmount,
          jobId: jobIdParam || undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSaveError(error ?? "Failed to create invoice");
        return;
      }
      const { id } = await res.json();
      router.push(`/dashboard/invoices/${id}`);
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/invoices" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Invoices
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">New Invoice</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded border border-gray-200 bg-white p-6 space-y-5">

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Customer name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder="Company or person name"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto">
                  {suggestions.map((c) => (
                    <li
                      key={c.id}
                      onMouseDown={() => selectCustomer(c)}
                      className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer"
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone && <span className="text-gray-400 ml-2 text-xs">{c.phone}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Customer email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Address
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="123 Main St, Portland, OR 97201"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Customer phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(503) 555-0100"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Payment terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30, Due on receipt"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>


          {/* Line items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Line Items</p>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="rounded border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-20 p-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Service description"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded border border-gray-300 px-2 py-2 text-sm text-gray-900 text-center focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                      <USDInput
                        value={item.unit_price}
                        onChange={(v) => updateItem(item.id, { unit_price: v })}
                        placeholder="$0.00"
                        className="w-full rounded border border-gray-300 px-2 py-2 text-sm text-gray-900 text-right focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Total</label>
                      <USDInput
                        value={item.line_total}
                        onChange={(v) => updateItem(item.id, { line_total: v })}
                        placeholder="$0.00"
                        className="w-full rounded border border-gray-300 px-2 py-2 text-sm text-gray-900 text-right focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, newLineItem()])}
                className="w-full rounded border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Add line item
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 w-16">Qty</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-600 w-28">Unit Price</th>
                    <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-600 w-28">Total</th>
                    <th className="border border-gray-200 w-7"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-200 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full text-sm text-gray-900 text-center focus:outline-none"
                        />
                      </td>
                      <td className="border border-gray-200 px-2 py-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Service description"
                          className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                        />
                      </td>
                      <td className="border border-gray-200 px-2 py-1">
                        <USDInput
                          value={item.unit_price}
                          onChange={(v) => updateItem(item.id, { unit_price: v })}
                          placeholder="$0.00"
                          className="w-full text-sm text-gray-900 text-right focus:outline-none"
                        />
                      </td>
                      <td className="border border-gray-200 px-2 py-1">
                        <USDInput
                          value={item.line_total}
                          onChange={(v) => updateItem(item.id, { line_total: v })}
                          placeholder="$0.00"
                          className="w-full text-sm text-gray-900 text-right focus:outline-none"
                        />
                      </td>
                      <td className="border border-gray-200 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-gray-300 hover:text-red-500 disabled:opacity-20 p-1"
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
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="shrink-0">Discount</span>
                <div className="ml-auto w-28">
                  <USDInput
                    value={discountAmount}
                    onChange={setDiscountAmount}
                    placeholder="$0.00"
                    className="w-full text-sm text-right border border-gray-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="shrink-0">Tax Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="ml-auto w-28 text-sm text-right border border-gray-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax ({taxRate}%)</span>
                  <span>{taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes for the customer…"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-y"
            />
          </div>
        </div>

        {saveError && <p className="text-sm text-red-600 text-right">{saveError}</p>}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Link
            href="/dashboard/invoices"
            className="rounded border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 text-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
