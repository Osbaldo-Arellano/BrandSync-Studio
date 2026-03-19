import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import type { InvoiceStatus } from "@/types/invoices";

export default async function InvoicesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: rows } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  // Auto-mark sent invoices as overdue when due_date has passed
  const today = new Date().toISOString().slice(0, 10);
  const overdueIds = (rows ?? [])
    .filter((r) => r.status === "sent" && r.due_date && (r.due_date as string) < today)
    .map((r) => r.id as string);

  if (overdueIds.length > 0) {
    await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .in("id", overdueIds)
      .eq("tenant_id", user.id);
    rows = (rows ?? []).map((r) =>
      overdueIds.includes(r.id as string) ? { ...r, status: "overdue" } : r
    );
  }

  const invoices = (rows ?? []).map((row) => ({
    id: row.id as string,
    estimate_id: (row.estimate_id as string | null) ?? null,
    customer_name: (row.customer_name as string) ?? "",
    status: row.status as InvoiceStatus,
    total: (row.total as number) ?? 0,
    created_at: row.created_at as string,
    invoice_number: (row.invoice_number as number) ?? 0,
    due_date: (row.due_date as string | null) ?? null,
    items: (row.invoice_items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      invoice_id: item.invoice_id as string,
      description: (item.description as string) ?? "",
      quantity: (item.quantity as number) ?? 0,
      unit_price: (item.unit_price as number) ?? 0,
    })),
  }));

  return <InvoiceList invoices={invoices} />;
}
