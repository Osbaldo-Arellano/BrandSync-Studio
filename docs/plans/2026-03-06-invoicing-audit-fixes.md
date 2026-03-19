# Invoicing & Estimates Audit Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all gaps identified in the invoicing/estimates audit so BrandSync is a complete, professional small-business invoicing tool.

**Architecture:** Single migration for all DB changes first, then feature work in dependency order. No new pages for simple features — extend existing components. Reuse `NewEstimateForm` pattern for estimate editing and standalone invoice creation.

**Tech Stack:** Next.js App Router, Supabase (server + admin clients), Tailwind CSS v4, Resend (email), Stripe, Puppeteer (PDF)

---

## Task 1: Master Migration

**Files:**
- Create: `supabase/migrations/20260306000002_invoicing_audit.sql`

**Step 1: Write and apply the migration**

```sql
-- =============================================
-- 1. Invoice sequential numbering
-- =============================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number INTEGER;

-- Backfill existing rows
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM invoices
)
UPDATE invoices SET invoice_number = numbered.rn
FROM numbered WHERE invoices.id = numbered.id;

SELECT setval('invoice_number_seq', COALESCE((SELECT MAX(invoice_number) FROM invoices), 0));

ALTER TABLE invoices ALTER COLUMN invoice_number SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT nextval('invoice_number_seq');

CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := nextval('invoice_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_assign_number ON invoices;
CREATE TRIGGER invoices_assign_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION assign_invoice_number();

-- =============================================
-- 2. Invoice additional fields
-- =============================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS due_date        text,
  ADD COLUMN IF NOT EXISTS notes           text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS customer_email  text,
  ADD COLUMN IF NOT EXISTS customer_phone  text;

-- =============================================
-- 3. Void status
-- =============================================
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft','sent','paid','overdue','partial','cash','deferred','void'));

-- =============================================
-- 4. Invoice items — add line_total
-- =============================================
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS line_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- =============================================
-- 5. Estimate additional fields
-- =============================================
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS expires_at      timestamptz,
  ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
```

**Step 2: Apply in Supabase SQL editor**

Paste and run the above SQL in the Supabase dashboard SQL editor for the project at `knhgoaphmtewjhtvglpe`.

**Step 3: Commit the migration file**

```bash
git add supabase/migrations/20260306000002_invoicing_audit.sql
git commit -m "feat: master migration for invoicing audit — invoice numbers, due dates, tax, discount, void, line_total, estimate expiry"
```

---

## Task 2: Fix $0 Unit Price + Copy All Fields in Sign Route

The sign route copies estimate items to invoice items but omits `line_total`. When `unit_price = 0` (override mode), invoice items show $0. Also missing: `customer_address`, `customer_phone`, new invoice fields.

**Files:**
- Modify: `app/api/estimates/[id]/sign/route.ts`

**Step 1: Update the invoice insert in sign route**

Find the `Auto-create invoice from approved estimate` block and replace the invoice insert and items copy:

```typescript
// Replace the invoice insert:
const { data: newInvoice } = await admin
  .from("invoices")
  .insert({
    tenant_id: row.tenant_id,
    estimate_id: id,
    customer_name: row.customer_name ?? "",
    customer_email: row.customer_email ?? null,
    customer_address: row.customer_address ?? null,
    customer_phone: row.customer_phone ?? null,
    status: "sent",
    total: row.total ?? 0,
    amount_paid: 0,
    discount_amount: row.discount_amount ?? 0,
    tax_rate: row.tax_rate ?? 0,
    tax_amount: row.tax_amount ?? 0,
    notes: row.notes ?? "",
    due_date: row.due_date ?? null,
  })
  .select("id")
  .single();

// Replace the invoice items copy:
if (newInvoice) {
  invoiceId = newInvoice.id;
  const invoiceItems = (items ?? []).map((item) => ({
    invoice_id: newInvoice.id,
    description: item.description ?? "",
    quantity: item.quantity ?? 0,
    unit_price: item.unit_price ?? 0,
    line_total: item.line_total ?? (item.quantity ?? 0) * (item.unit_price ?? 0),
  }));
  if (invoiceItems.length > 0) {
    await admin.from("invoice_items").insert(invoiceItems);
  }
  await admin.from("estimates").update({ status: "invoiced" }).eq("id", id);
}
```

