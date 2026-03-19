import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, name, address, phone, email, created_at")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (custErr || !customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  return NextResponse.json({ ...customer, jobs: jobs ?? [] });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, address, phone, email } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("customers")
    .update({ name: name.trim(), address: address || null, phone: phone || null, email: email || null })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
