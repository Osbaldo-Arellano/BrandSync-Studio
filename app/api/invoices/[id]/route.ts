import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { INVOICE_TRANSITIONS } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "draft") return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 });

  await supabase.from("invoice_items").delete().eq("invoice_id", id);

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, delivery_method } = await request.json();

  // Fetch current invoice
  const { data: current } = await supabase
    .from("invoices")
    .select("status, total, amount_paid")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Enforce state machine
  const validNext = INVOICE_TRANSITIONS[current.status as string] ?? [];
  if (!validNext.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition invoice from '${current.status}' to '${status}'` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { status };
  if (delivery_method !== undefined) patch.delivery_method = delivery_method;

  // When marking fully paid, sync amount_paid to total
  const PAID_STATUSES = ["paid", "cash", "cashapp"];
  if (PAID_STATUSES.includes(status) && (current.amount_paid ?? 0) < (current.total as number)) {
    patch.amount_paid = current.total;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
