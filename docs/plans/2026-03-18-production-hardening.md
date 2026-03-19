# Production Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden all API routes, fix data integrity gaps, add input validation, and achieve comprehensive unit test coverage before client delivery.

**Architecture:** Shared `lib/validation.ts` owns all reusable validators (email, line items, status machine). Every API route imports from there. Tests use Vitest with vi.mock() for Supabase — handlers are called directly as async functions with fake Request objects.

**Tech Stack:** Next.js 16 App Router, Supabase, Vitest, TypeScript

---

### Task 1: Shared validation library

**Files:**
- Create: `lib/validation.ts`

**Implementation:**

```ts
// lib/validation.ts

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// Invoice status state machine — terminal states have empty arrays
export const INVOICE_TRANSITIONS: Record<string, string[]> = {
  draft:    ["sent", "void"],
  sent:     ["paid", "overdue", "partial", "cash", "cashapp", "deferred", "void"],
  partial:  ["sent", "paid", "overdue", "void"],
  overdue:  ["paid", "void"],
  cash:     ["paid"],
  cashapp:  ["paid"],
  deferred: ["sent", "paid", "overdue"],
  paid:     [],
  void:     [],
};

export const PAYABLE_STATUSES = new Set(["draft", "sent", "partial", "overdue", "deferred"]);

export interface LineItem {
  description?: unknown;
  quantity?: unknown;
  unit_price?: unknown;
  line_total?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateLineItems(items: unknown[]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: "items", message: "At least one line item is required" });
    return errors;
  }
  if (items.length > 100) {
    errors.push({ field: "items", message: "Maximum 100 line items allowed" });
    return errors;
  }
  items.forEach((raw, idx) => {
    const item = raw as LineItem;
    const label = `Item ${idx + 1}`;
    const desc = String(item.description ?? "").trim();
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);

    if (!desc) errors.push({ field: `items[${idx}].description`, message: `${label}: description is required` });
    else if (desc.length > 500) errors.push({ field: `items[${idx}].description`, message: `${label}: description must be ≤ 500 characters` });
    if (!Number.isFinite(qty) || qty <= 0) errors.push({ field: `items[${idx}].quantity`, message: `${label}: quantity must be greater than 0` });
    if (!Number.isFinite(price) || price < 0) errors.push({ field: `items[${idx}].unit_price`, message: `${label}: unit price cannot be negative` });
  });
  return errors;
}
```

---

### Task 2: Validation tests

**Files:**
- Create: `lib/validation.test.ts`

**Implementation:**

```ts
import { describe, it, expect } from "vitest";
import {
  isValidEmail, validateLineItems, INVOICE_TRANSITIONS, PAYABLE_STATUSES,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a+b@sub.domain.io")).toBe(true);
  });
  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@nodomain")).toBe(false);
    expect(isValidEmail("noatsign.com")).toBe(false);
  });
});

describe("validateLineItems", () => {
  const valid = [{ description: "Labor", quantity: 2, unit_price: 50, line_total: 100 }];

  it("passes valid items", () => {
    expect(validateLineItems(valid)).toHaveLength(0);
  });
  it("rejects empty array", () => {
    const errs = validateLineItems([]);
    expect(errs[0].field).toBe("items");
  });
  it("rejects more than 100 items", () => {
    const many = Array(101).fill(valid[0]);
    expect(validateLineItems(many)[0].field).toBe("items");
  });
  it("rejects missing description", () => {
    const errs = validateLineItems([{ description: "", quantity: 1, unit_price: 10 }]);
    expect(errs.some(e => e.field.includes("description"))).toBe(true);
  });
  it("rejects description over 500 chars", () => {
    const errs = validateLineItems([{ description: "x".repeat(501), quantity: 1, unit_price: 10 }]);
    expect(errs.some(e => e.field.includes("description"))).toBe(true);
  });
  it("rejects zero quantity", () => {
    const errs = validateLineItems([{ description: "x", quantity: 0, unit_price: 10 }]);
    expect(errs.some(e => e.field.includes("quantity"))).toBe(true);
  });
  it("rejects negative quantity", () => {
    const errs = validateLineItems([{ description: "x", quantity: -1, unit_price: 10 }]);
    expect(errs.some(e => e.field.includes("quantity"))).toBe(true);
  });
  it("rejects negative unit price", () => {
    const errs = validateLineItems([{ description: "x", quantity: 1, unit_price: -0.01 }]);
    expect(errs.some(e => e.field.includes("unit_price"))).toBe(true);
  });
  it("allows zero unit price (free item)", () => {
    expect(validateLineItems([{ description: "Freebie", quantity: 1, unit_price: 0 }])).toHaveLength(0);
  });
});

describe("INVOICE_TRANSITIONS", () => {
  it("draft can go to sent or void", () => {
    expect(INVOICE_TRANSITIONS.draft).toContain("sent");
    expect(INVOICE_TRANSITIONS.draft).toContain("void");
    expect(INVOICE_TRANSITIONS.draft).not.toContain("paid");
  });
  it("paid is terminal", () => {
    expect(INVOICE_TRANSITIONS.paid).toHaveLength(0);
  });
  it("void is terminal", () => {
    expect(INVOICE_TRANSITIONS.void).toHaveLength(0);
  });
  it("sent can reach paid, overdue, partial, cash, cashapp, deferred, void", () => {
    const allowed = INVOICE_TRANSITIONS.sent;
    ["paid","overdue","partial","cash","cashapp","deferred","void"].forEach(s =>
      expect(allowed).toContain(s)
    );
  });
});

describe("PAYABLE_STATUSES", () => {
  it("includes sent, draft, partial, overdue, deferred", () => {
    ["sent","draft","partial","overdue","deferred"].forEach(s =>
      expect(PAYABLE_STATUSES.has(s)).toBe(true)
    );
  });
  it("excludes paid and void", () => {
    expect(PAYABLE_STATUSES.has("paid")).toBe(false);
    expect(PAYABLE_STATUSES.has("void")).toBe(false);
  });
});
```

