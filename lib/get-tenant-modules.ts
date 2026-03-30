import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MODULE_DEFAULTS, type Modules } from "@/config/modules";

export async function getTenantModules(): Promise<Modules> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return MODULE_DEFAULTS;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("modules")
    .eq("id", user.id)
    .single();

  const overrides = (tenant?.modules ?? {}) as Partial<Modules>;
  return { ...MODULE_DEFAULTS, ...overrides };
}
