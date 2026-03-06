import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { EstimateList } from "@/components/estimates";
import type { Estimate } from "@/types/estimates";

export default async function EstimatesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("estimates")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  const estimates: Estimate[] = (data ?? []).map((row) => ({
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
    items: [],
  }));

  return <EstimateList estimates={estimates} />;
}