---

### Task 3: Invoice PATCH — status state machine

**Files:**
- Modify: `app/api/invoices/[id]/route.ts`

Replace the `allowed` whitelist check with a state machine lookup:

```ts
// After: const { status, delivery_method } = await request.json();

// Fetch current status
const { data: current } = await supabase
  .from("invoices")
  .select("status, total, amount_paid")
  .eq("id", id)
  .eq("tenant_id", user.id)
  .single();

if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

const { INVOICE_TRANSITIONS } = await import("@/lib/validation");
const validNext = INVOICE_TRANSITIONS[current.status as string] ?? [];
if (!validNext.includes(status)) {
  return NextResponse.json(
    { error: `Cannot transition invoice from '${current.status}' to '${status}'` },
    { status: 400 }
  );
}
```

Remove the old `allowed` array and `if (!allowed.includes(status))` check.
Also remove the separate `select("total, amount_paid")` fetch that was added for the paid-status sync — fold it into the single fetch above.

---

### Task 4: Invoice PATCH tests

**Files:**
- Create: `app/api/invoices/[id]/route.test.ts`

Test the PATCH handler with mocked Supabase. Key cases: valid transition, invalid transition, terminal state, mark-paid syncs amount_paid.

---

### Task 5: Line item validation — invoices POST

**Files:**
- Modify: `app/api/invoices/route.ts`

In the standalone invoice creation path (after `const { ..., standaloneItems, ... } = body`), add:

```ts
const { validateLineItems } = await import("@/lib/validation");
const itemErrors = validateLineItems(standaloneItems ?? []);
if (itemErrors.length > 0) {
  return NextResponse.json({ error: itemErrors[0].message, errors: itemErrors }, { status: 400 });
}
```

---

### Task 6: Line item validation — estimates POST and PUT

**Files:**
- Modify: `app/api/estimates/route.ts` (POST)
- Modify: `app/api/estimates/[id]/route.ts` (PUT)

Same pattern as Task 5. In POST, validate `items` before insert. In PUT, validate `items` before delete+reinsert.

---

### Task 7: Email validation — invoice send + estimate send

**Files:**
- Modify: `app/api/invoices/[id]/send/route.ts`
- Modify: `app/api/estimates/[id]/send/route.ts`

After the `!customerEmail?.trim()` check, add:

```ts
const { isValidEmail } = await import("@/lib/validation");
if (!isValidEmail(customerEmail)) {
  return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
}
```

---

### Task 8: Customer deduplication

**Files:**
- Modify: `app/api/customers/route.ts` (POST)

After name validation, before insert:

```ts
// Check for existing customer with same name (case-insensitive) for this tenant
const { data: existing } = await supabase
  .from("customers")
  .select("id, name, phone, email, address, created_at")
  .eq("tenant_id", user.id)
  .ilike("name", name.trim())
  .maybeSingle();

if (existing) {
  return NextResponse.json({ ...existing, _existing: true }, { status: 200 });
}
```

Return 200 with the existing record so the UI can handle it gracefully.

---

### Task 9: Fix sign route — surface invoice creation failure

**Files:**
- Modify: `app/api/estimates/[id]/sign/route.ts`

Remove the silent `try/catch` around invoice creation. Instead propagate the error so the API returns a descriptive failure. The estimate should still be marked signed/approved — invoice creation failure is non-fatal but must be reported:

```ts
// Replace the entire try/catch invoice block with:
let invoiceId: string | null = null;
const { data: newInvoice, error: invErr } = await admin
  .from("invoices")
  .insert({ /* same fields + job_id */ })
  .select("id")
  .single();

if (invErr || !newInvoice) {
  console.error("[sign] Auto-invoice creation failed:", invErr?.message);
  // Still return ok — estimate IS signed. But flag the failure.
  return NextResponse.json({
    ok: true,
    invoiceId: null,
    warning: "Estimate signed successfully, but invoice could not be created automatically. Please create it manually.",
  });
}
invoiceId = newInvoice.id;
// ... insert items, mark estimate invoiced ...
```

