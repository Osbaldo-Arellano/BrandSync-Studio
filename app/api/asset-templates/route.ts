import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface AssetTemplateRow {
  asset_type_id: string;
  template_id: string;
  html_body: string;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("tenant_asset_templates")
    .select("asset_type_id, template_id, html_body")
    .eq("tenant_id", user.id);

  if (error) {
    return new Response("DB error", { status: 500 });
  }

  return Response.json(data ?? []);
}
