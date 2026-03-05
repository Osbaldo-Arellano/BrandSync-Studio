export async function generatePdf(html: string): Promise<Buffer> {
  const isVercel = Boolean(process.env.VERCEL);

  type PuppeteerModule = typeof import("puppeteer");
  const puppeteer = (
    isVercel ? await import("puppeteer-core") : await import("puppeteer")
  ) as unknown as PuppeteerModule;

  let browser: Awaited<ReturnType<PuppeteerModule["launch"]>>;

  if (isVercel) {
    const chromium = await import("@sparticuz/chromium");
    browser = await puppeteer.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
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
