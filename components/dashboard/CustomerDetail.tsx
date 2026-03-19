"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CustomerJob {
  id: string;
  title: string;
  address: string | null;
  status: "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  estimates: { id: string; estimate_number: number; status: string; total: number; created_at: string }[];
  invoices: { id: string; invoice_number: number | null; status: string; total: number; amount_paid: number; created_at: string }[];
}

interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  jobs: CustomerJob[];
}

const JOB_STATUS_CHIP: Record<string, string> = {
  active:    "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

const inp = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none";

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function jobFinancials(job: CustomerJob) {
  const invoiced = job.invoices.reduce((s, i) => s + i.total, 0);
  const paid     = job.invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);
  return { invoiced, paid, balance: invoiced - paid };
}

export function CustomerDetail({ customer: initial }: { customer: Customer }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName]       = useState(customer.name);
  const [editPhone, setEditPhone]     = useState(customer.phone ?? "");
  const [editEmail, setEditEmail]     = useState(customer.email ?? "");
  const [editAddress, setEditAddress] = useState(customer.address ?? "");

  // Lifetime financials
  const lifetimeInvoiced = customer.jobs.reduce((s, j) => s + jobFinancials(j).invoiced, 0);
  const lifetimePaid     = customer.jobs.reduce((s, j) => s + jobFinancials(j).paid, 0);
  const lifetimeBalance  = lifetimeInvoiced - lifetimePaid;

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone, email: editEmail, address: editAddress }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      setCustomer(prev => ({ ...prev, name: editName, phone: editPhone || null, email: editEmail || null, address: editAddress || null }));
      setEditing(false);
    } finally { setSaving(false); }
  }

  // New job URL pre-filled with customer info
  const newJobParams = new URLSearchParams({ new: "1", customerId: customer.id });


  return (
    <div className="p-6 sm:p-8 max-w-5xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/customers" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Customers
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900 truncate">{customer.name}</span>
      </div>

      {/* Customer header card */}
      <div className="rounded border border-gray-200 bg-white p-5 mb-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Phone</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Address</label>
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !editName.trim()} className="rounded bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              {customer.phone   && <p className="text-sm text-gray-500">{customer.phone}</p>}
              {customer.email   && <p className="text-sm text-gray-500">{customer.email}</p>}
              {customer.address && <p className="text-sm text-gray-400">{customer.address}</p>}
              <p className="text-xs text-gray-400">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setEditing(true)} className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Lifetime financial stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Total Invoiced", value: lifetimeInvoiced, color: "text-gray-900" },
          { label: "Total Paid",     value: lifetimePaid,     color: "text-emerald-600" },
          { label: "Outstanding",    value: lifetimeBalance,  color: lifetimeBalance > 0 ? "text-red-600" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${color}`}>{usd(value)}</p>
          </div>
        ))}
      </div>

      {/* Jobs section */}
      <div className="rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Jobs ({customer.jobs.length})</p>
          <Link
            href={`/dashboard/jobs/new?${newJobParams.toString()}`}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            + New Job
          </Link>
        </div>

        {customer.jobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No jobs yet for this customer.</p>
            <Link
              href={`/dashboard/jobs/new?${newJobParams.toString()}`}
              className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Create First Job
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoiced</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.jobs.map(job => {
                    const fin = jobFinancials(job);
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{job.title}</p>
                          {job.address && <p className="text-xs text-gray-400 mt-0.5">{job.address}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {job.estimates.length} estimate{job.estimates.length !== 1 ? "s" : ""} · {job.invoices.length} invoice{job.invoices.length !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${JOB_STATUS_CHIP[job.status]}`}>{job.status}</span>
                        </td>
                        <td className="px-5 py-4 text-right text-gray-600 tabular-nums">{fin.invoiced > 0 ? usd(fin.invoiced) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          <span className={fin.paid > 0 ? "text-emerald-600 font-medium" : "text-gray-300"}>
                            {fin.paid > 0 ? usd(fin.paid) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          <span className={fin.balance > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                            {fin.balance > 0 ? usd(fin.balance) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <Link href={`/dashboard/jobs/${job.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {customer.jobs.map(job => {
                const fin = jobFinancials(job);
                return (
                  <div key={job.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{job.title}</p>
                        {job.address && <p className="text-xs text-gray-400 mt-0.5">{job.address}</p>}
                      </div>
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize shrink-0 ${JOB_STATUS_CHIP[job.status]}`}>{job.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {fin.invoiced > 0 && <span>Inv: <strong className="text-gray-700">{usd(fin.invoiced)}</strong></span>}
                      {fin.paid > 0    && <span>Paid: <strong className="text-emerald-600">{usd(fin.paid)}</strong></span>}
                      {fin.balance > 0 && <span>Bal: <strong className="text-red-600">{usd(fin.balance)}</strong></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
