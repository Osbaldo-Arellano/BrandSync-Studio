"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

const inp = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none";

function CustomerForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Customer>;
  onSave: (data: { name: string; phone: string; email: string; address: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 border border-gray-200 rounded">
      <input type="text" placeholder="Name *" value={name} onChange={e => setName(e.target.value)} className={inp} />
      <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inp} />
      <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className={inp} />
      <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button
          type="button"
          onClick={() => { if (name.trim()) onSave({ name, phone, email, address }); }}
          disabled={saving || !name.trim()}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function CustomerList({ customers: initial }: { customers: Customer[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(data: { name: string; phone: string; email: string; address: string }) {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      const customer = await res.json();
      setCustomers(prev => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
      setAdding(false);
    } finally { setSaving(false); }
  }

  async function handleEdit(id: string, data: { name: string; phone: string; email: string; address: string }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      const updated = await res.json();
      setCustomers(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) setCustomers(prev => prev.filter(c => c.id !== id));
      else { const d = await res.json(); alert(d.error ?? "Failed"); }
    } finally { setDeleting(null); }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            + Add Customer
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <CustomerForm onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
        </div>
      )}

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="w-full sm:w-64 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {customers.length === 0 && !adding && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No customers yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first customer to enable autocomplete on estimates and invoices.</p>
        </div>
      )}

      {/* Desktop table */}
      {visible.length > 0 && (
        <div className="hidden md:block border border-gray-200 bg-white rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map(c => (
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={5} className="px-4 py-3">
                      <CustomerForm
                        initial={c}
                        onSave={(data) => handleEdit(c.id, data)}
                        onCancel={() => setEditingId(null)}
                        saving={saving}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-3 text-gray-500">{c.phone ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-500">{c.email ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-[180px] truncate">{c.address ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(c.id)} className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                          {deleting === c.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {visible.length > 0 && (
        <div className="md:hidden space-y-2">
          {visible.map(c => (
            editingId === c.id ? (
              <div key={c.id} className="rounded border border-gray-200 bg-white p-4">
                <CustomerForm
                  initial={c}
                  onSave={(data) => handleEdit(c.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </div>
            ) : (
              <div key={c.id} className="rounded border border-gray-200 bg-white p-4 cursor-pointer hover:border-gray-300 transition-colors" onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.phone && <p className="text-sm text-gray-500 mt-0.5">{c.phone}</p>}
                    {c.email && <p className="text-sm text-gray-500 mt-0.5">{c.email}</p>}
                    {c.address && <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingId(c.id)} className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                      {deleting === c.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
