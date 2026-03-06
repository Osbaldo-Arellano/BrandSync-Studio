# Send Reminder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Send Reminder" button to sent/overdue invoices that emails the customer via Resend, auto-sending if their email is stored or prompting for it if not.

**Architecture:** Four tasks in sequence — migration adds the column, invoice creation copies the email, a new API route sends via Resend, and the InvoiceList UI renders the button with inline email capture. Resend is already configured in this project (used by the estimate send route).

**Tech Stack:** Next.js 16 App Router, Supabase, Resend (`resend` npm package), TypeScript, Tailwind CSS v4

---

## Task 1: Migration — add customer_email to invoices

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/supabase/migrations/20260305000001_add_customer_email_to_invoices.sql`

**Step 1: Write the migration file**

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
```

**Step 2: Verify file contents by reading it back**

Read the file and confirm the SQL is correct.

**Step 3: Apply in Supabase**

Run in the Supabase SQL editor. Verify with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'customer_email';
```
Expected: one row returned.

---

## Task 2: Copy customer_email during invoice creation + wire types

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/app/api/invoices/route.ts`
- Modify: `D:/BrandSyncDashboard/brandsync/app/dashboard/invoices/page.tsx`
- Modify: `D:/BrandSyncDashboard/brandsync/components/invoices/InvoiceList.tsx`

Read each file before editing.

**Step 1: Add customer_email to invoice INSERT**

In `app/api/invoices/route.ts`, the invoice insert currently is:
```ts
.insert({
  tenant_id: user.id,
  estimate_id: estimateId,
  customer_name: estimate.customer_name ?? "",
  status: "draft",
  total: estimate.total ?? 0,
})
```

Add `customer_email` to it:
```ts
.insert({
  tenant_id: user.id,
  estimate_id: estimateId,
  customer_name: estimate.customer_name ?? "",
  customer_email: estimate.customer_email ?? null,
  status: "draft",
  total: estimate.total ?? 0,
})
```

Also update the estimate select to include `customer_email`:
```ts
.select("*, estimate_items(*)")
```
(It already selects `*` so this is already covered — no change needed to the select.)

**Step 2: Add customer_email to page mapping**

In `app/dashboard/invoices/page.tsx`, the mapping currently is:
```ts
const invoices = (rows ?? []).map((row) => ({
  id: row.id as string,
  estimate_id: (row.estimate_id as string | null) ?? null,
  customer_name: (row.customer_name as string) ?? "",
  status: row.status as InvoiceStatus,
  total: (row.total as number) ?? 0,
  created_at: row.created_at as string,
  items: ...
}));
```

Add `customer_email` after `customer_name`:
```ts
customer_email: (row.customer_email as string | null) ?? null,
```

**Step 3: Add customer_email to InvoiceList local Invoice interface**

In `components/invoices/InvoiceList.tsx`, the local `Invoice` interface currently is:
```ts
interface Invoice {
  id: string;
  estimate_id: string | null;
  customer_name: string;
  status: InvoiceStatus;
  total: number;
  created_at: string;
  items: InvoiceItem[];
}
```

Add `customer_email: string | null;` after `customer_name`:
```ts
interface Invoice {
  id: string;
  estimate_id: string | null;
  customer_name: string;
  customer_email: string | null;
  status: InvoiceStatus;
  total: number;
  created_at: string;
  items: InvoiceItem[];
}
```

**Step 4: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 3: Remind API route

**Files:**
- Create: `D:/BrandSyncDashboard/brandsync/app/api/invoices/[id]/remind/route.ts`

