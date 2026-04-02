# DB-Driven Asset Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move print asset HTML templates from hardcoded TypeScript generator functions into a per-tenant `tenant_asset_templates` database table, with `{{placeholder}}` token substitution at render time.

**Architecture:** A new Supabase table stores one HTML body per `(tenant_id, asset_type_id, template_id)`. A pure `renderTemplate()` function does token substitution. The print page fetches available templates from a new API route and passes the HTML body down to `AssetEditor`, which replaces its current `generateAssetHTML()` calls with `renderTemplate()`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RLS), Vitest, `qrcode-generator`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260402000000_tenant_asset_templates.sql` | DB schema + RLS |
| Create | `lib/render-template.ts` | Pure token substitution function |
| Create | `lib/render-template.test.ts` | Vitest unit tests |
| Create | `lib/generate-qr.ts` | QR SVG string generator (extracted from asset-html.ts) |
| Create | `app/api/asset-templates/route.ts` | GET — returns tenant's template rows |
| Modify | `app/dashboard/print/page.tsx` | Fetch templates, derive available assets, pass data to children |
| Modify | `components/dashboard/AssetSelector.tsx` | Accept `assetTypes` prop, drop hardcoded ASSET_TYPES |
| Modify | `components/dashboard/AssetEditor.tsx` | Accept `templateBody` prop, use `renderTemplate` instead of `generateAssetHTML` |
| Delete | `lib/asset-html.ts` | Remove — no longer needed once AssetEditor is updated |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260402000000_tenant_asset_templates.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260402000000_tenant_asset_templates.sql
create table public.tenant_asset_templates (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references public.tenants(id) on delete cascade,
  asset_type_id text        not null,
  template_id   text        not null,
  html_body     text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, asset_type_id, template_id)
);

alter table public.tenant_asset_templates enable row level security;

create policy "tenant reads own templates"
  on public.tenant_asset_templates
  for select
  using (tenant_id = auth.uid());

comment on table public.tenant_asset_templates is
  'Per-tenant HTML templates for print assets. Each row is one (asset_type_id, template_id) variant.
   html_body uses {{placeholder}} tokens: {{logo}}, {{icon}}, {{tagline}}, {{website}}, {{qr_code}},
   {{name}}, {{title}}, {{email}}, {{phone}}, {{fromName}}, {{fromAddress}}, {{toName}}, {{toAddress}}, {{googleUrl}}.
   Presence of a row = that asset type/template is enabled for that tenant.';
```

- [ ] **Step 2: Apply migration in Supabase SQL editor**

Open your Supabase project → SQL Editor → paste the file contents → Run.

Expected: no errors, table appears in Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260402000000_tenant_asset_templates.sql
git commit -m "feat: add tenant_asset_templates migration"
```

---

## Task 2: `lib/render-template.ts` + Tests (TDD)

**Files:**
- Create: `lib/render-template.ts`
- Create: `lib/render-template.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/render-template.test.ts
import { describe, it, expect } from "vitest";
import { renderTemplate } from "./render-template";

