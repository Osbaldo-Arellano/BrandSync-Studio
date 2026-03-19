import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CustomerList } from "@/components/dashboard/CustomerList";

export default async function CustomersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("customers")
    .select("id, name, address, phone, email, created_at")
    .eq("tenant_id", user.id)
    .order("name");

  return <CustomerList customers={data ?? []} />;
}
