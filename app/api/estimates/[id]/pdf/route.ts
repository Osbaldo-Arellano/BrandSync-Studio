import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { estimateHtml } from "@/lib/estimate-html";
import { generatePdf } from "@/lib/generate-pdf";
import type { Estimate } from "@/types/estimates";
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
  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!row) return new Response("Not found", { status: 404 });

  const [{ data: tenant }, { data: brand }] = await Promise.all([
    admin.from("tenants").select(TENANT_FIELDS).eq("id", user.id).single(),
    admin.from("brands").select("logo_url, icon_url").eq("user_id", user.id).single(),
  ]);
  const tenantProfile: TenantProfile = {
    name: tenant?.name ?? "",
    ccb_number: tenant?.ccb_number ?? "",
    tagline: tenant?.tagline ?? "",
    email: tenant?.email ?? "",
    phone: tenant?.phone ?? "",
    website: tenant?.website ?? "",
    address_street: tenant?.address_street ?? "",
    address_city: tenant?.address_city ?? "",
    address_state: tenant?.address_state ?? "",
    address_zip: tenant?.address_zip ?? "",
    logo_url: brand?.logo_url ?? null,
    icon_url: brand?.icon_url ?? null,
  };

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
    status: row.status,
    cash_note: row.cash_note ?? "",
    notes: row.notes ?? "",
    deposit: row.deposit ?? 0,
    total: row.total ?? 0,
    created_at: row.created_at,
    sent_at: row.sent_at ?? null,
    signature_url: row.signature_url ?? null,
    signed_at: row.signed_at ?? null,
    signed_by_name: row.signed_by_name ?? null,
    signed_ip: row.signed_ip ?? null,
    items: (row.estimate_items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      estimate_id: item.estimate_id as string,
      description: (item.description as string) ?? "",
      quantity: (item.quantity as number) ?? 0,
      unit_price: (item.unit_price as number) ?? 0,
      line_total: (item.line_total as number) ?? 0,
    })),
  };

  const html = estimateHtml(estimate, estimate.signature_url ?? undefined, tenantProfile);
  const pdf = await generatePdf(html);
  const filename = `estimate-${id.slice(0, 8)}.pdf`;

  return new Response(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
