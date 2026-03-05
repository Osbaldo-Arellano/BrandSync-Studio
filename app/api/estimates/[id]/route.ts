import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
  const { status } = await request.json();

  const { data, error } = await supabase
    .from("estimates")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
