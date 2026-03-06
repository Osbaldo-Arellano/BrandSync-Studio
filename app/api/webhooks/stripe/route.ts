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
