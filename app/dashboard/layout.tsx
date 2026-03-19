import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let logoUrl: string | null = null;
  if (user) {
    const { data: brand } = await supabase
      .from("brands")
      .select("logo_url")
      .eq("user_id", user.id)
      .single();
    logoUrl = brand?.logo_url ?? null;
  }

  return <DashboardSidebar logoUrl={logoUrl}>{children}</DashboardSidebar>;
}
