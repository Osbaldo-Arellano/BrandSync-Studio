import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { JobDetail } from "@/components/jobs/JobDetail";
import type { Job } from "@/types/jobs";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: job }, { data: customers }] = await Promise.all([
    supabase
      .from("jobs")
      .select(`
        id, title, address, status, notes, created_at,
        customer:customers(id, name, phone, email, address),
        estimates(id, estimate_number, customer_name, status, total, created_at),
        invoices(id, invoice_number, customer_name, status, total, amount_paid, created_at)
      `)
      .eq("id", id)
      .eq("tenant_id", user.id)
      .single(),
    supabase
      .from("customers")
      .select("id, name, phone, email, address")
      .eq("tenant_id", user.id)
      .order("name"),
  ]);

  if (!job) notFound();

  return <JobDetail job={job as unknown as Job} customers={customers ?? []} />;
}
