"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TenantProfile } from "@/types/tenant";

interface FormLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

function newItem(): FormLineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, line_total: 0 };
}

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const STEPS = ["Customer", "Line items", "Details"] as const;

// ── Bottom sheet for adding / editing a line item ────────────────────────────
function ItemSheet({
  item,
  onSave,
  onCancel,
}: {
  item: FormLineItem;
  onSave: (item: FormLineItem) => void;
  onCancel: () => void;
}) {
  const [desc, setDesc] = useState(item.description);
  const [qty, setQty] = useState(item.quantity);
  const [price, setPrice] = useState(item.unit_price);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => descRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const lineTotal = qty * price;

  function handleSave() {
    if (!desc.trim()) return;
    onSave({ ...item, description: desc.trim(), quantity: qty, unit_price: price, line_total: lineTotal });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t border-t border-gray-200 bg-white px-5 pt-4 pb-8 space-y-4 animate-slide-up shadow-xl">
        {/* Handle */}
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />

        <h3 className="text-base font-semibold text-gray-900">
          {item.description ? "Edit item" : "Add item"}
        </h3>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea
            ref={descRef}
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Panel upgrade — labor (8 hrs)"
            className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Qty + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity</label>
            <div className="flex items-center rounded border border-gray-300 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(0.5, parseFloat((q - 0.5).toFixed(2))))}
                className="px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-lg font-medium transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                step="0.5"
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-transparent text-center text-sm text-gray-900 focus:outline-none py-3 min-w-0"
              />
              <button
                type="button"
                onClick={() => setQty((q) => parseFloat((q + 0.5).toFixed(2)))}
                className="px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-lg font-medium transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit price</label>
            <div className="flex items-center rounded border border-gray-300 bg-white px-4 overflow-hidden">
              <span className="text-gray-400 text-sm shrink-0">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price || ""}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none py-3 pl-1 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* Line total preview */}
        <div className="flex justify-between items-center px-1">
          <span className="text-sm text-gray-500">Line total</span>
          <span className="text-base font-semibold text-gray-900">{usd(lineTotal)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!desc.trim()}
            className="flex-1 rounded bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {item.description ? "Update" : "Add to estimate"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────
export function NewEstimateFormMobile({ tenant }: { tenant: TenantProfile }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [job, setJob] = useState("");

  const [items, setItems] = useState<FormLineItem[]>([]);
  const [sheetItem, setSheetItem] = useState<FormLineItem | null>(null);

  const [salesperson, setSalesperson] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("End of project");
  const [isTBD, setIsTBD] = useState(true);
  const [dateValue, setDateValue] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [cashNote, setCashNote] = useState("-$500.00 off if paid in cash");
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const total = subtotal - deposit;
  const dueDate = isTBD ? "TBD" : dateValue;

  function openSheet(item?: FormLineItem) {
    setSheetItem(item ?? newItem());
  }

  function saveItem(updated: FormLineItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx === -1) return [...prev, updated];
      return prev.map((i) => (i.id === updated.id ? updated : i));
    });
    setSheetItem(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const step1Valid = customerName.trim().length > 0;

  function nextStep() {
    if (step === 0 && !step1Valid) return;
    setStep((s) => Math.min(s + 1, 2));
  }

  async function handleSubmit() {
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

  const inp = "w-full rounded border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none";

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-gray-200 bg-white">
        {step === 0 ? (
          <Link href="/dashboard/estimates" className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        )}
        <div className="flex-1 flex items-center gap-1.5 px-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{step + 1} / {STEPS.length}</span>
      </div>

      {/* ── Step label ── */}
      <div className="shrink-0 px-5 pt-6 pb-2">
        <h2 className="text-xl font-bold text-gray-900">{STEPS[step]}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {step === 0 && "Who is this estimate for?"}
          {step === 1 && "What work needs to be done?"}
          {step === 2 && "Any additional details? (all optional)"}
        </p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Step 1 — Customer */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Customer name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Company or person name"
                autoFocus
                className={inp}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Job site address
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="123 Main St, Portland, OR 97201"
                className={inp}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Job description
              </label>
              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="e.g. Panel upgrade, EV charger install"
                className={inp}
              />
            </div>
          </>
        )}

        {/* Step 2 — Line items */}
        {step === 1 && (
          <>
            {items.length === 0 && (
              <div className="rounded border border-dashed border-gray-300 px-5 py-10 text-center bg-white">
                <p className="text-sm text-gray-400">No items yet.</p>
                <p className="text-xs text-gray-400 mt-1">Tap below to add your first line item.</p>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded border border-gray-200 bg-white px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => openSheet(item)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantity} × {usd(item.unit_price)} = <span className="text-gray-700 font-medium">{usd(item.line_total)}</span>
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 rounded hover:bg-gray-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openSheet()}
              className="w-full rounded border border-dashed border-gray-300 py-3.5 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white"
            >
              + Add line item
            </button>
          </>
        )}

        {/* Step 3 — Details */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Salesperson</label>
              <input
                type="text"
                value={salesperson}
                onChange={(e) => setSalesperson(e.target.value)}
                placeholder="Name"
                className={inp}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={inp}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Due date</label>
              {isTBD ? (
                <div className="flex items-center gap-3">
                  <span className={`${inp} flex-1 text-gray-400`}>TBD</span>
                  <button
                    type="button"
                    onClick={() => setIsTBD(false)}
                    className="shrink-0 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Set date
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className={`${inp} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsTBD(true)}
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
                  >
                    TBD
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Deposit</label>
              <div className="flex items-center rounded border border-gray-300 bg-white px-4">
                <span className="text-gray-400 text-sm shrink-0">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={deposit || ""}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none py-3.5 pl-1 min-w-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cash discount note</label>
              <input
                type="text"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
                className="w-full rounded border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 placeholder-red-300 focus:border-red-400 focus:outline-none"
                placeholder="-$500.00 off if paid in cash"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={"Plywood $75.00/sheet\nFasia boards $200.00 (20 ft)"}
                className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </>
        )}
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 space-y-3">
        {/* Running total (steps 1+2) */}
        {step < 2 && subtotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            <span className="font-semibold text-gray-900">{usd(subtotal)}</span>
          </div>
        )}

        {/* Summary on step 3 */}
        {step === 2 && (
          <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{usd(subtotal)}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Deposit</span>
                <span>− {usd(deposit)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{usd(total)}</span>
            </div>
          </div>
        )}

        {/* Primary action */}
        {step < 2 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={step === 0 && !step1Valid}
            className="w-full rounded bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {step === 1 && items.length === 0 ? "Skip for now" : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Estimate"}
          </button>
        )}
      </div>

      {/* ── Item bottom sheet ── */}
      {sheetItem && (
        <ItemSheet
          item={sheetItem}
          onSave={saveItem}
          onCancel={() => setSheetItem(null)}
        />
      )}
    </div>
  );
}
