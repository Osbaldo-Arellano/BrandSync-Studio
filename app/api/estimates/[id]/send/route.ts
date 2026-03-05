import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { customerEmail } = await request.json();

  if (!customerEmail?.trim()) {
    return NextResponse.json({ error: "A client email is required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: estimate, error: fetchError } = await admin
    .from("estimates")
    .select("job, customer_name, tenant_id")
    .eq("id", id)
    .single();

  if (fetchError || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }
  if (estimate.tenant_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: tenant } = await admin.from("tenants").select("name, ccb_number").eq("id", user.id).single();
  const tenantName = tenant?.name || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/e/${id}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [customerEmail.trim()],
      subject: `Your estimate from ${tenantName}`,
      html: `
        <p>Hi ${estimate.customer_name},</p>
        <p>${tenantName} has sent you an estimate${estimate.job ? ` for <strong>${estimate.job}</strong>` : ""}.</p>
        <p>Review and sign here:<br/>
          <a href="${link}">${link}</a>
        </p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">${tenantName}</p>
      `,
    });
  } catch (err) {
    return NextResponse.json({ error: `Email failed: ${(err as Error).message}` }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("estimates")
    .update({
      customer_email: customerEmail.trim(),
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
