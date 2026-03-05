"use client";

import { useState } from "react";
import type { BrandState, SocialLink } from "@/types/brand";

const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "x",
  "youtube",
  "linkedin",
  "tiktok",
  "pinterest",
  "threads",
];

interface BrandingCardProps {
  brand: BrandState;
  onUpdate: (patch: Partial<BrandState>) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export function BrandingCard({ brand, onUpdate, dirty, saving, onSave }: BrandingCardProps) {
  const [open, setOpen] = useState(false);

  const addSocialLink = () => {
    onUpdate({
      social_links: [
        ...brand.social_links,
        { platform: "instagram", url: "", handle: "" },
      ],
    });
  };

  const updateSocialLink = (index: number, patch: Partial<SocialLink>) => {
    onUpdate({
      social_links: brand.social_links.map((link, i) =>
        i === index ? { ...link, ...patch } : link
      ),
    });
  };

  const removeSocialLink = (index: number) => {
    onUpdate({ social_links: brand.social_links.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-6"
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h2 className="text-lg font-semibold">Branding Details</h2>
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
        <div className="space-y-6 border-t border-zinc-800 p-6">

          {/* About Us */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">About Us</label>
            <textarea
              rows={5}
              value={brand.about_us}
              onChange={(e) => onUpdate({ about_us: e.target.value })}
              placeholder="Tell visitors about your company, your values, and what makes you unique..."
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Social Media Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-300">Social Media Links</label>
              <button
                type="button"
                onClick={addSocialLink}
                className="flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {brand.social_links.length === 0 && (
              <p className="text-xs text-zinc-500">No social links yet. Click Add to get started.</p>
            )}

            <div className="space-y-2">
              {brand.social_links.map((link, i) => (
                <div key={i} className="space-y-1.5 rounded-md border border-zinc-800 p-2 sm:border-0 sm:p-0 sm:space-y-0 sm:grid sm:grid-cols-[130px_1fr_1fr_32px] sm:items-center sm:gap-2">
                  {/* Row 1 on mobile: platform select + delete button */}
                  <div className="flex items-center gap-2 sm:contents">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                      className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none sm:flex-none"
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(i)}
                      className="flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 sm:hidden"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* Row 2 on mobile: handle + URL side by side */}
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <input
                      value={link.handle}
                      onChange={(e) => updateSocialLink(i, { handle: e.target.value })}
                      placeholder="@handle"
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      value={link.url}
                      onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                      placeholder="https://..."
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* Delete button — desktop only */}
                  <button
                    type="button"
                    onClick={() => removeSocialLink(i)}
                    className="hidden sm:flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
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
