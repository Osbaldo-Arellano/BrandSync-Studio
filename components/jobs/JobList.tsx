"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { JobStatus } from "@/types/jobs";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface JobEstimate { id: string; status: string; total: number; }
interface JobInvoice  { id: string; status: string; total: number; amount_paid: number; }

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

const STATUS_LABEL: Record<JobStatus, string> = {
  active: "Active", completed: "Completed", cancelled: "Cancelled",
};

const FILTER_TABS: { label: string; value: JobStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Active",    value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const inp = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none";

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function jobFinancials(job: Job) {
  const totalEstimated = job.estimates.reduce((s, e) => s + e.total, 0);
  const totalInvoiced  = job.invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid      = job.invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);
  return { totalEstimated, totalInvoiced, totalPaid };
}

function NewJobForm({
  customers,
  onSave,
  onCancel,
  saving,
  initialCustomerId,
}: {
  customers: Customer[];
  onSave: (data: { title: string; customerId: string; customerName: string; address: string; notes: string }) => void;
  onCancel: () => void;
  saving: boolean;
  initialCustomerId?: string;
}) {
  const initialCustomer = initialCustomerId ? customers.find(c => c.id === initialCustomerId) : undefined;
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState(initialCustomer?.id ?? "");
  const [address, setAddress] = useState(initialCustomer?.address ?? "");
  const [notes, setNotes] = useState("");
  const [custSearch, setCustSearch] = useState(initialCustomer?.name ?? "");

  const filtered = custSearch
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase())).slice(0, 6)
    : [];

  function selectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustSearch(c.name);
    if (!address && c.address) setAddress(c.address);
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-5 space-y-4 mb-4">
      <p className="text-sm font-semibold text-gray-900">New Job</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Job title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Roof replacement — 123 Main St" className={inp} />
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Customer</label>
          <input
            type="text"
            value={custSearch}
            onChange={e => { setCustSearch(e.target.value); if (!e.target.value) setCustomerId(""); }}
            placeholder="Search customers…"
            className={inp}
          />
          {filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow text-sm">
              {filtered.map(c => (
                <li key={c.id}>
                  <button type="button" onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900">
                    {c.name}{c.phone ? ` · ${c.phone}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Job site address" className={inp} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className={inp} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button
          type="button"
          onClick={() => { if (title.trim()) onSave({ title, customerId, customerName: custSearch.trim(), address, notes }); }}
          disabled={saving || !title.trim()}
          className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Creating…" : "Create Job"}
        </button>
      </div>
    </div>
  );
}

export function JobList({ jobs: initial, customers }: { jobs: Job[]; customers: Customer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Auto-open new job form if ?new=1 in URL (from customer detail page)
  const prefilledCustomerId = searchParams.get("customerId") ?? "";
  useEffect(() => {
    if (searchParams.get("new") === "1") setAdding(true);
  }, [searchParams]);

  const counts = FILTER_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === "all" ? jobs.length : jobs.filter(j => j.status === tab.value).length;
    return acc;
  }, {});

  const visible = jobs.filter(j => {
    const matchStatus = filter === "all" || j.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || (j.customer?.name ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  async function handleCreate(data: { title: string; customerId: string; customerName: string; address: string; notes: string }) {
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      const job = await res.json();
      router.push(`/dashboard/jobs/${job.id}`);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job? Existing estimates and invoices will be unlinked but not deleted.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) setJobs(prev => prev.filter(j => j.id !== id));
      else { const d = await res.json(); alert(d.error ?? "Failed"); }
    } finally { setDeleting(null); }
  }

  async function handleMarkComplete(id: string) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "completed" as JobStatus } : j));
    else { const d = await res.json(); alert(d.error ?? "Failed"); }
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">Manage jobs — group estimates and invoices by project</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0">
            + New Job
          </button>
        )}
      </div>

      {adding && <NewJobForm customers={customers} onSave={handleCreate} onCancel={() => setAdding(false)} saving={saving} initialCustomerId={prefilledCustomerId} />}

      {/* Search + filter */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs or customers…"
          className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-1.5 flex-wrap self-start">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border ${
                filter === tab.value
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>
      </div>

      {jobs.length === 0 && !adding && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No jobs yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a job to group estimates and invoices for a project.</p>
        </div>
      )}

      {/* Desktop table */}
      {visible.length > 0 && (
        <div className="hidden md:block border border-gray-200 bg-white rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoiced</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map(job => {
                const fin = jobFinancials(job);
                return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      {job.address && <p className="text-xs text-gray-400 mt-0.5">{job.address}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{job.customer?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[job.status]}`}>{STATUS_LABEL[job.status]}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600 tabular-nums">{fin.totalEstimated > 0 ? usd(fin.totalEstimated) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4 text-right text-gray-600 tabular-nums">{fin.totalInvoiced > 0 ? usd(fin.totalInvoiced) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums">
                      <span className={fin.totalPaid > 0 ? "text-emerald-600" : "text-gray-300"}>
                        {fin.totalPaid > 0 ? usd(fin.totalPaid) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end items-center">
                        {job.status === "active" && (
                          <button onClick={() => handleMarkComplete(job.id)} className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                            Complete
                          </button>
                        )}
                        <button onClick={() => handleDelete(job.id)} disabled={deleting === job.id} className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                          {deleting === job.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {visible.length > 0 && (
        <div className="md:hidden space-y-2">
          {visible.map(job => {
            const fin = jobFinancials(job);
            return (
              <div key={job.id} className="rounded border border-gray-200 bg-white p-4 cursor-pointer hover:border-gray-300 transition-colors" onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                    {job.customer && <p className="text-sm text-gray-500 mt-0.5">{job.customer.name}</p>}
                    {job.address && <p className="text-xs text-gray-400 mt-0.5">{job.address}</p>}
                  </div>
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CHIP[job.status]}`}>{STATUS_LABEL[job.status]}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  {fin.totalEstimated > 0 && <span>Est: <strong className="text-gray-700">{usd(fin.totalEstimated)}</strong></span>}
                  {fin.totalInvoiced > 0 && <span>Inv: <strong className="text-gray-700">{usd(fin.totalInvoiced)}</strong></span>}
                  {fin.totalPaid > 0 && <span>Paid: <strong className="text-emerald-600">{usd(fin.totalPaid)}</strong></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
