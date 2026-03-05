import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SettingsShell } from "@/components/dashboard/SettingsShell";
import type { TenantProfile } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select(TENANT_FIELDS)
    .eq("id", user.id)
    .single();

  const initial: TenantProfile = {
    name:           tenant?.name           ?? "",
    ccb_number:     tenant?.ccb_number     ?? "",
    tagline:        tenant?.tagline        ?? "",
    email:          tenant?.email          ?? "",
    phone:          tenant?.phone          ?? "",
    website:        tenant?.website        ?? "",
    address_street: tenant?.address_street ?? "",
    address_city:   tenant?.address_city   ?? "",
    address_state:  tenant?.address_state  ?? "",
    address_zip:    tenant?.address_zip    ?? "",
  };

  return <SettingsShell initial={initial} />;
}
