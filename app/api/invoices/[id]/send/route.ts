import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createTransport, FROM } from "@/lib/mailer";

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

  const { isValidEmail } = await import("@/lib/validation");
  if (!isValidEmail(customerEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
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

  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to: customerEmail.trim(),
    subject: `Invoice ${invoiceNum} from ${tenant?.name ?? ""}`,
    html: `
      <p>Hi ${invoice.customer_name},</p>
      <p>Please find your invoice <strong>${invoiceNum}</strong> for <strong>${(invoice.total as number).toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong>.</p>
      <p><a href="${paymentLink}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none;font-weight:600;">View &amp; Pay Invoice</a></p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">${tenant?.name ?? ""}</p>
    `,
  });

  // Save the customer email on the invoice and mark as sent
  await supabase
    .from("invoices")
    .update({ customer_email: customerEmail.trim(), status: "sent", delivery_method: "email" })
    .eq("id", id)
    .eq("tenant_id", user.id);

  return NextResponse.json({ ok: true });
}
