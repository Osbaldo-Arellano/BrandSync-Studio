"use client";

import { useState } from "react";
import type { BrandState } from "@/types/brand";

interface CompanyInfoCardProps {
  brand: BrandState;
  onUpdate: (patch: Partial<BrandState>) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export function CompanyInfoCard({ brand, onUpdate, dirty, saving, onSave }: CompanyInfoCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-6"
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <h2 className="text-lg font-semibold">Edit Company Info</h2>
        </div>
        <svg
          className={`h-5 w-5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-5 border-t border-zinc-800 p-6">
          <div className="space-y-1">
            <label htmlFor="companyName" className="block text-sm font-medium text-zinc-300">Company Name</label>
            <input
              id="companyName"
              value={brand.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter company name"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="tagline" className="block text-sm font-medium text-zinc-300">Tagline</label>
            <input
              id="tagline"
              value={brand.tagline}
              onChange={(e) => onUpdate({ tagline: e.target.value })}
              placeholder="Your company tagline"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email</label>
              <input
                id="email"
                type="email"
                value={brand.email}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="contact@company.com"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">Phone</label>
              <input
                id="phone"
                value={brand.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="website" className="block text-sm font-medium text-zinc-300">Website</label>
            <input
              id="website"
              type="url"
              value={brand.website}
              onChange={(e) => onUpdate({ website: e.target.value })}
              placeholder="https://yourcompany.com"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500">Used as the QR code destination on business cards.</p>
          </div>

            <button
            onClick={onSave}
            disabled={!dirty || saving}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : dirty ? "Save Changes" : "All changes saved"}
          </button>
        </div>
      )}
    </div>
  );
}
