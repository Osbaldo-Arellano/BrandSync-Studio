import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CustomerDetail } from "@/components/dashboard/CustomerDetail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, name, address, phone, email, created_at")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (custErr || !customer) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id, title, address, status, notes, created_at,
      estimates(id, estimate_number, status, total, created_at),
      invoices(id, invoice_number, status, total, amount_paid, created_at)
    `)
    .eq("tenant_id", user.id)
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return <CustomerDetail customer={{ ...customer, jobs: jobs ?? [] }} />;
}