**Step 2: Update the `POST /api/invoices` route (manual invoice generation)**

File: `app/api/invoices/route.ts`

Update the items copy in the POST handler:
```typescript
const items = (estimate.estimate_items ?? []).map((item: Record<string, unknown>) => ({
  invoice_id: invoice.id,
  description: item.description ?? "",
  quantity: item.quantity ?? 0,
  unit_price: item.unit_price ?? 0,
  line_total: (item.line_total as number) ?? ((item.quantity as number) ?? 0) * ((item.unit_price as number) ?? 0),
}));
```

Also update the invoice insert to copy estimate fields:
```typescript
.insert({
  tenant_id: user.id,
  estimate_id: estimateId,
  customer_name: estimate.customer_name ?? "",
  customer_address: estimate.customer_address ?? null,
  customer_email: estimate.customer_email ?? null,
  customer_phone: estimate.customer_phone ?? null,
  status: "draft",
  total: estimate.total ?? 0,
  discount_amount: estimate.discount_amount ?? 0,
  tax_rate: estimate.tax_rate ?? 0,
  tax_amount: estimate.tax_amount ?? 0,
  notes: estimate.notes ?? "",
  due_date: estimate.due_date ?? null,
})
```

**Step 3: Commit**
```bash
git commit -m "fix: copy line_total + all fields when creating invoice from estimate"
```

---

## Task 3: Update Invoice Types + Checkout to Use line_total

**Files:**
- Modify: `types/invoices.ts`
- Modify: `app/api/invoices/[id]/checkout/route.ts`
- Modify: `lib/invoice-html.ts`

**Step 1: Update `InvoiceItem` type**

```typescript
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number?: number;
  estimate_id: string | null;
  customer_id: string;
  customerName: string;
  customer_address?: string | null;
  customer_email?: string | null;
  status: InvoiceStatus;
  total: number;
  amount_paid?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  due_date?: string | null;
  notes?: string;
  created_at: string;
  items: InvoiceItem[];
}
```

**Step 2: Update checkout route to use `line_total`**

In `app/api/invoices/[id]/checkout/route.ts`, update the full-payment line items mapping:
```typescript
// Replace the items.map in the full-payment path:
lineItems = items.map((item) => ({
  quantity: 1,
  price_data: {
    currency: "usd",
    unit_amount: Math.round(
      ((item.line_total as number) > 0
        ? (item.line_total as number)
        : (item.quantity as number) * (item.unit_price as number)) * 100
    ),
    product_data: { name: item.description || "Service" },
  },
}));
```

Also fetch `line_total` in the select:
```typescript
.select("description, quantity, unit_price, line_total")
```

**Step 3: Update `invoice-html.ts` to use `line_total`**

In the `InvoiceItem` interface in `lib/invoice-html.ts`:
```typescript
interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}
```

In `itemRows` mapping, use `line_total` when available:
```typescript
const lt = item.line_total && item.line_total > 0
  ? item.line_total
  : item.quantity * item.unit_price;
```

Also add tax/discount to totals section in the HTML:
```html
<!-- after subtotal row, before total row: -->
${invoice.discount_amount && invoice.discount_amount > 0 ? `
<tr>
  <td colspan="3" style="...">Discount</td>
  <td style="...color:#059669;">−${usd(invoice.discount_amount)}</td>
</tr>` : ""}
${invoice.tax_amount && invoice.tax_amount > 0 ? `
<tr>
  <td colspan="3" style="...">Tax (${invoice.tax_rate}%)</td>
  <td style="...">${usd(invoice.tax_amount)}</td>
</tr>` : ""}
```

