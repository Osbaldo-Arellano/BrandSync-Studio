import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// Public endpoint — no session required.
// Allows a customer on /pay/[id] to record their payment preference.
// Only "cash" and "deferred" are accepted, and only from a payable status.

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  sent:    ["cash", "deferred"],
  partial: ["cash", "deferred"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status: next } = (await request.json()) as { status: string };

  if (!["cash", "deferred"].includes(next)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[invoice.status as string] ?? [];
  if (!allowed.includes(next)) {
    return NextResponse.json(
      { error: `Cannot transition from ${invoice.status} to ${next}` },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("invoices")
    .update({ status: next })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