describe("renderTemplate", () => {
  it("substitutes a single token", () => {
    expect(renderTemplate("<p>{{name}}</p>", { name: "Alice" }))
      .toBe("<p>Alice</p>");
  });

  it("substitutes multiple different tokens", () => {
    expect(
      renderTemplate("{{greeting}}, {{name}}!", { greeting: "Hello", name: "Bob" })
    ).toBe("Hello, Bob!");
  });

  it("substitutes the same token appearing multiple times", () => {
    expect(renderTemplate("{{x}} and {{x}}", { x: "foo" })).toBe("foo and foo");
  });

  it("replaces unknown tokens with empty string", () => {
    expect(renderTemplate("{{missing}}", {})).toBe("");
  });

  it("returns the string unchanged when there are no tokens", () => {
    expect(renderTemplate("<p>static</p>", {})).toBe("<p>static</p>");
  });

  it("handles empty html_body", () => {
    expect(renderTemplate("", { name: "test" })).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/render-template.test.ts
```

Expected: FAIL — `Cannot find module './render-template'`

- [ ] **Step 3: Implement `renderTemplate`**

```ts
// lib/render-template.ts
export function renderTemplate(
  htmlBody: string,
  vars: Record<string, string>,
): string {
  return htmlBody.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/render-template.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/render-template.ts lib/render-template.test.ts
git commit -m "feat: add renderTemplate — token substitution for asset HTML"
```

---

## Task 3: `lib/generate-qr.ts`

**Files:**
- Create: `lib/generate-qr.ts`

- [ ] **Step 1: Write `generateQR`**

```ts
// lib/generate-qr.ts
import qrcode from "qrcode-generator";

/**
 * Returns an inline SVG string encoding the given URL.
 * Returns "" if url is empty.
 */
export function generateQR(url: string): string {
  if (!url) return "";
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ scalable: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/generate-qr.ts
git commit -m "feat: extract generateQR utility from asset-html"
```

---

## Task 4: `app/api/asset-templates/route.ts`

**Files:**
- Create: `app/api/asset-templates/route.ts`

This route returns all template rows for the authenticated tenant. It does **not** return `html_body` for non-existent tenants.

- [ ] **Step 1: Write the route**

```ts
// app/api/asset-templates/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface AssetTemplateRow {
  asset_type_id: string;
  template_id: string;
  html_body: string;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("tenant_asset_templates")
    .select("asset_type_id, template_id, html_body")
    .eq("tenant_id", user.id);

  if (error) {
    return new Response("DB error", { status: 500 });
  }

  return Response.json(data ?? []);
}
```

- [ ] **Step 2: Smoke-test manually**

With the dev server running (`npm run dev`), open the browser to `/api/asset-templates` while logged in.

Expected: `[]` (empty array — no rows yet).

- [ ] **Step 3: Commit**

```bash
git add app/api/asset-templates/route.ts
git commit -m "feat: add GET /api/asset-templates route"
```

---

## Task 5: Update `app/dashboard/print/page.tsx`

**Files:**
- Modify: `app/dashboard/print/page.tsx`

The print page fetches available templates on mount, derives the filtered asset type list, and passes data down to `AssetSelector` and `AssetEditor`.

Key types introduced in this file:

```ts
// Map shape: { [assetTypeId]: { [templateId]: htmlBody } }
type TemplateMap = Record<string, Record<string, string>>;
```

- [ ] **Step 1: Replace the file contents**

```tsx
// app/dashboard/print/page.tsx
"use client";

import { useState, useEffect } from "react";
import { defaultBrand } from "@/types/brand";
import type { BrandState } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { ASSET_TYPES } from "@/types/assets";
import {
  AssetSelector,
  AssetTemplateGrid,
  AssetEditor,
} from "@/components/dashboard";
import type { AssetTemplateRow } from "@/app/api/asset-templates/route";

type TemplateMap = Record<string, Record<string, string>>;

export default function PrintPage() {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [templateMap, setTemplateMap] = useState<TemplateMap>({});

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<AssetTypeConfig>(ASSET_TYPES[0]);
  const [editorTemplate, setEditorTemplate] = useState<AssetTemplate>(ASSET_TYPES[0].templates[0]);
  const [editorTemplateBody, setEditorTemplateBody] = useState("");

  // Derive available asset types from templateMap
  const availableAssets: AssetTypeConfig[] = ASSET_TYPES
    .filter((a) => templateMap[a.id])
    .map((a) => ({
      ...a,
      templates: a.templates.filter((t) => templateMap[a.id]?.[t.id]),
    }));

  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  // Keep selectedAssetId in sync when availableAssets loads
  useEffect(() => {
    if (availableAssets.length > 0 && !availableAssets.find((a) => a.id === selectedAssetId)) {
      setSelectedAssetId(availableAssets[0].id);
    }
  }, [availableAssets, selectedAssetId]);

  const selectedAsset =
    availableAssets.find((a) => a.id === selectedAssetId) ?? availableAssets[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/brand").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tenant").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/asset-templates").then((r) =>
        r.ok ? (r.json() as Promise<AssetTemplateRow[]>) : []
      ),
    ]).then(([brandData, tenantData, templateRows]) => {
      setBrand((prev) => {
        let next = { ...prev };

        if (brandData) {
          next = {
            ...next,
            logo:     brandData.logo_url     ?? prev.logo,
            icon:     brandData.icon_url     ?? prev.icon,
            about_us: brandData.about_us     ?? prev.about_us,
            social_links: (brandData.social_links ?? prev.social_links).map(
              (l: { platform?: string; url?: string; handle?: string }) => ({
                platform: l.platform ?? "",
                url:      l.url      ?? "",
                handle:   l.handle   ?? "",
              })
            ),
          };
        }

        if (tenantData) {
          next = {
            ...next,
            name:    tenantData.name    || brandData?.name    || prev.name,
            tagline: tenantData.tagline || brandData?.tagline || prev.tagline,
            email:   tenantData.email   || brandData?.email   || prev.email,
            phone:   tenantData.phone   || brandData?.phone   || prev.phone,
            website: tenantData.website || brandData?.website_url || prev.website,
            address: {
              street:  tenantData.address_street || brandData?.address?.street  || prev.address.street,
              city:    tenantData.address_city   || brandData?.address?.city    || prev.address.city,
              state:   tenantData.address_state  || brandData?.address?.state   || prev.address.state,
              zip:     tenantData.address_zip    || brandData?.address?.zip     || prev.address.zip,
              country: brandData?.address?.country || prev.address.country,
            },
          };
        }

        return next;
      });

      // Build template map from DB rows
      const map: TemplateMap = {};
      for (const row of (templateRows as AssetTemplateRow[])) {
        if (!map[row.asset_type_id]) map[row.asset_type_id] = {};
        map[row.asset_type_id][row.template_id] = row.html_body;
      }
      setTemplateMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const openEditor = (asset: AssetTypeConfig, template: AssetTemplate) => {
    const body = templateMap[asset.id]?.[template.id] ?? "";
    setEditorAsset(asset);
    setEditorTemplate(template);
    setEditorTemplateBody(body);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (availableAssets.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Print Assets</h1>
          <p className="mt-1 text-gray-500">No print templates configured for your account.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Print Assets</h1>
          <p className="mt-1 text-gray-500">Generate print-ready assets for your brand</p>
        </div>

        <div className="space-y-4">
          <AssetSelector
            assetTypes={availableAssets}
            selected={selectedAssetId}
            onChange={setSelectedAssetId}
          />
          {selectedAsset && (
            <AssetTemplateGrid
              asset={selectedAsset}
              onSelect={(tpl) => openEditor(selectedAsset, tpl)}
            />
          )}
        </div>
      </main>

      <AssetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        asset={editorAsset}
        template={editorTemplate}
        templateBody={editorTemplateBody}
        brand={brand}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/print/page.tsx
git commit -m "feat: fetch asset templates from DB in print page"
```

---

## Task 6: Update `components/dashboard/AssetSelector.tsx`

**Files:**
- Modify: `components/dashboard/AssetSelector.tsx`

Drop the hardcoded `ASSET_TYPES` import. Accept `assetTypes` prop.

- [ ] **Step 1: Replace file contents**

```tsx
// components/dashboard/AssetSelector.tsx
import type { AssetTypeConfig } from "@/types/assets";

interface AssetSelectorProps {
  assetTypes: AssetTypeConfig[];
  selected: string;
  onChange: (id: string) => void;
}

export function AssetSelector({ assetTypes, selected, onChange }: AssetSelectorProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor="asset-type"
        className="block text-sm font-medium text-gray-700"
      >
        Select Product Type
      </label>
      <select
        id="asset-type"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
      >
        {assetTypes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/AssetSelector.tsx
git commit -m "feat: AssetSelector accepts assetTypes prop from DB-derived list"
```

---

## Task 7: Update `components/dashboard/AssetEditor.tsx`

**Files:**
- Modify: `components/dashboard/AssetEditor.tsx`

Replace `generateAssetHTML` with `renderTemplate`. Accept `templateBody: string` prop. Drop front/back page distinction — one template = full document shown in a single preview iframe.

- [ ] **Step 1: Replace file contents**

```tsx
// components/dashboard/AssetEditor.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { BrandState } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { renderTemplate } from "@/lib/render-template";
import { generateQR } from "@/lib/generate-qr";

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.25;

function fitZoom(nativeW: number, nativeH: number): number {
  const availW = 700;
  const availH = 550;
  const fit = Math.min(availW / nativeW, availH / nativeH, 1);
  return Math.max(ZOOM_MIN, Math.floor(fit / ZOOM_STEP) * ZOOM_STEP);
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function formatCurrency(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, "");
  const parts = stripped.split(".");
  const whole = parts[0] || "0";
  const dec = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${withCommas}${dec}`;
}

function buildVars(brand: BrandState, fields: Record<string, string>): Record<string, string> {
  const { street, city, state, zip } = brand.address;
  const cityLine = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
  return {
    logo: brand.logo ?? "",
    icon: brand.icon ?? "",
    tagline: brand.tagline,
    website: brand.website,
    qr_code: generateQR(brand.website),
    fromName: brand.name,
    fromAddress: [street, cityLine].filter(Boolean).join("\n"),
    ...fields,
  };
}

interface AssetEditorProps {
  open: boolean;
  onClose: () => void;
  asset: AssetTypeConfig;
  template: AssetTemplate;
  templateBody: string;
  brand: BrandState;
}

export function AssetEditor({ open, onClose, asset, template, templateBody, brand }: AssetEditorProps) {
  const [generating, setGenerating] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(1);
  const [orderSent, setOrderSent] = useState(false);
  const [quantity, setQuantity] = useState("100");

  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    const { street, city, state, zip } = brand.address;
    const cityLine = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
    const formattedAddress = [street, cityLine].filter(Boolean).join("\n");

    for (const f of asset.fields) {
      if (f.key === "email") seed[f.key] = brand.email;
      else if (f.key === "phone") seed[f.key] = formatPhone(brand.phone);
      else if (f.key === "tagline") seed[f.key] = brand.tagline;
      else if (f.key === "website") seed[f.key] = brand.website;
      else if (f.key === "companyName" || f.key === "fromName") seed[f.key] = brand.name;
      else if (f.key === "fromAddress") seed[f.key] = formattedAddress;
      else seed[f.key] = "";
    }
    setFields(seed);
    setZoom(fitZoom(asset.previewWidth, asset.previewHeight));
  }, [open, asset, brand]);

  const renderedHTML = useMemo(
    () => renderTemplate(templateBody, buildVars(brand, fields)),
    [templateBody, brand, fields]
  );

  const requiredMissing = asset.fields
    .filter((f) => f.required)
    .some((f) => !fields[f.key]?.trim());

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));

  const updateField = (key: string, value: string, type?: string) => {
    let formatted = value;
    if (type === "tel") formatted = formatPhone(value);
    else if (type === "currency") formatted = formatCurrency(value);
    setFields((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleOrder = async () => {
    setGenerating(true);
    setOrderSent(false);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: renderedHTML,
          filename: `${asset.id}-${template.id}`,
          quantity,
        }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Order failed"));

      setOrderSent(true);
      setTimeout(() => setOrderSent(false), 2000);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const displayW = asset.previewWidth * zoom;
  const displayH = asset.previewHeight * zoom;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 p-3 md:p-[50px]" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-full flex-col overflow-hidden rounded border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-3 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
            <span className="hidden md:inline rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {asset.label} &middot; {asset.description}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Qty</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1,000</option>
              </select>
            </div>
            <button
              onClick={handleOrder}
              disabled={generating || requiredMissing || orderSent}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {generating ? "Sending..." : orderSent ? "Order Sent!" : "Confirm Order"}
            </button>
            <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left — fields */}
          <div className="w-full md:w-[340px] shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 p-5 max-h-[40vh] md:max-h-none bg-white">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Variable Fields
            </p>
            <div className="space-y-3">
              {asset.fields.map((f) =>
                f.readonly ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500">{f.label}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fields[f.key] ?? ""}
                        readOnly
                        tabIndex={-1}
                        placeholder={f.placeholder}
                        className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-400 placeholder-gray-300 cursor-not-allowed select-none"
                      />
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    {f.hint && <p className="text-xs text-gray-400">{f.hint}</p>}
                  </div>
                ) : f.type === "textarea" ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      {f.label}{f.required && <span className="text-red-500"> *</span>}
                    </label>
                    <textarea
                      value={fields[f.key] ?? ""}
                      onChange={(e) => updateField(f.key, e.target.value, f.type)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                ) : (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      {f.label}{f.required && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type={f.type === "tel" || f.type === "currency" ? "text" : (f.type ?? "text")}
                      value={fields[f.key] ?? ""}
                      onChange={(e) => updateField(f.key, e.target.value, f.type)}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right — preview */}
          <div className="relative flex min-w-0 min-h-0 flex-1 flex-col bg-gray-100">
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded border border-gray-200 bg-white px-1 py-0.5 shadow-sm">
              <button
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-12 text-center text-xs text-gray-500">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div
                className="flex flex-col items-center justify-center gap-6 p-4 md:p-10"
                style={{ minWidth: displayW + 80, minHeight: displayH + 80 }}
              >
                <div
                  className="shrink-0 rounded border border-gray-300 shadow-md overflow-hidden"
                  style={{ width: displayW, height: displayH }}
                >
                  <iframe
                    srcDoc={renderedHTML}
                    title="Preview"
                    className="pointer-events-none block border-0"
                    scrolling="no"
                    style={{
                      width: asset.previewWidth,
                      height: asset.previewHeight,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 text-center text-xs text-gray-400">
              {asset.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the dev server and verify no TypeScript errors**

```bash
npm run dev
```

Expected: compiles without errors. Open `/dashboard/print` — page loads, shows empty state ("No print templates configured") since no DB rows exist yet.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/AssetEditor.tsx
git commit -m "feat: AssetEditor uses renderTemplate + templateBody prop"
```

---

## Task 8: Delete `lib/asset-html.ts`

**Files:**
- Delete: `lib/asset-html.ts`

- [ ] **Step 1: Verify nothing still imports `asset-html`**

```bash
grep -r "asset-html" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
```

Expected: no results (all imports were in `AssetEditor.tsx`, which was updated in Task 7).

- [ ] **Step 2: Delete the file**

```bash
rm lib/asset-html.ts
```

- [ ] **Step 3: Confirm build passes**

```bash
npm run build
```

Expected: build succeeds with no missing module errors.

- [ ] **Step 4: Commit**

```bash
git add -u lib/asset-html.ts
git commit -m "chore: remove asset-html.ts — replaced by renderTemplate + DB templates"
```

---

## Task 9: Seed a test template and verify end-to-end

- [ ] **Step 1: Insert a test row in Supabase SQL editor**

Replace `<your-tenant-uuid>` with your tenant's UUID (find it in the `tenants` table).

```sql
insert into public.tenant_asset_templates (tenant_id, asset_type_id, template_id, html_body)
values (
  '<your-tenant-uuid>',
  'business-card',
  'light',
  '<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: 3.5in 2in; margin: 0; }
  body { margin: 0; width: 3.5in; height: 2in; font-family: sans-serif;
         display: flex; align-items: flex-end; padding: 0.2in; box-sizing: border-box; background: #fff; }
  .name { font-size: 14px; font-weight: bold; color: #1a1a1a; }
  .info { font-size: 9px; color: #595959; margin-top: 2px; }
</style>
</head>
<body>
  <div>
    <div class="name">{{name}}</div>
    <div class="info">{{phone}}</div>
    <div class="info">{{email}}</div>
    <div class="info">{{tagline}}</div>
  </div>
</body>
</html>'
);
```

- [ ] **Step 2: Open `/dashboard/print`**

Expected:
- "Business Cards" appears in the asset type selector
- "English" template card appears in the grid
- Clicking the card opens `AssetEditor`
- Preview iframe renders the HTML with substituted field values
- Changing a field updates the preview live

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: db-driven asset templates complete — end-to-end verified"
```

---

## Self-Review Notes

- **Spec coverage:** Migration ✓, `renderTemplate` ✓, token set ✓, API route ✓, print page derived asset list ✓, `AssetSelector` prop ✓, `AssetEditor` uses renderTemplate ✓, `asset-html.ts` removed ✓
- **No placeholders:** All code blocks are complete and runnable
- **Type consistency:** `AssetTemplateRow` exported from the route file and imported in `print/page.tsx`. `TemplateMap` defined locally in `print/page.tsx`. `buildVars` and `renderTemplate` signatures are consistent across tasks.
- **Breaking change noted:** `AssetSelector` now requires `assetTypes` prop — only one call site (`print/page.tsx`) which is updated in Task 5.
