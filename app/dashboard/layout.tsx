import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTenantModules } from "@/lib/get-tenant-modules";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ModulesProvider } from "@/components/dashboard/ModulesProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [logoUrl, modules] = await Promise.all([
    user
      ? supabase
          .from("brands")
          .select("logo_url")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => data?.logo_url ?? null)
      : Promise.resolve(null),
    getTenantModules(),
  ]);

  return (
    <ModulesProvider modules={modules}>
      <DashboardSidebar logoUrl={logoUrl}>{children}</DashboardSidebar>
    </ModulesProvider>
  );
}
