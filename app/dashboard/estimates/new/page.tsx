import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NewEstimateForm, NewEstimateFormMobile } from "@/components/estimates";
import type { TenantProfile } from "@/types/tenant";

const TENANT_FIELDS = "name, ccb_number, tagline, email, phone, website, address_street, address_city, address_state, address_zip";

export default async function NewEstimatePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tenant }, { data: brand }] = await Promise.all([
    supabase.from("tenants").select(TENANT_FIELDS).eq("id", user.id).single(),
    supabase.from("brands").select("logo_url, icon_url").eq("user_id", user.id).single(),
  ]);
  const tenantProfile: TenantProfile = {
    name: tenant?.name ?? "",
    ccb_number: tenant?.ccb_number ?? "",
    tagline: tenant?.tagline ?? "",
    email: tenant?.email ?? "",
    phone: tenant?.phone ?? "",
    website: tenant?.website ?? "",
    address_street: tenant?.address_street ?? "",
    address_city: tenant?.address_city ?? "",
    address_state: tenant?.address_state ?? "",
    address_zip: tenant?.address_zip ?? "",
    logo_url: brand?.logo_url ?? null,
    icon_url: brand?.icon_url ?? null,
  };

  return (
    <>
      <div className="hidden md:block h-full">
        <NewEstimateForm tenant={tenantProfile} />
      </div>
      <div className="md:hidden h-full">
        <NewEstimateFormMobile tenant={tenantProfile} />
      </div>
    </>
  );
}
