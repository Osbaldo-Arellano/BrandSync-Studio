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
