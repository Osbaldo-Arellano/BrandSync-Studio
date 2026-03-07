export async function generatePdf(html: string): Promise<Buffer> {
  const isVercel = Boolean(process.env.VERCEL);

  type PuppeteerModule = typeof import("puppeteer");
  const puppeteer = (
    isVercel ? await import("puppeteer-core") : await import("puppeteer")
  ) as unknown as PuppeteerModule;

  let browser: Awaited<ReturnType<PuppeteerModule["launch"]>>;

  if (isVercel) {
    const chromium = await import("@sparticuz/chromium");

    // Explicit env var wins. Fallback to the GitHub release pack for the
    // installed version — required when outputFileTracingIncludes fails to
    // bundle the bin/ dir for dynamic routes (e.g. /api/estimates/[id]/sign).
    const PACK_FALLBACK =
      "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

    const chromiumInput =
      process.env.CHROMIUM_PACK_URL ||
      process.env.CHROMIUM_PACK_PATH ||
      process.env.CHROMIUM_PACK_DIR;

    let executablePath: string;
    try {
      executablePath = chromiumInput
        ? await chromium.default.executablePath(chromiumInput)
        : await chromium.default.executablePath();
    } catch {
      // Local bin dir not bundled (dynamic route tracing gap on Vercel).
      // Download + decompress to /tmp at runtime instead.
      executablePath = await chromium.default.executablePath(PACK_FALLBACK);
    }

    browser = await puppeteer.launch({
      args: chromium.default.args,
      executablePath,
    });
  } else {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
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
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
