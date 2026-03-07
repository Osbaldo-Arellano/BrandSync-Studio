"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type EstimateSummary = {
  id: string;
  estimate_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
};

type InvoiceSummary = {
  id: string;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EST_BADGE: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const INV_BADGE: Record<string, string> = {
  draft:   "bg-gray-100 text-gray-600 border border-gray-200",
  sent:    "bg-blue-50 text-blue-700 border border-blue-200",
  paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-50 text-red-700 border border-red-200",
  partial: "bg-amber-50 text-amber-700 border border-amber-200",
};

function KpiCard({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string;
  value: string;
  sub: string;
  accentClass: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded p-4 border-t-2 ${accentClass}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  barClass,
  href,
}: {
  label: string;
  count: number;
  total: number;
  barClass: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 group rounded hover:bg-gray-50 -mx-1 px-1 py-0.5 transition-colors"
    >
      <span className="text-xs text-gray-500 w-16 shrink-0 group-hover:text-gray-700">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-5 text-right">{count}</span>
    </Link>
  );
}

export function DashboardHome({
  estimates,
  invoices,
  tenantName,
}: {
  estimates: EstimateSummary[];
  invoices: InvoiceSummary[];
  tenantName: string;
}) {
  const router = useRouter();

  // KPIs
  const revenue     = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const overdue     = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const pipeline    = estimates.filter(e => ["draft","sent","approved"].includes(e.status)).reduce((s, e) => s + e.total, 0);

  // Estimate counts
  const estDraft    = estimates.filter(e => e.status === "draft").length;
  const estSent     = estimates.filter(e => e.status === "sent").length;
  const estApproved = estimates.filter(e => e.status === "approved").length;
  const estInvoiced = estimates.filter(e => e.status === "invoiced").length;
  const estDeclined = estimates.filter(e => e.status === "declined").length;
  const estTotal    = estimates.length;

  // Invoice counts
  const invDraft   = invoices.filter(i => i.status === "draft").length;
  const invSent    = invoices.filter(i => i.status === "sent").length;
  const invPaid    = invoices.filter(i => i.status === "paid").length;
  const invOverdue = invoices.filter(i => i.status === "overdue").length;
  const invTotal   = invoices.length;

  // Needs attention
  const approvedEstimates = estimates.filter(e => e.status === "approved");
  const sentEstimates     = estimates.filter(e => e.status === "sent");
  const overdueInvoices   = invoices.filter(i => i.status === "overdue");
  const hasAttention      = approvedEstimates.length > 0 || overdueInvoices.length > 0;

  // Today widget
  const weekAgo       = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const paidThisWeek  = invoices
    .filter(i => i.status === "paid" && new Date(i.created_at).getTime() >= weekAgo)
    .reduce((s, i) => s + i.total, 0);

  // Recent
  const recentEstimates = estimates.slice(0, 6);
  const recentInvoices  = invoices.slice(0, 6);

  // Greeting
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today    = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {greeting}{tenantName ? `, ${tenantName}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/dashboard/estimates/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + New Estimate
          </Link>
          <Link
            href="/dashboard/print"
            className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Order Prints
          </Link>
        </div>
      </div>

      {/* Today */}
      <div className="bg-white border border-gray-200 rounded px-5 py-3 flex items-center gap-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Today</p>
        {sentEstimates.length === 0 && invSent === 0 && paidThisWeek === 0 ? (
          <span className="text-sm text-gray-400">All clear — nothing needs action today.</span>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {sentEstimates.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{sentEstimates.length}</span> awaiting signature
                </span>
                {(invSent > 0 || paidThisWeek > 0) && <span className="text-gray-200 select-none">|</span>}
              </>
            )}
            {invSent > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{invSent}</span> invoice{invSent !== 1 ? "s" : ""} sent
                </span>
                {paidThisWeek > 0 && <span className="text-gray-200 select-none">|</span>}
              </>
            )}
            {paidThisWeek > 0 && (
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-emerald-600">{fmt(paidThisWeek)}</span> paid this week
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue"
          value={fmt(revenue)}
          sub={`${invPaid} paid invoice${invPaid !== 1 ? "s" : ""}`}
          accentClass="border-t-emerald-500"
        />
        <KpiCard
          label="Outstanding"
          value={fmt(outstanding)}
          sub={`${invSent} awaiting payment`}
          accentClass="border-t-blue-500"
        />
        <KpiCard
          label="Pipeline"
          value={fmt(pipeline)}
          sub={`${estDraft + estSent + estApproved} active estimate${estDraft + estSent + estApproved !== 1 ? "s" : ""}`}
          accentClass="border-t-amber-400"
        />
        <KpiCard
          label="Overdue"
          value={fmt(overdue)}
          sub={`${invOverdue} overdue invoice${invOverdue !== 1 ? "s" : ""}`}
          accentClass="border-t-red-400"
        />
      </div>

      {/* Needs attention */}
      {hasAttention && (
        <div className="bg-amber-50 border border-amber-200 rounded px-5 py-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-4">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Needs Attention
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {approvedEstimates.length > 0 && (
              <div className="flex flex-col items-start gap-1.5">
                <Link
                  href="/dashboard/estimates"
                  className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                  Convert {approvedEstimates.length} Estimate{approvedEstimates.length !== 1 ? "s" : ""} to Invoice{approvedEstimates.length !== 1 ? "s" : ""}
                </Link>
                <Link href="/dashboard/estimates" className="text-xs font-medium text-amber-700 hover:text-amber-900 self-end">
                  View →
                </Link>
              </div>
            )}
            {sentEstimates.length > 0 && (
              <div className="flex flex-col items-start gap-1.5">
                <Link
                  href="/dashboard/estimates"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {sentEstimates.length} Estimate{sentEstimates.length !== 1 ? "s" : ""} Awaiting Signature
                </Link>
                <Link href="/dashboard/estimates" className="text-xs font-medium text-blue-600 hover:text-blue-800 self-end">
                  Open →
                </Link>
              </div>
            )}
            {overdueInvoices.length > 0 && (
              <div className="flex flex-col items-start gap-1.5">
                <Link
                  href="/dashboard/invoices"
                  className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  {overdueInvoices.length} Overdue Invoice{overdueInvoices.length !== 1 ? "s" : ""} — {fmt(overdue)} Unpaid
                </Link>
                <Link href="/dashboard/invoices" className="text-xs font-medium text-red-600 hover:text-red-800 self-end">
                  Open →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Estimates */}
        <div className="bg-white border border-gray-200 rounded px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Estimates</p>
            <Link href="/dashboard/estimates" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            <StatusBar label="Draft"    count={estDraft}    total={estTotal} barClass="bg-gray-300"   href="/dashboard/estimates?status=draft" />
            <StatusBar label="Sent"     count={estSent}     total={estTotal} barClass="bg-blue-400"   href="/dashboard/estimates?status=sent" />
            <StatusBar label="Approved" count={estApproved} total={estTotal} barClass="bg-amber-400"  href="/dashboard/estimates?status=approved" />
            <StatusBar label="Invoiced" count={estInvoiced} total={estTotal} barClass="bg-emerald-400" href="/dashboard/estimates?status=invoiced" />
            <StatusBar label="Declined" count={estDeclined} total={estTotal} barClass="bg-red-300"    href="/dashboard/estimates?status=declined" />
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
            {estTotal} total · {fmt(estimates.reduce((s, e) => s + e.total, 0))} lifetime value
          </p>
        </div>

        {/* Invoices */}
        <div className="bg-white border border-gray-200 rounded px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Invoices</p>
            <Link href="/dashboard/invoices" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            <StatusBar label="Draft"   count={invDraft}   total={invTotal} barClass="bg-gray-300"    href="/dashboard/invoices?status=draft" />
            <StatusBar label="Sent"    count={invSent}    total={invTotal} barClass="bg-blue-400"    href="/dashboard/invoices?status=sent" />
            <StatusBar label="Paid"    count={invPaid}    total={invTotal} barClass="bg-emerald-400" href="/dashboard/invoices?status=paid" />
            <StatusBar label="Overdue" count={invOverdue} total={invTotal} barClass="bg-red-400"     href="/dashboard/invoices?status=overdue" />
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
            {invTotal} total · collection rate{" "}
            {invTotal > 0
              ? `${Math.round((invPaid / invTotal) * 100)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent estimates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Estimates</h2>
            <Link href="/dashboard/estimates/new" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + New
            </Link>
          </div>
          {recentEstimates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
              <p className="text-sm text-gray-400">No estimates yet.</p>
              <Link href="/dashboard/estimates/new" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700 font-medium">
                Create your first →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {recentEstimates.map((est) => (
                    <tr
                      key={est.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/estimates/${est.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{est.customer_name || "—"}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          EST-{new Date(est.created_at).getFullYear()}-{String(est.estimate_number).padStart(3, "0")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${EST_BADGE[est.status] ?? ""}`}>
                          {est.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-lg font-semibold text-gray-900">{fmt(est.total)}</p>
                        <p className="text-xs text-gray-400">{fmtDate(est.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/dashboard/invoices" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
              <p className="text-sm text-gray-400">No invoices yet.</p>
              <p className="text-xs text-gray-400 mt-1">Convert an approved estimate to generate one.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{inv.customer_name || "—"}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          INV-{inv.id.slice(0, 8).toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${INV_BADGE[inv.status] ?? ""}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-lg font-semibold text-gray-900">{fmt(inv.total)}</p>
                        <p className="text-xs text-gray-400">{fmtDate(inv.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Print / brand shortcuts */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Brand & Print</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/print"
            className="flex flex-col items-center gap-2 rounded border border-gray-200 px-5 py-4 hover:bg-gray-50 hover:border-gray-300 transition-colors w-28 text-center"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 leading-tight">Business Cards</span>
          </Link>
          <Link
            href="/dashboard/print"
            className="flex flex-col items-center gap-2 rounded border border-gray-200 px-5 py-4 hover:bg-gray-50 hover:border-gray-300 transition-colors w-28 text-center"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 leading-tight">Envelopes</span>
          </Link>
          <Link
            href="/dashboard/print"
            className="flex flex-col items-center gap-2 rounded border border-gray-200 px-5 py-4 hover:bg-gray-50 hover:border-gray-300 transition-colors w-28 text-center"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 leading-tight">Stickers</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex flex-col items-center gap-2 rounded border border-gray-200 px-5 py-4 hover:bg-gray-50 hover:border-gray-300 transition-colors w-28 text-center"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 leading-tight">Brand Assets</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
