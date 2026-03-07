import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { PaymentButtons } from "./PaymentButtons";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const admin = createSupabaseAdminClient();

  const [{ data: invoice }, { data: itemRows }] = await Promise.all([
    admin
      .from("invoices")
      .select("id, customer_name, status, total, amount_paid, estimate_id, tenant_id")
      .eq("id", id)
      .single(),
    admin
      .from("invoice_items")
      .select("id, description, quantity, unit_price")
      .eq("invoice_id", id),
  ]);

  if (!invoice) notFound();

  const [{ data: tenant }, depositResult] = await Promise.all([
    admin.from("tenants").select("name").eq("id", invoice.tenant_id).single(),
    invoice.estimate_id
      ? admin.from("estimates").select("deposit").eq("id", invoice.estimate_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const deposit =
    (depositResult as { data: { deposit: number } | null } | null)?.data?.deposit ?? 0;

  const tenantName = tenant?.name ?? "";
  const total = invoice.total as number;
  const amountPaid = (invoice.amount_paid as number) ?? 0;
  const items = itemRows ?? [];
  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {tenantName}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">{invoice.customer_name}</p>
        </div>

        {/* Processing banner (webhook may not have fired yet) */}
        {paid === "1" && !isPaid && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">Payment received ✓</p>
            <p className="text-xs text-gray-500 mt-1">Your payment is being processed.</p>
          </div>
        )}

        {/* Invoice card */}
        <div className="rounded border border-gray-200 bg-white">
          {/* Line items table */}
          {items.length > 0 && (
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <span>Description</span>
                <span className="text-right w-10">Qty</span>
                <span className="text-right w-20">Unit</span>
                <span className="text-right w-20">Amount</span>
              </div>
              {items.map((item) => {
                const lineTotal =
                  (item.quantity as number) * (item.unit_price as number);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-5 py-3 text-sm"
                  >
                    <span className="text-gray-700">{item.description || "—"}</span>
                    <span className="text-right w-10 text-gray-500 tabular-nums">
                      {item.quantity}
                    </span>
                    <span className="text-right w-20 text-gray-500 tabular-nums">
                      {(item.unit_price as number).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                    <span className="text-right w-20 font-medium text-gray-900 tabular-nums">
                      {lineTotal.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-gray-200 px-5 py-4 space-y-2">
            {deposit > 0 && amountPaid === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit due</span>
                <span className="text-gray-700 tabular-nums">
                  {deposit.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
              </div>
            )}
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit paid</span>
                <span className="font-medium text-emerald-600 tabular-nums">
                  −
                  {amountPaid.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-gray-100 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900 tabular-nums">
                {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </span>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="border-t border-gray-100 px-5 py-5">
            <PaymentButtons
              invoiceId={id}
              total={total}
              amountPaid={amountPaid}
              deposit={deposit}
              status={invoice.status}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">Secured by Stripe</p>
      </div>
    </div>
  );
}
