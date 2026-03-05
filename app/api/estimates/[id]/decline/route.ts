import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// Public endpoint — no user auth required (client declines via shared link)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("estimates")
    .select("status")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "sent") {
    return NextResponse.json({ error: "Only sent estimates can be declined" }, { status: 409 });
  }

  const { error } = await admin
    .from("estimates")
    .update({ status: "declined" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
