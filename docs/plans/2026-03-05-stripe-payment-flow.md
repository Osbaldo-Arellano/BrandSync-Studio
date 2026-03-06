# Stripe Payment Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After a client signs an estimate, auto-create an invoice and redirect them to a Stripe Checkout page supporting deposit or full payment, with a webhook updating invoice status on completion.

**Architecture:** Nine sequential tasks — migration + types first, then sign route auto-creates invoice and returns invoiceId, SignaturePanel redirects instead of showing static screen, public /pay/[id] page shows payment options, checkout API creates Stripe session, webhook confirms payment and updates status.

**Tech Stack:** Next.js 16 App Router, Supabase (admin client for public routes), Stripe (`stripe` npm package, Checkout mode), TypeScript, Tailwind CSS v4

---

## Task 1: Install Stripe + migration

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/supabase/migrations/20260305000002_invoices_partial_payment.sql`

**Step 1: Install stripe package**

```bash
cd D:/BrandSyncDashboard/brandsync && npm install stripe
```
Expected: stripe added to package.json dependencies.

**Step 2: Write the migration file**

```sql
-- Add "partial" to invoice status options
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partial'));

-- Track how much has been collected
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0;
```

**Step 3: Apply in Supabase SQL editor**

Paste and run the SQL. Verify with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'amount_paid';
```
Expected: one row returned.

---

## Task 2: Update InvoiceStatus type + InvoiceList UI

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/types/invoices.ts`
- Modify: `D:/BrandSyncDashboard/brandsync/components/invoices/InvoiceList.tsx`

Read both files before editing.

**Step 1: Add "partial" to InvoiceStatus**

In `types/invoices.ts`, change:
```ts
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
```
To:
```ts
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial";
```

**Step 2: Add partial chip to InvoiceList STATUS_STYLES**

In `components/invoices/InvoiceList.tsx`, add to the `STATUS_STYLES` record:
```ts
partial: "bg-amber-50 text-amber-700 border border-amber-200",
```

**Step 3: Add Partial filter tab to FILTER_TABS**

In `components/invoices/InvoiceList.tsx`, add to `FILTER_TABS` after the Sent entry:
```ts
{ label: "Partial", value: "partial" },
```

**Step 4: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 3: Sign route — auto-create invoice, return invoiceId

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/app/api/estimates/[id]/sign/route.ts`

Read the file first. The current route ends with `return NextResponse.json({ ok: true })`.

**Step 1: Add invoice creation after estimate update**

After the `if (updateError)` block (around line 99), and before the PDF/email block, insert this invoice creation logic:

```ts
// Auto-create invoice from approved estimate
let invoiceId: string | null = null;
try {
  const { data: newInvoice } = await admin
    .from("invoices")
    .insert({
      tenant_id: row.tenant_id,
      estimate_id: id,
      customer_name: row.customer_name ?? "",
      customer_email: row.customer_email ?? null,
      status: "sent",
      total: row.total ?? 0,
      amount_paid: 0,
    })
    .select("id")
    .single();

  if (newInvoice) {
    invoiceId = newInvoice.id;
    // Copy line items
    const invoiceItems = (items ?? []).map((item) => ({
      invoice_id: newInvoice.id,
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
    }));
    if (invoiceItems.length > 0) {
      await admin.from("invoice_items").insert(invoiceItems);
    }
  }
} catch {
  // Non-fatal: invoice creation failure should not block estimate approval
}
```

**Step 2: Update the return statement**

Change the final `return NextResponse.json({ ok: true })` to:
```ts
return NextResponse.json({ ok: true, invoiceId });
```

**Step 3: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 4: SignaturePanel — redirect to /pay/[invoiceId] on success

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/app/e/[id]/SignaturePanel.tsx`

Read the file first. The `handleSubmit` function currently calls `setDone(true)` on success.

**Step 1: Replace setDone with redirect**

In `handleSubmit`, replace:
```ts
setDone(true);
```
With:
```ts
const data = await res.json();
if (data.invoiceId) {
  window.location.href = `/pay/${data.invoiceId}`;
} else {
  setDone(true);
}
```

Note: keep the `setDone(true)` fallback for safety in case invoiceId is missing.

**Step 2: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 5: Public payment page /pay/[id]

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/app/pay/[id]/page.tsx`
- Create: `D:/BrandSyncDashboard/brandsync/app/pay/[id]/PaymentButtons.tsx`

**Step 1: Create PaymentButtons client component**

```tsx
"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  total: number;
  amountPaid: number;
  deposit: number;
  status: string;
}

export function PaymentButtons({ invoiceId, total, amountPaid, deposit, status }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const remaining = total - amountPaid;

  async function pay(type: "deposit" | "full") {
    setLoading(type);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to start checkout");
      }
    } finally {
      setLoading(null);
    }
  }

  if (status === "paid") {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 px-6 py-5 text-center">
        <p className="text-sm font-semibold text-emerald-700">Paid in full ✓</p>
        <p className="text-xs text-gray-500 mt-1">Thank you — your payment has been received.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status === "partial" && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Deposit received. Remaining balance:{" "}
          <strong>{remaining.toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong>
        </div>
      )}

      {status !== "partial" && deposit > 0 && (
        <button
          onClick={() => pay("deposit")}
          disabled={!!loading}
          className="w-full rounded border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "deposit"
            ? "Redirecting…"
            : `Pay Deposit — ${deposit.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
        </button>
      )}

      <button
        onClick={() => pay("full")}
        disabled={!!loading}
        className="w-full rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading === "full"
          ? "Redirecting…"
          : `Pay ${status === "partial" ? "Remaining Balance" : "Full Amount"} — ${remaining.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
      </button>
    </div>
  );
}
```

