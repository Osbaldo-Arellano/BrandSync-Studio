"use client";

import { useState } from "react";
import type { TenantProfile } from "@/types/tenant";

interface Props {
  initial: TenantProfile;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-8 pb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 first:pt-0">
      {children}
    </p>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-[200px_1fr] sm:gap-10 sm:items-start border-b border-gray-200 last:border-0 space-y-2 sm:space-y-0">
      <div className="shrink-0 pt-0.5">
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {hint && (
          <span className="block mt-1 text-xs leading-relaxed text-gray-500">
            {hint}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inp =
  "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors";

export function TenantSettingsForm({ initial }: Props) {
  const [form, setForm] = useState<TenantProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof TenantProfile, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ccb_number: form.ccb_number || null,
          tagline: form.tagline || null,
          email: form.email || null,
          phone: form.phone || null,
          website: form.website || null,
          address_street: form.address_street || null,
          address_city: form.address_city || null,
          address_state: form.address_state || null,
          address_zip: form.address_zip || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to save");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* General */}
      <SectionLabel>General</SectionLabel>
      <Row label="Company name" hint="Appears on all estimates and documents.">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Flawless Electric Inc"
          className={inp}
        />
      </Row>
      <Row
        label="CCB number"
        hint="Oregon Contractor's Board license. Leave blank to omit."
      >
        <input
          type="text"
          value={form.ccb_number}
          onChange={(e) => set("ccb_number", e.target.value)}
          placeholder="123456"
          className={inp}
        />
      </Row>
      <Row
        label="Tagline"
        hint="Short descriptor shown on estimate letterheads."
      >
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="Licensed, Bonded & Insured"
          className={inp}
        />
      </Row>
      {/* Contact */}
      <SectionLabel>Contact</SectionLabel>
      <Row label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="info@company.com"
          className={inp}
        />
      </Row>
      <Row label="Phone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="(503) 555-0101"
          className={inp}
        />
      </Row>
      <Row label="Website">
        <input
          type="url"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          placeholder="https://company.com"
          className={inp}
        />
      </Row>
      <SectionLabel>Address</SectionLabel>
      <Row label="Street" hint="Used on estimate letterheads.">
        <input
          type="text"
          value={form.address_street}
          onChange={(e) => set("address_street", e.target.value)}
          placeholder="123 Main St"
          className={inp}
        />
      </Row>
      <Row label="City / State / ZIP">
        <div className="grid grid-cols-[1fr_60px_76px] gap-2">
          <input
            type="text"
            value={form.address_city}
            onChange={(e) => set("address_city", e.target.value)}
            placeholder="Portland"
            className={inp}
          />
          <input
            type="text"
            value={form.address_state}
            onChange={(e) => set("address_state", e.target.value)}
            placeholder="OR"
            maxLength={2}
            className={`${inp} uppercase text-center`}
          />
          <input
            type="text"
            value={form.address_zip}
            onChange={(e) => set("address_zip", e.target.value)}
            placeholder="97201"
            className={inp}
          />
        </div>
      </Row>
      {/* Footer */}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-8 flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Changes saved
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
