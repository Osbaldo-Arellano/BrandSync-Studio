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

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      id, title, address, status, notes, created_at,
      customer:customers(id, name, phone, email, address),
      estimates(id, estimate_number, customer_name, status, total, created_at),
      invoices(id, invoice_number, customer_name, status, total, amount_paid, created_at)
    `)
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, customerId, address, notes, status } = await request.json();

  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (customerId !== undefined) patch.customer_id = customerId || null;
  if (address !== undefined) patch.address = address || null;
  if (notes !== undefined) patch.notes = notes || null;
  if (status !== undefined) patch.status = status;

  const { data, error } = await supabase
    .from("jobs")
    .update(patch)
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
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
