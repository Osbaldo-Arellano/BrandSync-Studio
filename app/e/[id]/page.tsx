import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { SignaturePanel } from "./SignaturePanel";
import type { Estimate } from "@/types/estimates";
import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", id)
    .single();

  if (!row) notFound();

  const [{ data: tenantRow }, { data: brand }] = await Promise.all([
    admin.from("tenants").select(TENANT_FIELDS).eq("id", row.tenant_id).single(),
    admin.from("brands").select("logo_url, icon_url").eq("user_id", row.tenant_id).single(),
  ]);
  const tenantProfile: TenantProfile = {
    name: tenantRow?.name ?? "",
    ccb_number: tenantRow?.ccb_number ?? "",
    tagline: tenantRow?.tagline ?? "",
    email: tenantRow?.email ?? "",
    phone: tenantRow?.phone ?? "",
    website: tenantRow?.website ?? "",
    address_street: tenantRow?.address_street ?? "",
    address_city: tenantRow?.address_city ?? "",
    address_state: tenantRow?.address_state ?? "",
    address_zip: tenantRow?.address_zip ?? "",
    logo_url: brand?.logo_url ?? null,
    icon_url: brand?.icon_url ?? null,
  };
  const { street, cityLine, ccbLine } = formatTenantAddress(tenantProfile);
  const addrSubtitle = [street, cityLine].filter(Boolean).join(", ");

  const estimate: Estimate = {
    id: row.id,
    estimate_number: row.estimate_number ?? 0,
    customer_id: row.customer_id ?? null,
    customerName: row.customer_name ?? "",
    customerAddress: row.customer_address ?? "",
    customer_email: row.customer_email ?? null,
    customer_phone: row.customer_phone ?? null,
    salesperson: row.salesperson ?? "",
    job: row.job ?? "",
    payment_terms: row.payment_terms ?? "",
    due_date: row.due_date ?? "",
    status: row.status,
    cash_note: row.cash_note ?? "",
    notes: row.notes ?? "",
    deposit: row.deposit ?? 0,
    total: row.total ?? 0,
    created_at: row.created_at,
    sent_at: row.sent_at ?? null,
    signature_url: row.signature_url ?? null,
    signed_at: row.signed_at ?? null,
    signed_by_name: row.signed_by_name ?? null,
    signed_ip: row.signed_ip ?? null,
    items: (row.estimate_items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      estimate_id: item.estimate_id as string,
      description: (item.description as string) ?? "",
      quantity: (item.quantity as number) ?? 0,
      unit_price: (item.unit_price as number) ?? 0,
      line_total: (item.line_total as number) ?? 0,
    })),
  };

  const subtotal = estimate.items.reduce((s, i) => s + i.line_total, 0);
  const total = subtotal - estimate.deposit;
  const alreadySigned = !!estimate.signed_at;
  const alreadyDeclined = estimate.status === "declined";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{tenantProfile.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Your Estimate</h1>
          {estimate.job && <p className="mt-1 text-gray-500">{estimate.job}</p>}
        </div>

        {/* Document card */}
        <div className="rounded border border-gray-300 bg-white text-gray-900 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-10 space-y-6">

            {/* Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-5 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900">{tenantProfile.name}</h2>
                <p className="text-sm text-gray-500 leading-snug mt-0.5">
                  {addrSubtitle && <>{addrSubtitle}<br /></>}
                  {ccbLine && <>{ccbLine}<br /></>}
                  {tenantProfile.tagline || "Licensed, Bonded, Insured"}
                </p>
              </div>
              <div className="sm:text-right flex flex-col items-end gap-1">
                {tenantProfile.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenantProfile.logo_url} alt="Logo" className="max-h-14 max-w-[180px] object-contain" />
                )}
                <p className="text-base font-bold text-gray-900">Estimate</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(estimate.created_at).toLocaleDateString("en-US")}
                </p>
              </div>
            </div>

            {/* To */}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                To: {estimate.customerName}{estimate.customerAddress ? ` — ${estimate.customerAddress}` : ""}
              </p>
            </div>

            {/* Job info */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[380px]">
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
              <table className="w-full text-sm border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-[#e8f0e8]">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-14">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-24">Unit price</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-600 w-24">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-3 py-2.5 text-gray-700">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2.5 text-gray-800">{item.description}</td>
                      <td className="border border-gray-300 px-3 py-2.5 text-right text-gray-700">
                        {item.unit_price ? item.unit_price.toLocaleString("en-US", { style: "currency", currency: "USD" }) : ""}
                      </td>
                      <td className="border border-gray-300 px-3 py-2.5 text-right font-medium text-gray-800">
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
              <table className="text-sm border-collapse min-w-[240px]">
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
            {(estimate.cash_note || estimate.notes) && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {estimate.cash_note && (
                  <p className="text-sm font-semibold text-red-600">NOTE: {estimate.cash_note}</p>
                )}
                {estimate.notes && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
                )}
              </div>
            )}

            {/* Already signed block */}
            {alreadySigned && (
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
                      {new Date(estimate.signed_at!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Date</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Signature panel / status banners */}
        {alreadySigned ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-sm font-semibold text-emerald-700">This estimate has already been accepted and signed.</p>
            <p className="text-xs text-gray-500 mt-1">
              Signed by {estimate.signed_by_name} on {new Date(estimate.signed_at!).toLocaleDateString("en-US")}
            </p>
          </div>
        ) : alreadyDeclined ? (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">This estimate has been declined.</p>
            <p className="text-xs text-gray-500 mt-1">Contact {tenantProfile.name} if you&apos;d like to discuss revised terms.</p>
          </div>
        ) : (
          <SignaturePanel estimateId={id} tenant={tenantProfile} />
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          {tenantProfile.name}{addrSubtitle && ` · ${addrSubtitle}`}{tenantProfile.tagline && ` · ${tenantProfile.tagline}`}
        </p>
      </div>
    </div>
  );
}
