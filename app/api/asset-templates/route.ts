import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface AssetTemplateRow {
  asset_type_id: string;
  template_id: string;
  type: "template" | "pdf";
  html_body: string | null;
  pdf_url: string | null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("tenant_asset_templates")
    .select("asset_type_id, template_id, type, html_body, pdf_url")
    .eq("tenant_id", user.id);

  if (error) {
    return new Response("DB error", { status: 500 });
  }

  return Response.json(data ?? []);
}
