import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import type { TenantProfile } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: row }, { data: tenant }, { data: brand }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .eq("tenant_id", user.id)
      .single(),
    supabase.from("tenants").select(TENANT_FIELDS).eq("id", user.id).single(),
    supabase.from("brands").select("logo_url, icon_url").eq("user_id", user.id).single(),
  ]);

  if (!row) notFound();

  const tenantProfile: TenantProfile = {
    name:            tenant?.name ?? "",
    ccb_number:      tenant?.ccb_number ?? "",
    tagline:         tenant?.tagline ?? "",
    email:           tenant?.email ?? "",
    phone:           tenant?.phone ?? "",
    website:         tenant?.website ?? "",
    address_street:  tenant?.address_street ?? "",
    address_city:    tenant?.address_city ?? "",
    address_state:   tenant?.address_state ?? "",
    address_zip:     tenant?.address_zip ?? "",
    logo_url:        brand?.logo_url ?? null,
    icon_url:        brand?.icon_url ?? null,
  };

  const invoice = {
    id:               row.id as string,
    estimate_id:      (row.estimate_id as string | null) ?? null,
    customer_name:    (row.customer_name as string) ?? "",
    customer_address: (row.customer_address as string | null) ?? null,
    status:           row.status,
    total:            (row.total as number) ?? 0,
    created_at:       row.created_at as string,
    items: (row.invoice_items ?? []).map((item: Record<string, unknown>) => ({
      id:          item.id as string,
      invoice_id:  item.invoice_id as string,
      description: (item.description as string) ?? "",
      quantity:    (item.quantity as number) ?? 0,
      unit_price:  (item.unit_price as number) ?? 0,
    })),
  };

  return <InvoiceDetail invoice={invoice} tenant={tenantProfile} />;
}
