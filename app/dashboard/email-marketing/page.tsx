import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { DashboardEmailMarketing } from "@/components/dashboard/DashboardEmailMarketing";

export default async function EmailMarketingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: signups } = await admin
    .from("waitlist_signups")
    .select("id, name, email, phone_number, role, created_at")
    .order("created_at", { ascending: false });

  return <DashboardEmailMarketing signups={signups ?? []} />;
}
