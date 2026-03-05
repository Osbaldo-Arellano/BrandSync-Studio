import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateId } = await request.json();
  if (!estimateId) return NextResponse.json({ error: "estimateId required" }, { status: 400 });

  // Fetch estimate + items
  const { data: estimate, error: estErr } = await supabase
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", estimateId)
    .eq("tenant_id", user.id)
    .single();

  if (estErr || !estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  if (estimate.status !== "approved") return NextResponse.json({ error: "Only approved estimates can be invoiced" }, { status: 400 });

  // Create invoice
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      tenant_id: user.id,
      estimate_id: estimateId,
      customer_name: estimate.customer_name ?? "",
      status: "draft",
      total: estimate.total ?? 0,
    })
    .select()
    .single();

  if (invErr || !invoice) return NextResponse.json({ error: invErr?.message ?? "Failed to create invoice" }, { status: 500 });

  // Copy estimate items to invoice_items
  const items = (estimate.estimate_items ?? []).map((item: Record<string, unknown>) => ({
    invoice_id: invoice.id,
    description: item.description ?? "",
    quantity: item.quantity ?? 0,
    unit_price: item.unit_price ?? 0,
  }));

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Mark estimate as invoiced
  await supabase
    .from("estimates")
    .update({ status: "invoiced" })
    .eq("id", estimateId)
    .eq("tenant_id", user.id);

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}
