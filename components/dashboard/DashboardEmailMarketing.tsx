"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface Signup {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  role: string | null;
  created_at: string;
}

type SortKey = "created_at" | "name" | "role";
type SortDir = "asc" | "desc";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function exportCsv(rows: Signup[]) {
  const header = ["Name", "Email", "Phone", "Role", "Signed Up"];
  const lines = rows.map((s) =>
    [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"${(s.phone_number ?? "").replace(/"/g, '""')}"`,
      `"${(s.role ?? "").replace(/"/g, '""')}"`,
      `"${fmtDate(s.created_at)}"`,
    ].join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SortTh({
  label, col, sortKey, sortDir, onSort, align = "left",
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === col;
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none text-${align} ${active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="ml-1 inline-block w-2.5 text-center">
        {active ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </span>
    </th>
  );
}

function ComposeModal({
  recipients,
  onClose,
}: {
  recipients: { name: string; email: string }[];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    subjectRef.current?.focus();
  }, []);

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/email-marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={status === "sending" ? undefined : onClose} />

      {/* Sheet / modal */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded border border-gray-200 shadow-xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Email</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              To: {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={status === "sending"}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "done" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">
              {result?.sent} email{result?.sent !== 1 ? "s" : ""} sent
              {result?.failed ? `, ${result.failed} failed` : ""}
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Recipients preview */}
            <div className="px-4 py-2 border-b border-gray-100 max-h-24 overflow-y-auto shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <span key={r.email} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 text-xs text-gray-700">
                    {r.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-3">
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={10}
                className="flex-1 w-full rounded border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
              {status === "error" && (
                <p className="text-sm text-red-600">Failed to send. Check SMTP settings.</p>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={onClose}
                  disabled={status === "sending"}
                  className="rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={send}
                  disabled={status === "sending" || !subject.trim() || !body.trim()}
                  className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {status === "sending" ? "Sending…" : `Send to ${recipients.length}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DashboardEmailMarketing({ signups }: { signups: Signup[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = q
      ? signups.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.phone_number ?? "").includes(q) ||
            (s.role ?? "").toLowerCase().includes(q),
        )
      : [...signups];

    rows.sort((a, b) => {
      let valA: string, valB: string;
      if (sortKey === "name") { valA = a.name; valB = b.name; }
      else if (sortKey === "role") { valA = a.role ?? ""; valB = b.role ?? ""; }
      else { valA = a.created_at; valB = b.created_at; }
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [signups, search, sortKey, sortDir]);

  const withPhone = signups.filter((s) => s.phone_number).length;
  const allFilteredIds = filtered.map((s) => s.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allFilteredIds]));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyPhones() {
    const phones = signups
      .filter((s) => selected.has(s.id) && s.phone_number)
      .map((s) => s.phone_number)
      .join("\n");
    if (!phones) return;
    navigator.clipboard.writeText(phones).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const selectedWithPhone = signups.filter((s) => selected.has(s.id) && s.phone_number).length;

  // Recipients for compose: selected if any, otherwise all filtered — email required
  const composeRecipients = (
    selected.size > 0
      ? filtered.filter((s) => selected.has(s.id))
      : filtered
  ).filter((s) => !!s.email?.trim()).map((s) => ({ name: s.name, email: s.email }));

  return (
    <div className="p-4 sm:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Email &amp; Marketing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Waitlist signups — select contacts to copy phones for bulk SMS.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3 border-t-2 border-t-blue-500">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{signups.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-3 border-t-2 border-t-emerald-500">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">W/ Phone</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{withPhone}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-3 border-t-2 border-t-amber-400">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Selected</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{selected.size}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />

        {/* Sort + actions row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort selector — mobile only */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <span className="text-xs text-gray-500">Sort:</span>
            <select
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split("-") as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="created_at-desc">Newest</option>
              <option value="created_at-asc">Oldest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="role-asc">Role A–Z</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto flex-wrap justify-end">
            <button
              onClick={() => exportCsv(selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered)}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={copyPhones}
              disabled={selectedWithPhone === 0}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {copied ? "Copied!" : `Phones${selectedWithPhone > 0 ? ` (${selectedWithPhone})` : ""}`}
            </button>
            <button
              onClick={() => setComposeOpen(true)}
              disabled={composeRecipients.length === 0}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {selected.size > 0 ? `Email (${selected.size})` : "Email All"}
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {signups.length === 0 && (
        <div className="bg-white border border-gray-200 rounded p-12 text-center">
          <p className="text-sm text-gray-500">No signups yet.</p>
        </div>
      )}

      {signups.length > 0 && filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">No results for &ldquo;{search}&rdquo;</p>
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <>
          <div className="sm:hidden space-y-2">
            {/* Select all */}
            <label className="flex items-center gap-2 px-1 py-1 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Select all ({filtered.length})
            </label>

            {filtered.map((s) => (
              <div
                key={s.id}
                onClick={() => toggleOne(s.id)}
                className={`rounded border bg-white p-4 cursor-pointer transition-colors ${
                  selected.has(s.id) ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      {s.role && (
                        <span className="shrink-0 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{s.role}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{s.email}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {s.phone_number ? (
                        <a
                          href={`tel:${s.phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-blue-600 font-medium"
                        >
                          {s.phone_number}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-300">No phone</span>
                      )}
                      <span className="text-xs text-gray-400">{fmtDate(s.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <SortTh label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <SortTh label="Role" col="role" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh label="Signed up" col="created_at" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggleOne(s.id)}
                    className={`cursor-pointer transition-colors ${selected.has(s.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {s.phone_number ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.role ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {composeOpen && (
        <ComposeModal
          recipients={composeRecipients}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}
