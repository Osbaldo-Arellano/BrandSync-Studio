import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: estimates }, { data: invoices }, { data: tenant }] = await Promise.all([
    supabase
      .from("estimates")
      .select("id, estimate_number, customer_name, status, total, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, customer_name, status, total, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("name")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <DashboardHome
      estimates={estimates ?? []}
      invoices={invoices ?? []}
      tenantName={tenant?.name ?? ""}
    />
  );
}