**Step 4: Commit**
```bash
git commit -m "fix: use line_total in checkout and invoice PDF; add tax/discount to invoice HTML"
```

---

## Task 4: Invoice Number + Due Date — Display Everywhere

**Files:**
- Modify: `app/dashboard/invoices/page.tsx`
- Modify: `app/dashboard/invoices/[id]/page.tsx`
- Modify: `components/invoices/InvoiceList.tsx`
- Modify: `components/invoices/InvoiceDetail.tsx`
- Modify: `lib/invoice-html.ts`

**Step 1: Update `invoices/page.tsx` to fetch new fields**

```typescript
// Add to invoice map:
invoice_number: (row.invoice_number as number) ?? 0,
due_date: (row.due_date as string | null) ?? null,
```

**Step 2: Update `invoices/[id]/page.tsx`**

```typescript
// Add to invoice object:
invoice_number: (row.invoice_number as number) ?? 0,
due_date: (row.due_date as string | null) ?? null,
notes: (row.notes as string) ?? "",
discount_amount: (row.discount_amount as number) ?? 0,
tax_rate: (row.tax_rate as number) ?? 0,
tax_amount: (row.tax_amount as number) ?? 0,
customer_address: (row.customer_address as string | null) ?? null,
```

**Step 3: Update `InvoiceList.tsx`**

- Change `INV-{uuid-slice}` display to `INV-{invoice_number.toString().padStart(4, '0')}` when `invoice_number` exists
- Add due date column (desktop) or due date line (mobile card)
- Add `due_date` to Invoice interface in the component

**Step 4: Update `InvoiceDetail.tsx`**

