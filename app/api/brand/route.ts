import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const { data, error } = await supabase
    .from("brands")
    .select("name, tagline, email, phone, website_url, logo_url, icon_url, about_us, address, social_links")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const body = await request.json();
  const { name, tagline, email, phone, website_url, logo_url, icon_url, about_us, address, social_links } = body;

  const { data, error } = await supabase
    .from("brands")
    .upsert(
      {
        user_id: userId,
        name,
        tagline,
        email,
        phone,
        website_url,
        logo_url,
        icon_url,
        about_us,
        address,
        social_links,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
