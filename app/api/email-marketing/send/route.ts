import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

interface Recipient {
  name: string;
  email: string;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipients, subject, body } = (await request.json()) as {
    recipients: Recipient[];
    subject: string;
    body: string;
  };

  if (!recipients?.length || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const results = await Promise.allSettled(
    recipients.map((r) =>
      transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME ?? "HustleRunner"}" <${process.env.SMTP_FROM!}>`,
        to: `"${r.name}" <${r.email}>`,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed });
}