- Change `invoiceNum` from UUID slice to:
  ```typescript
  const invoiceNum = invoice.invoice_number
    ? `INV-${String(invoice.invoice_number).padStart(4, "0")}`
    : `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  ```
- Show due date in the document header (next to created date)
- Show notes section if `invoice.notes` is non-empty
- Show discount/tax lines in totals if non-zero
- Add `invoice_number`, `due_date`, `notes`, `discount_amount`, `tax_rate`, `tax_amount` to `InvoiceDetailData` interface

**Step 5: Update `invoice-html.ts`**

- Add `invoice_number` to `InvoiceData` interface
- Use `INV-${String(invoice.invoice_number).padStart(4, "0")}` when available
- Add due date line: `Due: ${invoice.due_date}` in header
- Add notes section before footer
- Add tax/discount to totals

**Step 6: Commit**
```bash
git commit -m "feat: invoice numbers (INV-0001), due dates, notes, tax/discount on invoice display and PDF"
```

---

## Task 5: Send Invoice Email to Customer

**Files:**
- Create: `app/api/invoices/[id]/send/route.ts`
- Modify: `components/invoices/InvoiceDetail.tsx`

**Step 1: Create the send route**

```typescript
// app/api/invoices/[id]/send/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { customerEmail } = await request.json() as { customerEmail: string };

  if (!customerEmail?.trim()) {
    return NextResponse.json({ error: "Customer email required" }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, total, customer_email")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://brand-sync-studio.vercel.app";
  const paymentLink = `${appUrl}/pay/${id}`;
  const invoiceNum = invoice.invoice_number
    ? `INV-${String(invoice.invoice_number).padStart(4, "0")}`
    : `INV-${id.slice(0, 8).toUpperCase()}`;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [customerEmail.trim()],
    subject: `Invoice ${invoiceNum} from ${tenant?.name ?? ""}`,
    html: `
      <p>Hi ${invoice.customer_name},</p>
      <p>Please find your invoice <strong>${invoiceNum}</strong> for <strong>${(invoice.total as number).toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong>.</p>
      <p><a href="${paymentLink}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none;font-weight:600;">View &amp; Pay Invoice</a></p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">${tenant?.name ?? ""}</p>
    `,
  });

  // Save the customer email on the invoice if not already set
  await supabase
    .from("invoices")
    .update({ customer_email: customerEmail.trim(), status: "sent" })
    .eq("id", id)
    .eq("tenant_id", user.id);

  return NextResponse.json({ ok: true });
}
```

**Step 2: Add "Send to Customer" modal to `InvoiceDetail.tsx`**

Mirror the pattern from `EstimateDetail.tsx`:
- Add `showSendModal`, `modalEmail`, `sending`, `sendError` state
- Add a modal with email input + payment link copy button
- Show "Send to Customer" button in the action panel for `draft` and `sent` statuses
- On success: update local status to `"sent"`

Key additions to action panel:
```tsx
{(status === "draft" || status === "sent") && (
  <button
    onClick={() => setShowSendModal(true)}
    className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
  >
    Send to Customer
  </button>
)}
```

**Step 3: Commit**
```bash
git commit -m "feat: send invoice email to customer with payment link"
```

---

## Task 6: Estimate Editing

**Files:**
- Create: `app/dashboard/estimates/[id]/edit/page.tsx`
- Modify: `app/api/estimates/[id]/route.ts` — add PUT handler
- Modify: `components/estimates/EstimateDetail.tsx` — add Edit button

**Step 1: Add PUT handler to `app/api/estimates/[id]/route.ts`**

```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Only draft estimates can be edited
  const { data: existing } = await supabase
    .from("estimates")
    .select("status")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft estimates can be edited" }, { status: 400 });
  }

  const body = await request.json();
  const { customerName, customerAddress, salesperson, job, paymentTerms, dueDate,
    deposit, cashNote, notes, items, total, taxRate, taxAmount, discountAmount } = body;

  // Update estimate
  const { error: estError } = await supabase
    .from("estimates")
    .update({
      customer_name: customerName,
      customer_address: customerAddress,
      salesperson, job,
      payment_terms: paymentTerms,
      due_date: dueDate,
      deposit, total,
      cash_note: cashNote,
      notes,
      tax_rate: taxRate ?? 0,
      tax_amount: taxAmount ?? 0,
      discount_amount: discountAmount ?? 0,
    })
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (estError) return NextResponse.json({ error: estError.message }, { status: 500 });

  // Replace items: delete all, re-insert
  await supabase.from("estimate_items").delete().eq("estimate_id", id);

  if (items?.length > 0) {
    const itemRows = items.map((item: Record<string, unknown>) => ({
      estimate_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));
    const { error: itemsError } = await supabase.from("estimate_items").insert(itemRows);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

**Step 2: Create edit page `app/dashboard/estimates/[id]/edit/page.tsx`**

- Server component — fetch estimate + items + tenant, same as detail page
- Pass data to a new `EditEstimateForm` client component (or reuse `NewEstimateForm` with an `initialData` prop)
- On submit: PUT to `/api/estimates/${id}` then redirect to `/dashboard/estimates/${id}`

```typescript
// app/dashboard/estimates/[id]/edit/page.tsx
export default async function EditEstimatePage({ params }) {
  const { id } = await params;
  // ... fetch estimate + items + tenant (same as detail page)
  // Only allow editing drafts
  if (row.status !== "draft") redirect(`/dashboard/estimates/${id}`);
  return <EditEstimateForm estimate={...} tenant={...} />;
}
```

**Step 3: Create `components/estimates/EditEstimateForm.tsx`**

Reuse all logic from `NewEstimateForm.tsx` — extract shared form state and line-item logic into the same component. Key differences:
- Pre-populate all fields from `estimate` prop
- On submit: `PUT /api/estimates/${estimate.id}` instead of `POST /api/estimates`
- After success: `router.push(\`/dashboard/estimates/${estimate.id}\`)`
- Title: "Edit Estimate" instead of "New Estimate"

**Step 4: Add Edit button to `EstimateDetail.tsx`**

In the top bar, when `status === "draft"`:
```tsx
{status === "draft" && (
  <Link
    href={`/dashboard/estimates/${estimate.id}/edit`}
    className="flex items-center gap-1.5 rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
  >
    Edit
  </Link>
)}
```

**Step 5: Commit**
```bash
git commit -m "feat: estimate editing for draft estimates"
```

---

## Task 7: Tax + Discount on Estimates

**Files:**
- Modify: `components/estimates/NewEstimateForm.tsx`
- Modify: `components/estimates/EditEstimateForm.tsx` (new from Task 6)
- Modify: `lib/estimate-html.ts`
- Modify: `types/estimates.ts`

**Step 1: Add to `Estimate` type**

```typescript
export interface Estimate {
  // ... existing fields ...
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  expires_at?: string | null;
}
```

**Step 2: Add tax rate + discount fields to `NewEstimateForm.tsx`**

Add after the Deposit field in the totals section:

```tsx
{/* Discount */}
<div className="flex items-center gap-3 justify-end">
  <label className="text-sm text-gray-600 w-32 text-right">Discount</label>
  <USDInput value={discountAmount} onChange={setDiscountAmount} className="w-32" placeholder="$0.00" />
</div>

{/* Tax Rate */}
<div className="flex items-center gap-3 justify-end">
  <label className="text-sm text-gray-600 w-32 text-right">Tax Rate (%)</label>
  <input
    type="number"
    min="0"
    max="100"
    step="0.1"
    value={taxRate}
    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
    className="w-32 rounded border border-gray-300 px-3 py-2 text-sm text-right"
    placeholder="0"
  />
</div>
```

Compute `taxAmount = (subtotal - deposit - discountAmount) * (taxRate / 100)` reactively.

Include in POST body: `taxRate, taxAmount, discountAmount`.

**Step 3: Update `estimate-html.ts`**

Add discount + tax rows to the totals table (after subtotal, before deposit/total):
```html
${estimate.discount_amount > 0 ? `
<tr>
  <td ...>Discount</td>
  <td ...>−${usd(estimate.discount_amount)}</td>
</tr>` : ''}
${estimate.tax_amount > 0 ? `
<tr>
  <td ...>Tax (${estimate.tax_rate}%)</td>
  <td ...>${usd(estimate.tax_amount)}</td>
</tr>` : ''}
```

**Step 4: Commit**
```bash
git commit -m "feat: tax rate and discount on estimates"
```

---

## Task 8: Estimate Expiry Date

**Files:**
- Modify: `components/estimates/NewEstimateForm.tsx`
- Modify: `components/estimates/EstimateDetail.tsx`
- Modify: `app/e/[id]/page.tsx` — show expiry warning on public page

**Step 1: Add expiry field to estimate form**

Add a date picker after the Due Date field:
```tsx
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Estimate Expires
  </label>
  <input
    type="date"
    value={expiresAt}
    onChange={(e) => setExpiresAt(e.target.value)}
    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
  />
  <p className="text-xs text-gray-400 mt-1">Leave blank to use 30-day default</p>
</div>
```

Default: 30 days from today (`new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)`).

Include `expiresAt` in the POST body.

**Step 2: Show expiry on `EstimateDetail.tsx`**

In the document header area, show:
```tsx
{estimate.expires_at && new Date(estimate.expires_at) > new Date() && (
  <p className="text-xs text-gray-400">
    Expires {new Date(estimate.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
  </p>
)}
{estimate.expires_at && new Date(estimate.expires_at) <= new Date() && status === "sent" && (
  <p className="text-xs text-red-500 font-medium">This estimate has expired</p>
)}
```

**Step 3: Show expiry warning on public signing page**

In `app/e/[id]/page.tsx`, check if `expires_at` is in the past. If so, render an "expired" state instead of the signature panel:
```tsx
const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
if (isExpired) {
  return <ExpiredEstimate tenantName={tenantProfile.name} />;
}
```

Also add `expires_at` to the query: `.select("*, estimate_items(*)")` — already selects `*`.

**Step 4: Update API routes** to include `expires_at` in `app/api/estimates/route.ts` POST handler.

**Step 5: Commit**
```bash
git commit -m "feat: estimate expiry date — form field, detail display, public page guard"
```

---

## Task 9: Void Invoice

**Files:**
- Modify: `components/invoices/InvoiceDetail.tsx`
- Modify: `components/invoices/InvoiceList.tsx`

The `void` status is already in the DB constraint from Task 1 and in `InvoiceStatus` from previous work. Just needs UI.

**Step 1: Add void to `InvoiceStatus` type** (if not already there)

```typescript
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial" | "cash" | "deferred" | "void";
```

**Step 2: Add void chip style to both list and detail**

```typescript
void: "bg-gray-100 text-gray-400 border border-gray-200 line-through",
```

Label: `"Void"`

**Step 3: Add Void button to `InvoiceDetail.tsx` action panel**

Show for `sent`, `cash`, `deferred`, `partial` statuses — not for `paid` or already `void`:
```tsx
{["sent","cash","deferred","partial","draft"].includes(status) && (
  <button
    onClick={() => updateStatus("void")}
    disabled={updating}
    className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 transition-colors"
  >
    Void Invoice
  </button>
)}
{status === "void" && (
  <span className="text-sm text-gray-400">This invoice has been voided</span>
)}
```

**Step 4: Commit**
```bash
git commit -m "feat: void invoice status with UI"
```

---

## Task 10: Auto Overdue Detection

**Files:**
- Modify: `app/dashboard/invoices/page.tsx`

When loading the invoices page, check for any `sent` invoices with a `due_date` in the past and bulk-update them to `overdue`.

**Step 1: Add auto-overdue check in `invoices/page.tsx`**

```typescript
// After fetching rows, before mapping:
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const overdueIds = (rows ?? [])
  .filter(r => r.status === "sent" && r.due_date && r.due_date < today)
  .map(r => r.id);

if (overdueIds.length > 0) {
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .in("id", overdueIds)
    .eq("tenant_id", user.id);
  // Patch the in-memory rows too so the list reflects the change immediately
  rows = rows!.map(r => overdueIds.includes(r.id) ? { ...r, status: "overdue" } : r);
}
```

**Step 2: Commit**
```bash
git commit -m "feat: auto-mark sent invoices as overdue when due_date has passed"
```

---

## Task 11: Standalone Invoice Creation

Allow creating an invoice without an estimate — useful for repeat work, time & materials, etc.

**Files:**
- Create: `app/dashboard/invoices/new/page.tsx`
- Create: `components/invoices/NewInvoiceForm.tsx`
- Modify: `app/api/invoices/route.ts` — update POST to support standalone
- Modify: `components/invoices/InvoiceList.tsx` — add "New Invoice" button

**Step 1: Update `POST /api/invoices` to support standalone**

```typescript
// Make estimateId optional
const { estimateId, customerName, customerAddress, items, total,
  notes, dueDate, taxRate, taxAmount, discountAmount } = await request.json();

if (estimateId) {
  // existing estimate-based flow
} else {
  // standalone: create invoice directly from form data
  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      tenant_id: user.id,
      customer_name: customerName ?? "",
      customer_address: customerAddress ?? null,
      status: "draft",
      total: total ?? 0,
      amount_paid: 0,
      notes: notes ?? "",
      due_date: dueDate ?? null,
      tax_rate: taxRate ?? 0,
      tax_amount: taxAmount ?? 0,
      discount_amount: discountAmount ?? 0,
    })
    .select()
    .single();

  // insert items
  // return { id: invoice.id }
}
```

**Step 2: Create `NewInvoiceForm.tsx`**

Simple form (no estimate context):
- Customer name (text)
- Customer address (textarea)
- Due date (date input)
- Line items table (same `FormLineItem` pattern as `NewEstimateForm`)
- Tax rate % + discount fields
- Notes textarea
- Totals summary
- Submit → POST to `/api/invoices` → redirect to `/dashboard/invoices/${id}`

**Step 3: Create `app/dashboard/invoices/new/page.tsx`**

```typescript
export default async function NewInvoicePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: tenant } = await supabase.from("tenants").select(...).eq("id", user.id).single();
  return <NewInvoiceForm tenant={tenantProfile} />;
}
```

**Step 4: Add "New Invoice" button to `InvoiceList.tsx` header**

```tsx
<Link href="/dashboard/invoices/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
  + New Invoice
</Link>
```

**Step 5: Commit**
```bash
git commit -m "feat: standalone invoice creation without requiring an estimate"
```

---

## Task 12: Dashboard Date-Range Filter

**Files:**
- Modify: `components/dashboard/DashboardHome.tsx`
- Modify: `app/dashboard/page.tsx`

**Step 1: Add period selector to `DashboardHome.tsx`**

Add a `period` state: `"7d" | "30d" | "90d" | "ytd" | "all"` (default: `"30d"`).

Add a `<select>` or segmented control in the top bar:
```tsx
<select
  value={period}
  onChange={(e) => setPeriod(e.target.value as Period)}
  className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
>
  <option value="7d">Last 7 days</option>
  <option value="30d">Last 30 days</option>
  <option value="90d">Last 90 days</option>
  <option value="ytd">Year to date</option>
  <option value="all">All time</option>
</select>
```

**Step 2: Filter KPIs and recent tables by period**

```typescript
function cutoff(period: Period): Date | null {
  const now = new Date();
  if (period === "7d") return new Date(now.getTime() - 7 * 86400000);
  if (period === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (period === "90d") return new Date(now.getTime() - 90 * 86400000);
  if (period === "ytd") return new Date(now.getFullYear(), 0, 1);
  return null;
}

// Filter estimates/invoices arrays by created_at >= cutoff
const filteredEstimates = cutoff(period)
  ? estimates.filter(e => new Date(e.created_at) >= cutoff(period)!)
  : estimates;
```

Apply `filteredEstimates` and `filteredInvoices` to all KPI calculations and recent tables.

**Step 3: Commit**
```bash
git commit -m "feat: dashboard date-range filter (7d / 30d / 90d / YTD / all)"
```

---

## Task 13: Final Polish — Update InvoiceList columns + PATCH whitelist

**Files:**
- Modify: `app/api/invoices/[id]/route.ts` — ensure `void` in allowed list
- Modify: `components/invoices/InvoiceList.tsx` — show INV-0001 format, add due date column
- Modify: `components/invoices/InvoiceDetail.tsx` — show INV-0001 in header

**Step 1: Ensure void in PATCH allowed list**

```typescript
const allowed = ["draft","sent","paid","overdue","partial","cash","deferred","void"];
```

**Step 2: Update InvoiceList to show invoice_number + due_date**

- Fetch `invoice_number` and `due_date` in `invoices/page.tsx`
- Show `INV-0001` format in the invoice # column
- Add a "Due" column (desktop) showing due date or "—"
- Color due date red if past and status isn't paid/void

**Step 3: Commit**
```bash
git commit -m "chore: final polish — invoice number format, due date column, void in PATCH whitelist"
```

---

## Execution Order

Tasks must be done in this order (dependencies):

```
Task 1 (Migration) → Tasks 2-3 (data fixes) → Tasks 4-13 (features, parallelizable)
```

Tasks 4–13 are independent of each other and can be done in any order after Task 3.

---

## Testing Checklist

After all tasks:

- [ ] Create estimate → send → customer signs → redirected to `/pay/[id]` with itemized line items and correct prices
- [ ] Invoice PDF shows `INV-0001`, due date, correct line item totals, tax/discount if set
- [ ] "Send to Customer" emails payment link to customer
- [ ] Create estimate → discard won't show edit button on non-draft
- [ ] Edit draft estimate → changes reflected immediately
- [ ] Standalone invoice creation from `/dashboard/invoices/new`
- [ ] Invoice past due date auto-marks as overdue on page load
- [ ] Void invoice shows strikethrough chip, no action buttons
- [ ] Expired estimate shows warning on public signing page
- [ ] Dashboard period filter changes all KPI values
- [ ] Tax + discount show on estimate PDF and invoice PDF
