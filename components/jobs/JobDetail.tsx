"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/types/jobs";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface JobEstimate {
  id: string;
  estimate_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

interface JobInvoice {
  id: string;
  invoice_number: number | null;
  customer_name: string;
  status: string;
  total: number;
  amount_paid: number;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  address: string | null;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  customer: Customer | null;
  estimates: JobEstimate[];
  invoices: JobInvoice[];
}

const STATUS_CHIP: Record<JobStatus, string> = {
  active:    "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

const EST_STATUS: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const INV_STATUS: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue:  "bg-red-50 text-red-700 border border-red-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  cashapp:  "bg-green-50 text-green-700 border border-green-200",
  cash:     "bg-teal-50 text-teal-700 border border-teal-200",
  deferred: "bg-orange-50 text-orange-700 border border-orange-200",
  void:     "bg-gray-100 text-gray-400 border border-gray-200",
};

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const inp = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none";

export function JobDetail({ job: initial, customers }: { job: Job; customers: Customer[] }) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingEstimate, setDeletingEstimate] = useState<string | null>(null);

  async function handleDeleteEstimate(estId: string) {
    if (!confirm("Delete this draft estimate? This cannot be undone.")) return;
    setDeletingEstimate(estId);
    try {
      const res = await fetch(`/api/estimates/${estId}`, { method: "DELETE" });
      if (res.ok) {
        setJob(prev => ({ ...prev, estimates: prev.estimates.filter(e => e.id !== estId) }));
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to delete estimate");
      }
    } finally { setDeletingEstimate(null); }
  }

  // Edit form state
  const [editTitle, setEditTitle] = useState(job.title);
  const [editCustomerId, setEditCustomerId] = useState(job.customer?.id ?? "");
  const [editCustSearch, setEditCustSearch] = useState(job.customer?.name ?? "");
  const [editAddress, setEditAddress] = useState(job.address ?? "");
  const [editNotes, setEditNotes] = useState(job.notes ?? "");
  const [editStatus, setEditStatus] = useState<JobStatus>(job.status);

  const custSuggestions = editCustSearch && !editCustomerId
    ? customers.filter(c => c.name.toLowerCase().includes(editCustSearch.toLowerCase())).slice(0, 5)
    : [];

  const totalEstimated = job.estimates.reduce((s, e) => s + e.total, 0);
  const totalInvoiced  = job.invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid      = job.invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);
  const balanceDue     = totalInvoiced - totalPaid;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          customerId: editCustomerId || null,
          address: editAddress || null,
          notes: editNotes || null,
          status: editStatus,
        }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      const customer = customers.find(c => c.id === editCustomerId) ?? null;
      setJob(prev => ({ ...prev, title: editTitle, address: editAddress || null, notes: editNotes || null, status: editStatus, customer }));
      setEditing(false);
    } finally { setSaving(false); }
  }

  // Build new estimate URL pre-filled with customer info + jobId
  const estSearchParams = new URLSearchParams();
  estSearchParams.set("jobId", job.id);
  if (job.customer) {
    estSearchParams.set("customerName", job.customer.name);
    if (job.customer.address) estSearchParams.set("customerAddress", job.customer.address);
    if (job.customer.phone) estSearchParams.set("customerPhone", job.customer.phone);
  }
  if (job.address) estSearchParams.set("jobAddress", job.address);

  const invSearchParams = new URLSearchParams();
  invSearchParams.set("jobId", job.id);
  if (job.customer) {
    invSearchParams.set("customerName", job.customer.name);
    if (job.customer.address) invSearchParams.set("customerAddress", job.customer.address);
    if (job.customer.phone) invSearchParams.set("customerPhone", job.customer.phone);
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        {job.customer ? (
          <>
            <Link href="/dashboard/customers" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Customers
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={`/dashboard/customers/${job.customer.id}`} className="text-gray-500 hover:text-gray-700">{job.customer.name}</Link>
            <span className="text-gray-300">/</span>
          </>
        ) : (
          <>
            <Link href="/dashboard/jobs" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Jobs
            </Link>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="font-semibold text-gray-900 truncate">{job.title}</span>
      </div>

      {/* Job header card */}
      <div className="rounded border border-gray-200 bg-white p-5 mb-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Title *</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inp} />
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Customer</label>
                <input
                  type="text"
                  value={editCustSearch}
                  onChange={e => { setEditCustSearch(e.target.value); setEditCustomerId(""); }}
                  placeholder="Search customers…"
                  className={inp}
                />
                {custSuggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow text-sm">
                    {custSuggestions.map(c => (
                      <li key={c.id}>
                        <button type="button" onClick={() => { setEditCustomerId(c.id); setEditCustSearch(c.name); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900">
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Address</label>
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as JobStatus)} className={inp}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</label>
                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !editTitle.trim()} className="rounded bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[job.status]}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
              </div>
              {job.customer && (
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-900">{job.customer.name}</p>
                  {job.customer.phone && <p className="text-gray-500">{job.customer.phone}</p>}
                  {job.customer.email && <p className="text-gray-500">{job.customer.email}</p>}
                </div>
              )}
              {job.address && <p className="text-sm text-gray-500">{job.address}</p>}
              {job.notes && <p className="text-sm text-gray-400 italic">{job.notes}</p>}
              <p className="text-xs text-gray-400">Created {new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setEditing(true)} className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Estimated",   value: totalEstimated, color: "text-gray-900" },
          { label: "Invoiced",    value: totalInvoiced,  color: "text-gray-900" },
          { label: "Paid",        value: totalPaid,      color: "text-emerald-600" },
          { label: "Balance Due", value: balanceDue,     color: balanceDue > 0 ? "text-red-600" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${color}`}>{usd(value)}</p>
          </div>
        ))}
      </div>

      {/* Estimates + Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Estimates */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Estimates ({job.estimates.length})</p>
            <Link
              href={`/dashboard/estimates/new?${estSearchParams.toString()}`}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              + New
            </Link>
          </div>
          {job.estimates.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No estimates yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {job.estimates.map(est => (
                <div key={est.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      EST-{new Date(est.created_at).getFullYear()}-{String(est.estimate_number).padStart(3, "0")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(est.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${EST_STATUS[est.status] ?? "bg-gray-100 text-gray-600"}`}>{est.status}</span>
                    <span className="text-sm font-medium text-gray-900 tabular-nums">{usd(est.total)}</span>
                    <Link href={`/dashboard/estimates/${est.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</Link>
                    {est.status === "draft" && (
                      <button
                        onClick={() => handleDeleteEstimate(est.id)}
                        disabled={deletingEstimate === est.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {deletingEstimate === est.id ? "…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Invoices ({job.invoices.length})</p>
            <Link
              href={`/dashboard/invoices/new?${invSearchParams.toString()}`}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              + New
            </Link>
          </div>
          {job.invoices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No invoices yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {job.invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {inv.invoice_number ? `INV-${String(inv.invoice_number).padStart(4, "0")}` : `INV-${inv.id.slice(0,8).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${INV_STATUS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>{inv.status}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 tabular-nums">{usd(inv.total)}</p>
                      {inv.amount_paid > 0 && inv.status !== "paid" && (
                        <p className="text-xs text-emerald-600 tabular-nums">{usd(inv.amount_paid)} paid</p>
                      )}
                    </div>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
