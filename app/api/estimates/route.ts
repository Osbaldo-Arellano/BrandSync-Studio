import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Estimate } from "@/types/estimates";

function mapRow(row: Record<string, unknown>): Estimate {
  return {
    id: row.id as string,
    estimate_number: (row.estimate_number as number) ?? 0,
    customer_id: (row.customer_id as string | null) ?? null,
    customerName: (row.customer_name as string) ?? "",
    customerAddress: (row.customer_address as string) ?? "",
    customer_email: (row.customer_email as string | null) ?? null,
    customer_phone: (row.customer_phone as string | null) ?? null,
    salesperson: (row.salesperson as string) ?? "",
    job: (row.job as string) ?? "",
    payment_terms: (row.payment_terms as string) ?? "",
    due_date: (row.due_date as string) ?? "",
    status: row.status as Estimate["status"],
    cash_note: (row.cash_note as string) ?? "",
    notes: (row.notes as string) ?? "",
    deposit: (row.deposit as number) ?? 0,
    total: (row.total as number) ?? 0,
    created_at: row.created_at as string,
    sent_at: (row.sent_at as string | null) ?? null,
    signature_url: (row.signature_url as string | null) ?? null,
    signed_at: (row.signed_at as string | null) ?? null,
    signed_by_name: (row.signed_by_name as string | null) ?? null,
    signed_ip: (row.signed_ip as string | null) ?? null,
    items: [],
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(mapRow));
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure tenant row exists (created on first use)
  const { error: tenantError } = await supabase
    .from("tenants")
    .upsert({ id: user.id }, { onConflict: "id" });
  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 });

  const body = await request.json();
  const {
    customerName, customerAddress, salesperson, job,
    paymentTerms, dueDate, deposit, cashNote, notes, items, total,
  } = body;

  const { data: estimate, error: estError } = await supabase
    .from("estimates")
    .insert({
      tenant_id: user.id,
      customer_id: null,
      customer_name: customerName,
      customer_address: customerAddress,
      salesperson,
      job,
      payment_terms: paymentTerms,
      due_date: dueDate,
      status: "draft",
      cash_note: cashNote,
      notes,
      deposit,
      total,
    })
    .select()
    .single();

  if (estError) return NextResponse.json({ error: estError.message }, { status: 500 });

  if (items && items.length > 0) {
    const itemRows = items.map((item: { description: string; quantity: number; unit_price: number; line_total: number }) => ({
      estimate_id: estimate.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    const { error: itemsError } = await supabase.from("estimate_items").insert(itemRows);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: estimate.id }, { status: 201 });
}
