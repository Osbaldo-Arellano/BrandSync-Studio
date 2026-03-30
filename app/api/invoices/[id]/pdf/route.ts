import { createSupabaseServerClient } from "@/lib/supabase-server";
import { invoiceHtml } from "@/lib/invoice-html";
import { generatePdf } from "@/lib/generate-pdf";
import type { TenantProfile } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const [{ data: row }, { data: tenant }, { data: brand }] = await Promise.all([
    supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).eq("tenant_id", user.id).single(),
    supabase.from("tenants").select(TENANT_FIELDS).eq("id", user.id).single(),
    supabase.from("brands").select("logo_url, icon_url").eq("user_id", user.id).single(),
  ]);

  if (!row) return new Response("Not found", { status: 404 });

  const tenantProfile: TenantProfile = {
    name:           tenant?.name ?? "",
    ccb_number:     tenant?.ccb_number ?? "",
    tagline:        tenant?.tagline ?? "",
    email:          tenant?.email ?? "",
    phone:          tenant?.phone ?? "",
    website:        tenant?.website ?? "",
    address_street: tenant?.address_street ?? "",
    address_city:   tenant?.address_city ?? "",
    address_state:  tenant?.address_state ?? "",
    address_zip:    tenant?.address_zip ?? "",
    logo_url:       brand?.logo_url ?? null,
    icon_url:       brand?.icon_url ?? null,
  };

  const invoice = {
    id:               row.id as string,
    invoice_number:   (row.invoice_number as number) ?? undefined,
    customer_name:    (row.customer_name as string) ?? "",
    customer_address: (row.customer_address as string | null) ?? null,
    customer_phone:   (row.customer_phone as string | null) ?? null,
    delivery_method:  (row.delivery_method as string | null) ?? null,
    payment_terms:    (row.payment_terms as string | null) ?? null,
    status:           row.status as string,
    total:            (row.total as number) ?? 0,
    amount_paid:      (row.amount_paid as number) ?? 0,
    discount_amount:  (row.discount_amount as number) ?? 0,
    tax_rate:         (row.tax_rate as number) ?? 0,
    tax_amount:       (row.tax_amount as number) ?? 0,
    due_date:         (row.due_date as string | null) ?? null,
    notes:            (row.notes as string) ?? "",
    created_at:       row.created_at as string,
    items: (row.invoice_items ?? []).map((item: Record<string, unknown>) => ({
      description: (item.description as string) ?? "",
      quantity:    (item.quantity as number) ?? 0,
      unit_price:  (item.unit_price as number) ?? 0,
      line_total:  (item.line_total as number) ?? 0,
    })),
  };

  const html = invoiceHtml(invoice, tenantProfile);
  let pdf: Awaited<ReturnType<typeof generatePdf>>;
  try {
    pdf = await generatePdf(html);
  } catch (err) {
    console.error("[invoice-pdf] Generation failed:", (err as Error).message);
    return new Response("PDF generation failed. Please try again.", { status: 500 });
  }
  const invoiceNum = invoice.invoice_number
    ? `INV-${String(invoice.invoice_number).padStart(4, "0")}`
    : `INV-${id.slice(0, 8).toUpperCase()}`;

  return new Response(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNum}.pdf"`,
    },
  });
}
