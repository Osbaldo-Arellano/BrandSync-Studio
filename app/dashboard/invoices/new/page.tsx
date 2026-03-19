import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NewInvoiceForm } from "@/components/invoices/NewInvoiceForm";

export default async function NewInvoicePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Suspense>
      <NewInvoiceForm />
    </Suspense>
  );
}
