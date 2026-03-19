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

  const body = await request.json();
  const {
    estimateId,
    customerName,
    customerAddress,
    customerEmail,
    customerPhone,
    salesperson,
    paymentTerms,
    items: standaloneItems,
    total: standaloneTotal,
    notes: standaloneNotes,
    dueDate,
    taxRate,
    taxAmount,
    discountAmount,
    jobId,
  } = body;

  if (estimateId) {
    // Estimate-based invoice creation
    const { data: estimate, error: estErr } = await supabase
      .from("estimates")
      .select("*, estimate_items(*), job_id")
      .eq("id", estimateId)
      .eq("tenant_id", user.id)
      .single();

    if (estErr || !estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    if (estimate.status !== "approved") return NextResponse.json({ error: "Only approved estimates can be invoiced" }, { status: 400 });

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        tenant_id: user.id,
        estimate_id: estimateId,
        customer_name: estimate.customer_name ?? "",
        customer_address: (estimate.customer_address as string | null) ?? null,
        customer_email: (estimate.customer_email as string | null) ?? null,
        customer_phone: (estimate.customer_phone as string | null) ?? null,
        status: "draft",
        total: estimate.total ?? 0,
        amount_paid: 0,
        deposit: (estimate.deposit as number) ?? 0,
        discount_amount: (estimate.discount_amount as number) ?? 0,
        tax_rate: (estimate.tax_rate as number) ?? 0,
        tax_amount: (estimate.tax_amount as number) ?? 0,
        notes: (estimate.notes as string) ?? "",
        due_date: (estimate.due_date as string | null) ?? null,
        job_id: (estimate.job_id as string | null) ?? null,
      })
      .select()
      .single();

    if (invErr || !invoice) return NextResponse.json({ error: invErr?.message ?? "Failed to create invoice" }, { status: 500 });

    const items = (estimate.estimate_items ?? []).map((item: Record<string, unknown>) => ({
      invoice_id: invoice.id,
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      line_total: (item.line_total as number) ?? ((item.quantity as number ?? 0) * (item.unit_price as number ?? 0)),
    }));

    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
      if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    await supabase
      .from("estimates")
      .update({ status: "invoiced" })
      .eq("id", estimateId)
      .eq("tenant_id", user.id);

    return NextResponse.json({ id: invoice.id }, { status: 201 });
  }

  // Validate line items
  const { validateLineItems } = await import("@/lib/validation");
  const itemErrors = validateLineItems(standaloneItems ?? []);
  if (itemErrors.length > 0) {
    return NextResponse.json({ error: itemErrors[0].message, errors: itemErrors }, { status: 400 });
  }

  // Standalone invoice creation
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      tenant_id: user.id,
      estimate_id: null,
      customer_name: customerName ?? "",
      customer_address: customerAddress ?? null,
      customer_email: customerEmail ?? null,
      customer_phone: customerPhone ?? null,
      salesperson: salesperson ?? null,
      payment_terms: paymentTerms ?? null,
      status: "draft",
      total: standaloneTotal ?? 0,
      amount_paid: 0,
      deposit: 0,
      notes: standaloneNotes ?? "",
      due_date: dueDate ?? null,
      tax_rate: taxRate ?? 0,
      tax_amount: taxAmount ?? 0,
      discount_amount: discountAmount ?? 0,
      job_id: jobId ?? null,
    })
    .select()
    .single();

  if (invErr || !invoice) return NextResponse.json({ error: invErr?.message ?? "Failed to create invoice" }, { status: 500 });

  if (standaloneItems && standaloneItems.length > 0) {
    const itemRows = standaloneItems.map((item: Record<string, unknown>) => ({
      invoice_id: invoice.id,
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      line_total: (item.line_total as number) ?? ((item.quantity as number ?? 0) * (item.unit_price as number ?? 0)),
    }));
    const { error: itemsErr } = await supabase.from("invoice_items").insert(itemRows);
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}
