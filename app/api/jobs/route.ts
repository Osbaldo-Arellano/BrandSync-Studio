import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      id, title, address, status, notes, created_at,
      customer:customers(id, name, phone, email, address),
      estimates(id, status, total),
      invoices(id, status, total, amount_paid)
    `)
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, customerId, customerName, address, notes } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  let resolvedCustomerId: string | null = customerId || null;

  if (!resolvedCustomerId && customerName?.trim()) {
    const { data: newCustomer, error: custErr } = await supabase
      .from("customers")
      .insert({ tenant_id: user.id, name: customerName.trim() })
      .select("id")
      .single();
    if (custErr || !newCustomer) return NextResponse.json({ error: custErr?.message ?? "Failed to create customer" }, { status: 500 });
    resolvedCustomerId = newCustomer.id;
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      tenant_id: user.id,
      title: title.trim(),
      customer_id: resolvedCustomerId,
      address: address || null,
      notes: notes || null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
