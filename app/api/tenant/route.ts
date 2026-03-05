import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tenants")
    .select(FIELDS)
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? {});
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("tenants")
    .upsert({
      id: user.id,
      name:            body.name            ?? "",
      ccb_number:      body.ccb_number      ?? null,
      tagline:         body.tagline         ?? null,
      email:           body.email           ?? null,
      phone:           body.phone           ?? null,
      website:         body.website         ?? null,
      address_street:  body.address_street  ?? null,
      address_city:    body.address_city    ?? null,
      address_state:   body.address_state   ?? null,
      address_zip:     body.address_zip     ?? null,
    })
    .select(FIELDS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
