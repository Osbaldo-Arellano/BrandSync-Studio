import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, address, phone, email, created_at")
    .eq("tenant_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, address, phone, email } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // Ensure tenant row exists (guard against users created before auto-create trigger)
  await supabase.from("tenants").upsert({ id: user.id, name: "" }, { onConflict: "id", ignoreDuplicates: true });

  // Dedup: return existing customer if name matches (case-insensitive)
  const { data: existing } = await supabase
    .from("customers")
    .select("id, name, address, phone, email, created_at")
    .eq("tenant_id", user.id)
    .ilike("name", name.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ...existing, _existing: true }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ tenant_id: user.id, name: name.trim(), address: address?.trim() || null, phone: phone?.trim() || null, email: email?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
