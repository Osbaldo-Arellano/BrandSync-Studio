import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import chromium from "@sparticuz/chromium";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const ORDER_EMAIL = "o.arellano.dev@gmail.com";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { html, filename, quantity } = await req.json();

  if (!html || typeof html !== "string") {
    return new Response("Missing html", { status: 400 });
  }

  // Generate PDF
  const isVercel = Boolean(process.env.VERCEL);
  type PuppeteerModule = typeof import("puppeteer");
  const puppeteer = (isVercel
    ? await import("puppeteer-core")
    : await import("puppeteer")) as unknown as PuppeteerModule;

  let browser: Awaited<ReturnType<PuppeteerModule["launch"]>> | undefined;
  try {
    browser = await puppeteer.launch(
      isVercel
        ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
        }
        : {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          },
    );
  } catch (err) {
    console.error("Puppeteer launch failed", {
      isVercel,
      hasExecutablePath: Boolean(process.env.CHROME_EXECUTABLE_PATH),
      err,
    });
    return new Response("Failed to launch browser", { status: 500 });
  }

  let pdfBuffer: Buffer;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
    });

    pdfBuffer = Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const safeName = filename || "asset";
  const userName = user.email || "A customer";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: ORDER_EMAIL,
    subject: `New Order: ${safeName} (x${quantity || "?"})`,
    text: `New order from ${userName}.\n\nAsset: ${safeName}\nQuantity: ${quantity || "Not specified"}\n\nThe PDF is attached.`,
    attachments: [
      {
        filename: `${safeName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return Response.json({ ok: true });
}
