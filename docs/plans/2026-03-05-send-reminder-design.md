# Send Reminder — Design Doc
Date: 2026-03-05

## Goal
Allow contractors to send a payment reminder email for sent/overdue invoices, auto-sending if customer email is known or prompting for one if not.

## Section 1: Data — customer_email on invoices

- Migration: add `customer_email TEXT` (nullable) column to `invoices` table
- Invoice creation (`POST /api/invoices`): copy `estimate.customer_email` into `customer_email` when creating the invoice
- `InvoiceList.tsx` local Invoice interface: add `customer_email: string | null`
- `app/dashboard/invoices/page.tsx` mapping: map `row.customer_email ?? null`

## Section 2: API — POST /api/invoices/[id]/remind

New auth-gated route at `app/api/invoices/[id]/remind/route.ts`.

Request body: `{ email?: string }` (optional — used when customer_email is not yet stored)

Logic:
1. Auth check
2. Fetch invoice — verify tenant owns it and status is `"sent"` or `"overdue"`
3. Resolve email: use `body.email` if provided, else `invoice.customer_email`
4. If no email → 400
5. Fetch tenant name from `tenants` table
6. Send via Resend (RESEND_API_KEY already in env, same `from` as estimates send route)
7. If `body.email` was provided and different from stored → update `invoices.customer_email`
8. Return `{ ok: true }`

Email template (HTML):
```
Hi {customer_name},

This is a friendly reminder that your invoice is past due.

Invoice total: {total formatted as USD}

Please contact us if you have any questions.

{tenant_name}
```
Subject: `Payment reminder from {tenant_name}`

## Section 3: UI — Send Reminder in InvoiceList

Button shown on rows/cards where `status === "sent" || status === "overdue"`.

Component state additions:
- `reminding: Record<string, boolean>` — per-row loading state
- `reminded: Record<string, boolean>` — per-row "Sent ✓" confirmation state
- `reminderOpen: Record<string, boolean>` — per-row email input panel open state
- `reminderEmail: Record<string, string>` — per-row email input value

**Email known** (`invoice.customer_email` set):
- Button: "Send Reminder" (outlined, gray)
- On click: call remind API directly, show "Sending…" → "Sent ✓" for 3s then reset

**Email unknown** (null):
- Button: "Send Reminder" (outlined, gray)
- On click: toggle open an inline email input panel below the row
- Panel has an email `<input>` and a "Send" button
- On send: call remind API with entered email, close panel, show "Sent ✓" for 3s

Both desktop table rows and mobile cards get the button + panel.
No modal — inline panel only.