**Step 2: Create the page server component**

```tsx
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { PaymentButtons } from "./PaymentButtons";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const admin = createSupabaseAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, customer_name, status, total, amount_paid, estimate_id, tenant_id")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", invoice.tenant_id)
    .single();

  // Fetch deposit from linked estimate
  let deposit = 0;
  if (invoice.estimate_id) {
    const { data: estimate } = await admin
      .from("estimates")
      .select("deposit")
      .eq("id", invoice.estimate_id)
      .single();
    deposit = estimate?.deposit ?? 0;
  }

  const tenantName = tenant?.name ?? "";
  const total = invoice.total as number;
  const amountPaid = invoice.amount_paid as number;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{tenantName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="mt-1 text-gray-500 text-sm">{invoice.customer_name}</p>
        </div>

        {paid === "1" && invoice.status !== "paid" && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">Payment received ✓</p>
            <p className="text-xs text-gray-500 mt-1">Your payment is being processed.</p>
          </div>
        )}

        <div className="rounded border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
          </div>
          {amountPaid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid</span>
              <span className="font-semibold text-emerald-600">
                {amountPaid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4">
            <PaymentButtons
              invoiceId={id}
              total={total}
              amountPaid={amountPaid}
              deposit={deposit}
              status={invoice.status}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">Secured by Stripe</p>
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 6: Checkout API route

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/app/api/invoices/[id]/checkout/route.ts`

**Step 1: Add env vars to .env.local**

Add these lines to `.env.local` (get values from Stripe dashboard):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 2: Create the route**

```ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type } = await request.json() as { type: "deposit" | "full" };

  if (!["deposit", "full"].includes(type)) {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, customer_name, status, total, amount_paid, estimate_id, tenant_id")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  // Resolve deposit amount from linked estimate
  let depositAmount = 0;
  if (invoice.estimate_id) {
    const { data: estimate } = await admin
      .from("estimates")
      .select("deposit")
      .eq("id", invoice.estimate_id)
      .single();
    depositAmount = estimate?.deposit ?? 0;
  }

  const total = invoice.total as number;
  const amountPaid = invoice.amount_paid as number;
  const remaining = total - amountPaid;

  let amountCents: number;
  let label: string;

  if (type === "deposit" && depositAmount > 0 && amountPaid === 0) {
    amountCents = Math.round(depositAmount * 100);
    label = "Deposit";
  } else {
    amountCents = Math.round(remaining * 100);
    label = "Invoice Payment";
  }

  if (amountCents <= 0) {
    return NextResponse.json({ error: "Nothing to charge" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: label,
            description: `Invoice for ${invoice.customer_name}`,
          },
        },
      },
    ],
    metadata: {
      invoiceId: id,
      paymentType: type,
      depositAmount: String(depositAmount),
    },
    success_url: `${appUrl}/pay/${id}?paid=1`,
    cancel_url: `${appUrl}/pay/${id}`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 3: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 7: Stripe webhook handler

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/app/api/webhooks/stripe/route.ts`

**Step 1: Create the webhook route**

Important: Next.js App Router requires reading the raw body as text for Stripe signature verification.

```ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { invoiceId, paymentType, depositAmount } = session.metadata ?? {};

    if (!invoiceId) return NextResponse.json({ ok: true });

    const admin = createSupabaseAdminClient();

    const { data: invoice } = await admin
      .from("invoices")
      .select("total, amount_paid")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return NextResponse.json({ ok: true });

    const total = invoice.total as number;

    let newStatus: string;
    let newAmountPaid: number;

    if (paymentType === "deposit") {
      newAmountPaid = parseFloat(depositAmount ?? "0");
      newStatus = "partial";
    } else {
      newAmountPaid = total;
      newStatus = "paid";
    }

    await admin
      .from("invoices")
      .update({ status: newStatus, amount_paid: newAmountPaid })
      .eq("id", invoiceId);
  }

  return NextResponse.json({ ok: true });
}
```

**Step 2: Register webhook in Stripe dashboard**

- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/stripe`
- Select event: `checkout.session.completed`
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

For local testing use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Step 3: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 8: Final verification

**Step 1: Full build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, all routes present.

**Step 2: Run tests**

```bash
npm test
```
Expected: 46 passed, 4 pre-existing failures in asset-html.test.ts only.

**Step 3: Manual smoke test checklist**

End-to-end flow:
- [ ] Open an estimate's public link `/e/[id]`
- [ ] Sign the estimate — confirm redirect goes to `/pay/[invoiceId]` (not static "Accepted" screen)
- [ ] `/pay/[id]` shows customer name, total, Pay Deposit + Pay Full Amount buttons (if deposit > 0)
- [ ] Click Pay Full Amount → redirects to Stripe Checkout
- [ ] Complete payment with Stripe test card `4242 4242 4242 4242`
- [ ] Redirects back to `/pay/[id]?paid=1` with "Payment received" banner
- [ ] Stripe webhook fires → invoice status updates to `paid` in dashboard
- [ ] Invoice list shows `paid` chip
- [ ] Click Pay Deposit → Stripe charges only deposit amount
- [ ] After deposit webhook → invoice shows `partial` amber chip + remaining balance

Invoice list:
- [ ] `partial` status shows amber chip
- [ ] `partial` filter tab works

Reminder feature (previous task):
- [ ] Auto-created invoices have `customer_email` populated if estimate had one
- [ ] Send Reminder works on new invoices
