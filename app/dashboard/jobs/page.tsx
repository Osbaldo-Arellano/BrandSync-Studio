import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { JobList } from "@/components/jobs/JobList";
import type { Job } from "@/types/jobs";

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: jobs }, { data: customers }] = await Promise.all([
    supabase
      .from("jobs")
      .select(`
        id, title, address, status, notes, created_at,
        customer:customers(id, name, phone, email, address),
        estimates(id, status, total),
        invoices(id, status, total, amount_paid)
      `)
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, name, phone, email, address")
      .eq("tenant_id", user.id)
      .order("name"),
  ]);

  return <JobList jobs={(jobs ?? []) as unknown as Job[]} customers={customers ?? []} />;
}
