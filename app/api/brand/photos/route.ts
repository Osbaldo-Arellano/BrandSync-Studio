import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const { data, error } = await supabase
    .from("brand_photos")
    .select("id, url, alt_text, caption, sort_order")
    .eq("user_id", userId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const alt_text = formData.get("alt_text") as string | null;
  const caption = formData.get("caption") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("brand-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from("brand-photos").getPublicUrl(path);

  const { data: existing } = await supabase
    .from("brand_photos")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;

  const { data, error: dbError } = await supabase
    .from("brand_photos")
    .insert({
      user_id: userId,
      url: publicUrlData.publicUrl,
      alt_text: alt_text || null,
      caption: caption || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const { id } = await request.json();

  const { data: photo } = await supabase
    .from("brand_photos")
    .select("url")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(photo.url);
  const pathMatch = url.pathname.match(/\/brand-photos\/(.+)$/);
  if (pathMatch) {
    await supabase.storage.from("brand-photos").remove([pathMatch[1]]);
  }

  await supabase.from("brand_photos").delete().eq("id", id).eq("user_id", userId);
  return NextResponse.json({ ok: true });
}
