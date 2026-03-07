import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type } = (await request.json()) as { type: "deposit" | "full" };

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
  const amountPaid = (invoice.amount_paid as number) ?? 0;
  const remaining = total - amountPaid;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

  if (type === "deposit" && depositAmount > 0 && amountPaid === 0) {
    // Single deposit line item
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(depositAmount * 100),
          product_data: {
            name: "Deposit",
            description: `Invoice for ${invoice.customer_name}`,
          },
        },
      },
    ];
  } else if (invoice.status === "partial") {
    // Deposit already paid — charge remaining balance as single item
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(remaining * 100),
          product_data: {
            name: "Remaining Balance",
            description: `Invoice for ${invoice.customer_name}`,
          },
        },
      },
    ];
  } else {
    // Full payment — use actual invoice line items
    const { data: items } = await admin
      .from("invoice_items")
      .select("description, quantity, unit_price")
      .eq("invoice_id", id);

    if (items && items.length > 0) {
      // Use line total as unit_amount (quantity=1) to handle fractional quantities
      lineItems = items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(
            (item.quantity as number) * (item.unit_price as number) * 100
          ),
          product_data: {
            name: item.description || "Service",
          },
        },
      }));
    } else {
      // Fallback: single line item for the full amount
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(remaining * 100),
            product_data: {
              name: "Invoice Payment",
              description: `Invoice for ${invoice.customer_name}`,
            },
          },
        },
      ];
    }
  }

  let amountCents = lineItems.reduce(
    (sum, item) =>
      sum + ((item.price_data?.unit_amount as number) ?? 0) * ((item.quantity as number) ?? 1),
    0
  );

  // If itemized total is zero but invoice has a non-zero total, fall back to a single
  // lump-sum line item. This handles cases where unit_price is 0 on stored items.
  if (amountCents <= 0) {
    const fallbackCents = Math.round(
      (type === "deposit" && depositAmount > 0 ? depositAmount : remaining) * 100
    );
    if (fallbackCents <= 0) {
      return NextResponse.json({ error: "Nothing to charge" }, { status: 400 });
    }
    amountCents = fallbackCents;
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: fallbackCents,
          product_data: {
            name: type === "deposit" ? "Deposit" : "Invoice Payment",
            description: `Invoice for ${invoice.customer_name}`,
          },
        },
      },
    ];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
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
