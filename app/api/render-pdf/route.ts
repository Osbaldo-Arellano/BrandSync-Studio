import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { html, filename } = await req.json();

  if (!html || typeof html !== "string") {
    return new Response("Missing html", { status: 400 });
  }

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

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
    });

    const ab: ArrayBuffer = Uint8Array.from(pdf).buffer;

    return new Response(ab, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename ?? "card"}.pdf"`,
      },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
