export async function generatePdf(html: string): Promise<Buffer> {
  const isVercel = Boolean(process.env.VERCEL);

  type PuppeteerModule = typeof import("puppeteer");
  const puppeteer = (
    isVercel ? await import("puppeteer-core") : await import("puppeteer")
  ) as unknown as PuppeteerModule;

  let browser: Awaited<ReturnType<PuppeteerModule["launch"]>>;

  if (isVercel) {
    const chromium = await import("@sparticuz/chromium");
    const chromiumInput =
      process.env.CHROMIUM_PACK_URL ||
      process.env.CHROMIUM_PACK_PATH ||
      process.env.CHROMIUM_PACK_DIR;

    let executablePath: string;
    try {
      executablePath = chromiumInput
        ? await chromium.default.executablePath(chromiumInput)
        : await chromium.default.executablePath();
    } catch (error) {
      const hint = chromiumInput
        ? `Failed to resolve Chromium from CHROMIUM_PACK_* (${chromiumInput}).`
        : "Chromium binaries not found. Set CHROMIUM_PACK_URL or CHROMIUM_PACK_DIR to a pack containing the .br files.";
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`${hint} ${message}`);
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
