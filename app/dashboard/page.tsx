import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTenantModules } from "@/lib/get-tenant-modules";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardPrint } from "@/components/dashboard/DashboardPrint";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const modules = await getTenantModules();

  // Email-marketing-only tenant → go straight to that page
  if (modules.emailMarketing && !modules.jobs && !modules.invoices) {
    redirect("/dashboard/email-marketing");
  }

  // Print-only tenant
  if (modules.print && !modules.jobs && !modules.invoices && !modules.emailMarketing) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", user.id)
      .single();
    return <DashboardPrint tenantName={tenant?.name ?? ""} />;
  }

  // Full / field-service dashboard (default)
  const [{ data: estimates }, { data: invoices }, { data: jobs }, { data: tenant }] = await Promise.all([
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
      .from("jobs")
      .select("id, title, status, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("tenants").select("name").eq("id", user.id).single(),
  ]);

  return (
    <DashboardHome
      estimates={estimates ?? []}
      invoices={invoices ?? []}
      jobs={jobs ?? []}
      tenantName={tenant?.name ?? ""}
    />
  );
}
