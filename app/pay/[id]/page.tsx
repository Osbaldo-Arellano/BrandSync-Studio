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

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, customer_name, status, total, amount_paid, estimate_id, tenant_id")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", invoice.tenant_id)
    .single();

  let deposit = 0;
  if (invoice.estimate_id) {
    const { data: estimate } = await admin
      .from("estimates")
      .select("deposit")
      .eq("id", invoice.estimate_id)
      .single();
    deposit = estimate?.deposit ?? 0;
  }

  const tenantName = tenant?.name ?? "";
  const total = invoice.total as number;
  const amountPaid = invoice.amount_paid as number;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{tenantName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="mt-1 text-gray-500 text-sm">{invoice.customer_name}</p>
        </div>

        {paid === "1" && invoice.status !== "paid" && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">Payment received ✓</p>
            <p className="text-xs text-gray-500 mt-1">Your payment is being processed.</p>
          </div>
        )}

        <div className="rounded border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
          </div>
          {amountPaid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid</span>
              <span className="font-semibold text-emerald-600">
                {amountPaid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4">
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
