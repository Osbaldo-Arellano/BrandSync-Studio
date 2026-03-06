# Stripe Payment Flow — Design Doc
Date: 2026-03-05

## Goal
After a client signs an estimate, auto-create an invoice and redirect them to a Stripe Checkout payment page that supports deposit or full payment.

## Section 1: Sign route — auto-create invoice + redirect

Changes to `app/api/estimates/[id]/sign/route.ts`:
- After marking estimate `approved`, inline-create an invoice using admin client
- Invoice: `status = "sent"`, `customer_name`, `customer_email`, `total`, `estimate_id`, `tenant_id` copied from estimate
- Copy estimate_items to invoice_items
- Return `{ invoiceId }` instead of `{ ok: true }`

Changes to `app/e/[id]/SignaturePanel.tsx`:
- On success, receive `invoiceId` from response JSON
- `window.location.href = /pay/${invoiceId}` instead of `setDone(true)`

## Section 2: Invoice schema additions

Migration `20260305000002_invoices_partial_payment.sql`:
- Drop + recreate status check to include `"partial"`
- Add `amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0`

Type changes:
- `InvoiceStatus` in `types/invoices.ts`: add `"partial"`
- `InvoiceList.tsx` STATUS_STYLES: add amber chip for `"partial"`
- `InvoiceList.tsx` FILTER_TABS: add Partial tab

## Section 3: Public payment page `/pay/[id]`

New files:
- `app/pay/[id]/page.tsx` — server component, admin client, no auth
- `app/pay/[id]/PaymentButtons.tsx` — client component for button interactions

Page logic:
- Fetch invoice + tenant name (admin client)
- Fetch linked estimate for deposit amount (if `invoice.estimate_id` exists)
- If `status === "paid"`: show "Paid in full ✓" banner
- If `status === "partial"`: show remaining balance (`total - amount_paid`) + Pay Full Amount button
- If `amount_paid === 0` and deposit > 0: show Pay Deposit ($X) + Pay Full Amount ($Y) buttons
- Otherwise: single Pay Full Amount button
- `?paid=1` query param: show "Payment received ✓" banner on return from Stripe

`PaymentButtons` calls `POST /api/invoices/[id]/checkout` with `{ type: "deposit" | "full" }`, receives `{ url }`, does `window.location.href = url`.

## Section 4: Checkout API + Stripe webhook

New file: `app/api/invoices/[id]/checkout/route.ts`
- No auth (customer-facing public route)
- Validate invoice exists and status is not `"paid"`
- Compute amount: deposit from linked estimate if `type === "deposit"`, else `total - amount_paid`
- Create Stripe Checkout session: `mode: "payment"`, USD, `success_url: NEXT_PUBLIC_APP_URL/pay/[id]?paid=1`, `cancel_url: NEXT_PUBLIC_APP_URL/pay/[id]`
- Session metadata: `{ invoiceId, paymentType }`
- Return `{ url: session.url }`

New file: `app/api/webhooks/stripe/route.ts`
- Verify Stripe signature with `STRIPE_WEBHOOK_SECRET`
- On `checkout.session.completed`:
  - Read `metadata.invoiceId`, `metadata.paymentType`
  - `paymentType === "full"` → `status = "paid"`, `amount_paid = total`
  - `paymentType === "deposit"` → `status = "partial"`, `amount_paid = deposit`
  - Update via admin client

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

## Files Changed / Created

1. `supabase/migrations/20260305000002_invoices_partial_payment.sql` — new
2. `types/invoices.ts` — add "partial" to InvoiceStatus
3. `app/api/estimates/[id]/sign/route.ts` — auto-create invoice, return invoiceId
4. `app/e/[id]/SignaturePanel.tsx` — redirect to /pay/[invoiceId] on success
5. `components/invoices/InvoiceList.tsx` — partial status chip + filter tab
6. `app/pay/[id]/page.tsx` — new public payment page
7. `app/pay/[id]/PaymentButtons.tsx` — new client component
8. `app/api/invoices/[id]/checkout/route.ts` — new Stripe Checkout route
9. `app/api/webhooks/stripe/route.ts` — new Stripe webhook handler