**Step 1: Create the route file**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const providedEmail: string | null = body.email?.trim() || null;

  const admin = createSupabaseAdminClient();

  const { data: invoice, error: invErr } = await admin
    .from("invoices")
    .select("customer_name, customer_email, status, total, tenant_id")
    .eq("id", id)
    .single();

  if (invErr || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.tenant_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["sent", "overdue"].includes(invoice.status)) {
    return NextResponse.json({ error: "Reminders only available for sent or overdue invoices" }, { status: 400 });
  }

  const email = providedEmail ?? invoice.customer_email;
  if (!email) return NextResponse.json({ error: "No customer email on file. Please provide one." }, { status: 400 });

  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", user.id)
    .single();
  const tenantName = tenant?.name ?? "";

  const totalFormatted = (invoice.total as number).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [email],
      subject: `Payment reminder from ${tenantName}`,
      html: `
        <p>Hi ${invoice.customer_name},</p>
        <p>This is a friendly reminder that your invoice is past due.</p>
        <p><strong>Invoice total: ${totalFormatted}</strong></p>
        <p>Please contact us if you have any questions.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">${tenantName}</p>
      `,
    });
  } catch (err) {
    return NextResponse.json({ error: `Email failed: ${(err as Error).message}` }, { status: 500 });
  }

  // Persist email if newly provided
  if (providedEmail && providedEmail !== invoice.customer_email) {
    await admin
      .from("invoices")
      .update({ customer_email: providedEmail })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

---

## Task 4: Send Reminder UI in InvoiceList

**Files:**
- Modify: `D:/BrandSyncDashboard/brandsync/components/invoices/InvoiceList.tsx`

Read the full file first to understand current structure and line numbers.

**Step 1: Add state variables**

Inside the `InvoiceList` component, add these four state vars alongside the existing ones:

```ts
const [reminding, setReminding]       = useState<Record<string, boolean>>({});
const [reminded, setReminded]         = useState<Record<string, boolean>>({});
const [reminderOpen, setReminderOpen] = useState<Record<string, boolean>>({});
const [reminderEmail, setReminderEmail] = useState<Record<string, string>>({});
```

**Step 2: Add sendReminder handler**

Add this async function inside the component before the `return`:

```ts
async function sendReminder(invoiceId: string, emailOverride?: string) {
  setReminding(prev => ({ ...prev, [invoiceId]: true }));
  setReminderOpen(prev => ({ ...prev, [invoiceId]: false }));
  try {
    const res = await fetch(`/api/invoices/${invoiceId}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOverride ?? "" }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert(error ?? "Failed to send reminder");
      return;
    }
    // Persist email locally so button won't prompt again
    if (emailOverride) {
      setInvoices(prev =>
        prev.map(inv => inv.id === invoiceId ? { ...inv, customer_email: emailOverride } : inv)
      );
    }
    setReminded(prev => ({ ...prev, [invoiceId]: true }));
    setTimeout(() => setReminded(prev => ({ ...prev, [invoiceId]: false })), 3000);
  } finally {
    setReminding(prev => ({ ...prev, [invoiceId]: false }));
  }
}
```

**Step 3: Add ReminderButton helper component**

Add this component before the `InvoiceList` function (after `StatusBadge`):

```tsx
function ReminderButton({
  inv,
  reminding,
  reminded,
  reminderOpen,
  reminderEmail,
  onSend,
  onToggleOpen,
  onEmailChange,
}: {
  inv: { id: string; customer_email: string | null; status: string };
  reminding: Record<string, boolean>;
  reminded: Record<string, boolean>;
  reminderOpen: Record<string, boolean>;
  reminderEmail: Record<string, string>;
  onSend: (id: string, email?: string) => void;
  onToggleOpen: (id: string) => void;
  onEmailChange: (id: string, val: string) => void;
}) {
  if (!["sent", "overdue"].includes(inv.status)) return null;

  const isLoading = reminding[inv.id];
  const isDone    = reminded[inv.id];
  const isOpen    = reminderOpen[inv.id];
  const emailVal  = reminderEmail[inv.id] ?? "";
  const hasEmail  = !!inv.customer_email;

  return (
    <div>
      {isDone ? (
        <span className="text-xs text-emerald-600 font-medium">Sent ✓</span>
      ) : (
        <button
          onClick={() => hasEmail ? onSend(inv.id) : onToggleOpen(inv.id)}
          disabled={isLoading}
          className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isLoading ? "Sending…" : "Send Reminder"}
        </button>
      )}
      {isOpen && !hasEmail && (
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="email"
            value={emailVal}
            onChange={e => onEmailChange(inv.id, e.target.value)}
            placeholder="Customer email"
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none w-44"
          />
          <button
            onClick={() => onSend(inv.id, emailVal)}
            disabled={!emailVal.trim()}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Wire ReminderButton into the desktop table Actions cell**

In the desktop table, find the actions `<td>` that renders the status action buttons (Mark Sent, Mark Paid, Paid ✓). Add `<ReminderButton>` inside the actions `<div className="flex gap-2">`, after the existing buttons:

```tsx
<ReminderButton
  inv={inv}
  reminding={reminding}
  reminded={reminded}
  reminderOpen={reminderOpen}
  reminderEmail={reminderEmail}
  onSend={sendReminder}
  onToggleOpen={(id) => setReminderOpen(prev => ({ ...prev, [id]: !prev[id] }))}
  onEmailChange={(id, val) => setReminderEmail(prev => ({ ...prev, [id]: val }))}
/>
```

**Step 5: Wire ReminderButton into mobile cards**

In the mobile cards section, find the `<div className="flex items-center justify-between">` that wraps the status action buttons and total amount. Add `<ReminderButton>` inside the left-side button group `<div className="flex gap-2">`:

```tsx
<ReminderButton
  inv={inv}
  reminding={reminding}
  reminded={reminded}
  reminderOpen={reminderOpen}
  reminderEmail={reminderEmail}
  onSend={sendReminder}
  onToggleOpen={(id) => setReminderOpen(prev => ({ ...prev, [id]: !prev[id] }))}
  onEmailChange={(id, val) => setReminderEmail(prev => ({ ...prev, [id]: val }))}
/>
```

**Step 6: Verify build**

```bash
cd D:/BrandSyncDashboard/brandsync && npm run build
```
Expected: clean build, no TypeScript errors.

**Step 7: Manual smoke test**

1. Run `npm run dev`
2. Navigate to `/dashboard/invoices`
3. Find a `sent` or `overdue` invoice with a customer email — confirm "Send Reminder" button appears
4. Click it — confirm "Sending…" then "Sent ✓" for ~3 seconds
5. Find an invoice without a customer email — click "Send Reminder" — confirm email input appears
6. Enter an email and click Send — confirm "Sent ✓" and the email is now shown on the invoice
7. Find a `draft` or `paid` invoice — confirm no "Send Reminder" button
