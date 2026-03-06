import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { estimateHtml } from "@/lib/estimate-html";
import { generatePdf } from "@/lib/generate-pdf";
import { Resend } from "resend";
import type { Estimate } from "@/types/estimates";
import type { TenantProfile } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const { signatureDataUrl, signedByName } = await request.json();

  if (!signatureDataUrl || !signedByName?.trim()) {
    return NextResponse.json({ error: "Signature and name are required" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const admin = createSupabaseAdminClient();

  // Fetch estimate
  const { data: row, error: fetchError } = await admin
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }
  if (row.signed_at) {
    return NextResponse.json({ error: "Already signed" }, { status: 409 });
  }

  // Fetch items and tenant name
  const [{ data: items }, { data: tenantRow }, { data: brand }] = await Promise.all([
    admin.from("estimate_items").select("*").eq("estimate_id", id),
    admin.from("tenants").select(TENANT_FIELDS).eq("id", row.tenant_id).single(),
    admin.from("brands").select("logo_url, icon_url").eq("user_id", row.tenant_id).single(),
  ]);
  const tenantProfile: TenantProfile = {
    name: tenantRow?.name ?? "",
    ccb_number: tenantRow?.ccb_number ?? "",
    tagline: tenantRow?.tagline ?? "",
    email: tenantRow?.email ?? "",
    phone: tenantRow?.phone ?? "",
    website: tenantRow?.website ?? "",
    address_street: tenantRow?.address_street ?? "",
    address_city: tenantRow?.address_city ?? "",
    address_state: tenantRow?.address_state ?? "",
    address_zip: tenantRow?.address_zip ?? "",
    logo_url: brand?.logo_url ?? null,
    icon_url: brand?.icon_url ?? null,
  };

  // Upload signature to Supabase Storage
  await admin.storage.createBucket("signatures", { public: true }).catch(() => {});

  const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const sigBuffer = Buffer.from(base64Data, "base64");
  const fileName = `${id}.png`;

  const { error: uploadError } = await admin.storage
    .from("signatures")
    .upload(fileName, sigBuffer, { contentType: "image/png", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `Signature upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("signatures").getPublicUrl(fileName);

  const signedAt = new Date().toISOString();

  // Update estimate
  const { error: updateError } = await admin
    .from("estimates")
    .update({
      signature_url: publicUrl,
      signed_at: signedAt,
      signed_by_name: signedByName.trim(),
      signed_ip: ip,
      status: "approved",
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

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

  // Build Estimate object for PDF
  const estimate: Estimate = {
    id: row.id,
    estimate_number: row.estimate_number ?? 0,
    customer_id: row.customer_id ?? null,
    customerName: row.customer_name ?? "",
    customerAddress: row.customer_address ?? "",
    customer_email: row.customer_email ?? null,
    customer_phone: row.customer_phone ?? null,
    salesperson: row.salesperson ?? "",
    job: row.job ?? "",
    payment_terms: row.payment_terms ?? "",
    due_date: row.due_date ?? "",
    status: "approved",
    cash_note: row.cash_note ?? "",
    notes: row.notes ?? "",
    deposit: row.deposit ?? 0,
    total: row.total ?? 0,
    created_at: row.created_at,
    sent_at: row.sent_at ?? null,
    signature_url: publicUrl,
    signed_at: signedAt,
    signed_by_name: signedByName.trim(),
    signed_ip: ip,
    items: (items ?? []).map((item) => ({
      id: item.id,
      estimate_id: item.estimate_id,
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      line_total: item.line_total ?? 0,
    })),
  };

  // Generate PDF
  const html = estimateHtml(estimate, signatureDataUrl, tenantProfile);
  const pdfBuffer = await generatePdf(html);

  // Send confirmation emails
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipients = ["o.arellano.dev@gmail.com"];
  if (estimate.customer_email) recipients.push(estimate.customer_email);

  const signedDate = new Date(signedAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: recipients,
    subject: `Estimate Signed — ${estimate.customerName}`,
    html: `
      <p>The estimate${estimate.job ? ` for <strong>${estimate.job}</strong>` : ""} has been electronically signed.</p>
      <ul>
        <li><strong>Signed by:</strong> ${signedByName.trim()}</li>
        <li><strong>Date:</strong> ${signedDate}</li>
        <li><strong>Customer:</strong> ${estimate.customerName}</li>
      </ul>
      <p>The signed estimate PDF is attached.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">${tenantProfile.name}</p>
    `,
    attachments: [
      {
        filename: `estimate-${id.slice(0, 8)}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  return NextResponse.json({ ok: true, invoiceId });
  } catch (error) {
    console.error("sign route error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
