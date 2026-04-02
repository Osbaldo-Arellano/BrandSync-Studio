# DB-Driven Asset Templates Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move print asset HTML templates from hardcoded TypeScript functions into a per-tenant database table, so each client gets their own set of bespoke templates and only sees the asset types they have templates for.

**Architecture:** A new `tenant_asset_templates` table stores one HTML body per `(tenant_id, asset_type_id, template_id)`. At render time, the server fetches the matching row and substitutes `{{placeholder}}` tokens with brand/field data. Presence of a row = that asset type is enabled for that tenant — no separate enablement config needed.

**Tech Stack:** Supabase (PostgreSQL + RLS), Next.js App Router (server components + API routes), TypeScript, Puppeteer

---

## Database Schema

```sql
create table public.tenant_asset_templates (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references public.tenants(id) on delete cascade,
  asset_type_id text        not null,  -- matches AssetTypeConfig.id in types/assets.ts
  template_id   text        not null,  -- e.g. "light", "light-es"
  html_body     text        not null,  -- HTML with {{placeholder}} tokens
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, asset_type_id, template_id)
);

-- RLS
alter table public.tenant_asset_templates enable row level security;

create policy "tenant reads own templates"
  on public.tenant_asset_templates for select
  using (tenant_id = auth.uid());
```

Admin manages rows directly in the Supabase dashboard. No in-app UI needed.

---

## Placeholder Token Set

Every HTML body may contain any of these `{{tokens}}`:

| Token | Source |
|---|---|
| `{{logo}}` | base64 data URI — `brand.logo` |
| `{{icon}}` | base64 data URI — `brand.icon` |
| `{{tagline}}` | `brand.tagline` |
| `{{website}}` | `brand.website` |
| `{{qr_code}}` | SVG string generated from `brand.website` via `qrcode-generator` |
| `{{name}}` | business card field |
| `{{title}}` | business card field |
| `{{email}}` | business card field |
| `{{phone}}` | business card / sticker field |
| `{{fromName}}` | envelope field |
| `{{fromAddress}}` | envelope field |
| `{{toName}}` | envelope field |
| `{{toAddress}}` | envelope field |
| `{{googleUrl}}` | google review card field |

Substitution is a single regex pass — no template library required:
```ts
str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "")
```

Unknown tokens are replaced with an empty string (silent, not an error).

---

## Code Changes

### 1. New migration
**File:** `supabase/migrations/20260402000000_tenant_asset_templates.sql`

Creates the `tenant_asset_templates` table and RLS policy (schema above).

### 2. New `lib/render-template.ts`
Pure function — no DB access, no side effects.

```ts
export function renderTemplate(
  htmlBody: string,
  vars: Record<string, string>
): string {
  return htmlBody.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
```

### 3. Update `lib/asset-html.ts`
- Remove the `GENERATORS` map (the large per-template TypeScript functions)
- Remove the `LOGOS` static base64 object (logos now come from brand state or are omitted)
- Keep the `GenerateOptions` interface and color palette `P` (still useful for admin when hand-authoring templates)
- Replace `generateAssetHTML()` with a re-export that calls `renderTemplate` — actual DB fetch happens upstream in the API route and print page

```ts
// lib/asset-html.ts — slimmed down
export { renderTemplate } from "@/lib/render-template";
export type { GenerateOptions } from "@/lib/asset-html-types";
```

> Note: `GenerateOptions` moves to a small `lib/asset-html-types.ts` so it can be imported without pulling in the old generator bundle.

### 4. Update `app/api/render-pdf/route.ts`
Current flow: receives raw `html` string → Puppeteer renders it.

New flow:
1. Receive `{ tenantId, assetTypeId, templateId, fields, brandVars }` in request body
2. Fetch `html_body` from `tenant_asset_templates` using admin client (server-side, no user session needed for the Puppeteer worker)
3. Build `vars` record from `brandVars` + `fields` + generated `qr_code` SVG
4. Call `renderTemplate(html_body, vars)` → get final HTML string
5. Pass to Puppeteer as before

### 5. Update `app/dashboard/print/page.tsx`
Current flow: renders all `ASSET_TYPES` hardcoded.

New flow:
1. Query `tenant_asset_templates` for current tenant — `select distinct asset_type_id, template_id`
2. Build a map: `{ [assetTypeId]: templateId[] }`
3. Filter `ASSET_TYPES` to only IDs present in the map
4. For each visible asset type, show only the template IDs present in the map (not all templates from `ASSET_TYPES`)

`types/assets.ts` is **unchanged** — it remains the source of truth for dimensions, field definitions, and valid asset type IDs.

---

## Data Flow

```
Supabase dashboard (admin)
  └─ insert row into tenant_asset_templates
        (tenant_id, asset_type_id, template_id, html_body with {{tokens}})

User opens /dashboard/print
  └─ server queries tenant_asset_templates → gets available asset_type_ids
  └─ filters ASSET_TYPES → renders only enabled asset types + their templates

User clicks "Generate PDF"
  └─ POST /api/render-pdf with { assetTypeId, templateId, fields, brandVars }
  └─ server fetches html_body from tenant_asset_templates
  └─ renderTemplate(html_body, vars) → final HTML string
  └─ Puppeteer renders → returns PDF blob
```

---

## What Does Not Change

- `types/assets.ts` — `ASSET_TYPES`, `AssetTypeConfig`, `AssetField` all unchanged
- `app/api/render-pdf/route.ts` Puppeteer render logic — only the HTML source changes
- The `print` module toggle in `tenants.modules` — still gates access to the entire print section
- Auth pattern — server components use `createSupabaseServerClient()`, API routes use admin client for template fetch

---

## Out of Scope

- In-app template editor UI
- Template versioning / history
- Client-facing template preview before PDF generation (existing iframe preview still works — it uses the same rendered HTML)