---

### Task 10: PDF error handling

**Files:**
- Modify: `app/api/invoices/[id]/pdf/route.ts`
- Modify: `app/api/estimates/[id]/pdf/route.ts`

Wrap `generatePdf` in try/catch in both files:

```ts
let pdf: Buffer;
try {
  pdf = await generatePdf(html);
} catch (err) {
  console.error("[pdf] Generation failed:", (err as Error).message);
  return new Response("PDF generation failed. Please try again.", { status: 500 });
}
```

---

### Task 11: Pay page status guard

**Files:**
- Modify: `app/pay/[id]/page.tsx`

After `if (!invoice) notFound();`, add:

```ts
const { PAYABLE_STATUSES } = await import("@/lib/validation");
if (!PAYABLE_STATUSES.has(invoice.status as string)) {
  // Show a "already paid / unavailable" page instead of the payment form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-2xl">✓</p>
        <h1 className="text-xl font-bold text-gray-900">Invoice Unavailable</h1>
        <p className="text-sm text-gray-500">
          {invoice.status === "paid" || invoice.status === "cash" || invoice.status === "cashapp"
            ? "This invoice has already been paid. Thank you!"
            : "This invoice is no longer available for payment."}
        </p>
      </div>
    </div>
  );
}
```

---

### Task 12: Fix `as any` in job pages

**Files:**
- Modify: `app/dashboard/jobs/page.tsx`
- Modify: `app/dashboard/jobs/[id]/page.tsx`

Import `Job` from `@/types/jobs` and cast the Supabase result properly:

```ts
import type { Job } from "@/types/jobs";
// ...
return <JobList jobs={(jobs ?? []) as Job[]} customers={customers ?? []} />;
```

```ts
import type { Job } from "@/types/jobs";
// ...
return <JobDetail job={job as Job} customers={customers ?? []} />;
```

---

### Task 13: Order route — env var for hardcoded email

**Files:**
- Modify: `app/api/order/route.ts`

```ts
// Replace:
const ORDER_EMAIL = "o.arellano.dev@gmail.com";
// With:
const ORDER_EMAIL = process.env.ORDER_EMAIL ?? process.env.SMTP_USER ?? "";
if (!ORDER_EMAIL) {
  console.error("[order] ORDER_EMAIL env var not set");
  return new Response("Order service not configured", { status: 503 });
}
```

---

### Task 14: Migration — estimate number auto-assignment

**Files:**
- Create: `supabase/migrations/20260318000006_estimate_number_trigger.sql`

```sql
-- Auto-assign per-tenant sequential estimate numbers

CREATE OR REPLACE FUNCTION assign_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = 0 THEN
    SELECT COALESCE(MAX(estimate_number), 0) + 1
      INTO NEW.estimate_number
      FROM estimates
     WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estimates_assign_number ON estimates;
CREATE TRIGGER estimates_assign_number
  BEFORE INSERT ON estimates
  FOR EACH ROW EXECUTE FUNCTION assign_estimate_number();
```

---

### Task 15: Migration — deposit column on invoices

**Files:**
- Create: `supabase/migrations/20260318000007_invoice_deposit.sql`

```sql
-- Copy deposit from estimate to invoice at creation time
-- so pay page never needs to join estimates to get deposit amount

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Backfill existing invoices from their linked estimates
UPDATE invoices i
   SET deposit = e.deposit
  FROM estimates e
 WHERE i.estimate_id = e.id
   AND i.deposit = 0
   AND e.deposit > 0;
```

Then update `app/api/estimates/[id]/sign/route.ts` and `app/api/invoices/route.ts` to include `deposit: row.deposit ?? 0` in invoice inserts, and update `app/pay/[id]/page.tsx` to read `invoice.deposit` directly instead of joining estimates.

---

### Task 16: API route tests

**Files:**
- Create: `app/api/invoices/[id]/route.test.ts`
- Create: `app/api/invoices/route.test.ts`
- Create: `app/api/estimates/route.test.ts`
- Create: `app/api/estimates/[id]/route.test.ts`
- Create: `app/api/estimates/[id]/sign/route.test.ts`
- Create: `app/api/customers/route.test.ts`
- Create: `app/api/pay/[id]/route.test.ts`

**Testing pattern for route handlers:**

```ts
// Each test file mocks Supabase and calls the handler directly
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock before importing the route
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { PATCH } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function makeRequest(body: unknown, method = "PATCH") {
  return new Request("http://localhost/api/invoices/test-id", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id = "test-id") {
  return { params: Promise.resolve({ id }) };
}
```

---

### Verification

After all tasks, run:
```bash
npm run build   # must pass with zero errors
npm test        # all tests green
```
