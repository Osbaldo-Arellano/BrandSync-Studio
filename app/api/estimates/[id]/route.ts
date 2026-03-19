import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: existing } = await supabase
    .from("estimates")
    .select("status")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft estimates can be edited" }, { status: 400 });
  }

  const body = await request.json();
  const {
    customerName, customerAddress, salesperson, job, paymentTerms, dueDate,
    deposit, cashNote, notes, items, total, taxRate, taxAmount, discountAmount,
  } = body;

  const { validateLineItems } = await import("@/lib/validation");
  const itemErrors = validateLineItems(items ?? []);
  if (itemErrors.length > 0) {
    return NextResponse.json({ error: itemErrors[0].message, errors: itemErrors }, { status: 400 });
  }

  const { error: estError } = await supabase
    .from("estimates")
    .update({
      customer_name: customerName,
      customer_address: customerAddress,
      salesperson,
      job,
      payment_terms: paymentTerms,
      due_date: dueDate,
      deposit,
      total,
      cash_note: cashNote,
      notes,
      tax_rate: taxRate ?? 0,
      tax_amount: taxAmount ?? 0,
      discount_amount: discountAmount ?? 0,
    })
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (estError) return NextResponse.json({ error: estError.message }, { status: 500 });

  await supabase.from("estimate_items").delete().eq("estimate_id", id);

  if (items?.length > 0) {
    const itemRows = items.map((item: Record<string, unknown>) => ({
      estimate_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));
    const { error: itemsError } = await supabase.from("estimate_items").insert(itemRows);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify it's a draft before deleting
  const { data: estimate } = await supabase
    .from("estimates")
    .select("status")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (estimate.status !== "draft") return NextResponse.json({ error: "Only draft estimates can be discarded" }, { status: 400 });

  const { error } = await supabase
    .from("estimates")
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

  const patch: Record<string, unknown> = { status };
  if (delivery_method !== undefined) patch.delivery_method = delivery_method;

  const { data, error } = await supabase
    .from("estimates")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
