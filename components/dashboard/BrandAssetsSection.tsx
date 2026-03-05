"use client";

import { useState, useEffect, useCallback } from "react";
import { defaultBrand } from "@/types/brand";
import type { BrandState, SocialLink } from "@/types/brand";
import { LogoUploader } from "./LogoUploader";
import { PhotoGallery } from "./PhotoGallery";

const SOCIAL_PLATFORMS = [
  "instagram", "facebook", "x", "youtube",
  "linkedin", "tiktok", "pinterest", "threads",
];

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
          <span className="block mt-1 text-xs leading-relaxed text-gray-500">{hint}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function BrandAssetsSection() {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBrand((prev) => ({
            ...prev,
            name:     data.name     ?? prev.name,
            tagline:  data.tagline  ?? prev.tagline,
            email:    data.email    ?? prev.email,
            phone:    data.phone    ?? prev.phone,
            website:  data.website_url ?? prev.website,
            logo:     data.logo_url ?? prev.logo,
            icon:     data.icon_url ?? prev.icon,
            about_us: data.about_us ?? "",
            address: {
              street:  data.address?.street  ?? prev.address.street,
              city:    data.address?.city    ?? prev.address.city,
              state:   data.address?.state   ?? prev.address.state,
              zip:     data.address?.zip     ?? prev.address.zip,
              country: data.address?.country ?? prev.address.country,
            },
            social_links: (data.social_links ?? prev.social_links).map(
              (l: { platform?: string; url?: string; handle?: string }) => ({
                platform: l.platform ?? "",
                url:      l.url      ?? "",
                handle:   l.handle   ?? "",
              })
            ),
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateBrand = useCallback((patch: Partial<BrandState>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaved(false);
  }, []);

  const saveBrand = useCallback(async (overrides?: Partial<BrandState>) => {
    const current = overrides ? { ...brand, ...overrides } : brand;
    setSaving(true);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         current.name,
          tagline:      current.tagline,
          email:        current.email,
          phone:        current.phone,
          website_url:  current.website,
          logo_url:     current.logo,
          icon_url:     current.icon,
          about_us:     current.about_us,
          address:      current.address,
          social_links: current.social_links,
        }),
      });
      if (res.ok) { setDirty(false); setSaved(true); }
    } finally {
      setSaving(false);
    }
  }, [brand]);

  const persistLogo = useCallback(async (url: string | null) => {
    setBrand((prev) => ({ ...prev, logo: url }));
    await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: brand.name, tagline: brand.tagline, email: brand.email,
        phone: brand.phone, website_url: brand.website,
        logo_url: url, icon_url: brand.icon,
        about_us: brand.about_us, address: brand.address,
        social_links: brand.social_links,
      }),
    });
  }, [brand]);

  const persistIcon = useCallback(async (url: string | null) => {
    setBrand((prev) => ({ ...prev, icon: url }));
    await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: brand.name, tagline: brand.tagline, email: brand.email,
        phone: brand.phone, website_url: brand.website,
        logo_url: brand.logo, icon_url: url,
        about_us: brand.about_us, address: brand.address,
        social_links: brand.social_links,
      }),
    });
  }, [brand]);

  const addSocialLink = () => {
    updateBrand({
      social_links: [...brand.social_links, { platform: "instagram", url: "", handle: "" }],
    });
  };

  const updateSocialLink = (index: number, patch: Partial<SocialLink>) => {
    updateBrand({
      social_links: brand.social_links.map((link, i) =>
        i === index ? { ...link, ...patch } : link
      ),
    });
  };

  const removeSocialLink = (index: number) => {
    updateBrand({ social_links: brand.social_links.filter((_, i) => i !== index) });
  };

  const inp =
    "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors";

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      {/* ── Assets ── */}
      <SectionLabel>Assets</SectionLabel>

      <Row label="Logo" hint="Wide/horizontal lockup. PNG, SVG. Recommended 800×200px.">
        <LogoUploader
          logo={brand.logo}
          onUpload={(url) => persistLogo(url)}
          onRemove={() => persistLogo(null)}
          label="Logo"
        />
      </Row>

      <Row label="Icon" hint="Square brand mark for cards & stickers. PNG, SVG. Recommended 512×512px.">
        <LogoUploader
          logo={brand.icon}
          onUpload={(url) => persistIcon(url)}
          onRemove={() => persistIcon(null)}
          apiPath="/api/brand/icon"
          label="Icon"
        />
      </Row>

      {/* ── Social links ── */}
      <SectionLabel>Social links</SectionLabel>

      <Row label="Accounts" hint="Displayed on print assets and your website.">
        <div className="space-y-2">
          {brand.social_links.length === 0 && (
            <p className="text-xs text-gray-400 mb-2">No social links yet.</p>
          )}

          {brand.social_links.map((link, i) => (
            <div
              key={i}
              className="grid grid-cols-[120px_1fr_1fr_32px] gap-2 items-center"
            >
              <select
                value={link.platform}
                onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                className="rounded border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <input
                value={link.handle}
                onChange={(e) => updateSocialLink(i, { handle: e.target.value })}
                placeholder="@handle"
                className={inp}
              />
              <input
                value={link.url}
                onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                placeholder="https://…"
                className={inp}
              />
              <button
                type="button"
                onClick={() => removeSocialLink(i)}
                className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSocialLink}
            className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add social link
          </button>
        </div>
      </Row>

      {/* ── About us ── */}
      <SectionLabel>About your company</SectionLabel>

      <Row label="About us" hint="Used on your website and marketing materials.">
        <textarea
          rows={4}
          value={brand.about_us}
          onChange={(e) => updateBrand({ about_us: e.target.value })}
          placeholder="Tell visitors about your company, your values, and what makes you unique…"
          className={`${inp} resize-y`}
        />
      </Row>

      {/* ── Save ── */}
      <div className="mt-8 flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Changes saved
          </span>
        )}
        <button
          type="button"
          onClick={() => saveBrand()}
          disabled={!dirty || saving}
          className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* ── Photo gallery ── */}
      <SectionLabel>Photo gallery</SectionLabel>

      <div className="py-2">
        <PhotoGallery />
      </div>
    </div>
  );
}
