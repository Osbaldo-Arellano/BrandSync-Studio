import { describe, it, expect } from "vitest";
import { esc, printReset, logoImg, wrap, generateAssetHTML } from "./asset-html";
import type { AssetTypeConfig } from "@/types/assets";

// ---------------------------------------------------------------------------
// Test fixtures — match current asset registry
// ---------------------------------------------------------------------------

const BUSINESS_CARD: AssetTypeConfig = {
  id: "business-card",
  label: "Business Cards",
  description: 'US Standard 3.5" × 2"',
  width: "3.5in",
  height: "2in",
  previewWidth: 336,
  previewHeight: 192,
  aspect: "1.75/1",
  templates: [
    { id: "light", name: "Light", description: "Classic light card" },
    { id: "dark", name: "Dark", description: "Modern dark card" },
    { id: "light-es", name: "Light (ES)", description: "Light card, Spanish" },
    { id: "dark-es", name: "Dark (ES)", description: "Dark card, Spanish" },
  ],
  fields: [
    { key: "name", label: "Name", placeholder: "John Smith", required: true },
    { key: "title", label: "Title", placeholder: "Software Engineer" },
    { key: "email", label: "Email", placeholder: "contact@company.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", type: "tel" },
    { key: "tagline", label: "Tagline", placeholder: "Your company tagline" },
  ],
};

const ENVELOPE: AssetTypeConfig = {
  id: "envelope",
  label: "Envelopes",
  description: '#10 Envelope 9.5" × 4.125"',
  width: "9.5in",
  height: "4.125in",
  previewWidth: 912,
  previewHeight: 396,
  aspect: "9.5/4.125",
  templates: [
    { id: "light", name: "Light", description: "Classic light envelope" },
    { id: "dark", name: "Dark", description: "Modern dark envelope" },
    { id: "light-es", name: "Light (ES)", description: "Light envelope, Spanish" },
    { id: "dark-es", name: "Dark (ES)", description: "Dark envelope, Spanish" },
  ],
  fields: [
    { key: "fromName", label: "From Name", placeholder: "Company Name", required: true },
    { key: "fromAddress", label: "From Address", placeholder: "123 Main St, City, ST 12345" },
    { key: "toName", label: "To Name", placeholder: "Recipient Name", required: true },
    { key: "toAddress", label: "To Address", placeholder: "456 Oak Ave, City, ST 67890" },
  ],
};

const STICKER: AssetTypeConfig = {
  id: "sticker",
  label: "Stickers",
  description: '3" × 2.5" Rectangle',
  width: "3in",
  height: "2.5in",
  previewWidth: 288,
  previewHeight: 240,
  aspect: "3/2.5",
  templates: [
    { id: "light", name: "Light", description: "White background sticker" },
    { id: "dark", name: "Dark", description: "Dark background sticker" },
    { id: "light-es", name: "Light (ES)", description: "White sticker, Spanish" },
    { id: "dark-es", name: "Dark (ES)", description: "Dark sticker, Spanish" },
  ],
  fields: [
    { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", type: "tel" as const, readonly: true, hint: "Edit in Branding → Company Info" },
  ],
};

function baseOpts(
  asset: AssetTypeConfig,
  templateId: string,
  fields: Record<string, string> = {},
  logo: string | null = null,
  dark = false,
  tagline = "",
  icon: string | null = null,
  website = "",
) {
  return { asset, templateId, fields, logo, dark, tagline, icon, website };
}

// ---------------------------------------------------------------------------
// 1A — esc()
// ---------------------------------------------------------------------------

describe("esc", () => {
  it("escapes & < > \" correctly", () => {
    const out = esc('Tom & "Jerry" <tag>');
    expect(out).toBe("Tom &amp; &quot;Jerry&quot; &lt;tag&gt;");
    expect(out).not.toMatch(/[<>"]/);
  });

  it("handles empty string", () => {
    expect(esc("")).toBe("");
  });

  it("double-escapes already-escaped strings (documented behavior)", () => {
    expect(esc("&amp;")).toBe("&amp;amp;");
  });

  it("does not escape single quotes (documented limitation)", () => {
    const out = esc("it's a test");
    expect(out).toContain("'");
  });

  it("handles a <script> injection attempt", () => {
    const out = esc('<script>alert("xss")</script>');
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("handles mixed special characters", () => {
    const out = esc('a & b < c > d "e"');
    expect(out).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
  });
});

// ---------------------------------------------------------------------------
// 1B — generateAssetHTML() routing + fallback
// ---------------------------------------------------------------------------

describe("generateAssetHTML", () => {
  it("selects correct generator when key exists", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", { name: "Alice" }));
    expect(html).toContain("Alice");
    expect(html).not.toContain("Template preview not available");
  });

  it("returns fallback HTML when key is missing", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "nonexistent"));
    expect(html).toContain("Template preview not available");
  });

  it("uses asset.id and templateId exactly for key formation", () => {
    const fakeAsset = { ...BUSINESS_CARD, id: "business-card " };
    const html = generateAssetHTML(baseOpts(fakeAsset, "light"));
    expect(html).toContain("Template preview not available");
  });
});

// ---------------------------------------------------------------------------
// 1C — wrap() / printReset() — document contract
// ---------------------------------------------------------------------------

describe("wrap / printReset", () => {
  const html = wrap("3.5in", "2in", "#ffffff", ".test{}", "<p>hello</p>");

  it("starts with <!DOCTYPE html>", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
  });

  it('contains <meta charset="UTF-8">', () => {
    expect(html).toContain('<meta charset="UTF-8">');
  });

  it("contains @page with correct size", () => {
    expect(html).toContain("@page { size: 3.5in 2in; margin: 0; }");
  });

  it("contains background color in body", () => {
    expect(html).toContain("background: #ffffff");
  });

  it("contains print-color-adjust", () => {
    expect(html).toContain("print-color-adjust: exact");
    expect(html).toContain("-webkit-print-color-adjust: exact");
  });

  it("includes the custom CSS and body", () => {
    expect(html).toContain(".test{}");
    expect(html).toContain("<p>hello</p>");
  });
});

describe("printReset standalone", () => {
  it("sets width and height on html/body", () => {
    const css = printReset("8.5in", "11in", "#09090b");
    expect(css).toContain("width: 8.5in");
    expect(css).toContain("height: 11in");
  });
});

// ---------------------------------------------------------------------------
// 1D — logoImg()
// ---------------------------------------------------------------------------

describe("logoImg", () => {
  it("returns <img> with correct attributes when logo provided", () => {
    const img = logoImg("https://example.com/logo.png", "32px", "80px");
    expect(img).toContain("<img");
    expect(img).toContain('src="https://example.com/logo.png"');
    expect(img).toContain('alt="Logo"');
    expect(img).toContain("max-height:32px");
    expect(img).toContain("max-width:80px");
  });

  it("does not escape logo URL (documented — relies on trusted input)", () => {
    const malicious = 'x" onload="alert(1)';
    const img = logoImg(malicious, "32px", "80px");
    expect(img).toContain(malicious);
  });
});

// ---------------------------------------------------------------------------
// 2 — Business cards
// ---------------------------------------------------------------------------

describe("business-card light", () => {
  const fields = { name: "Alice", title: "Engineer", email: "a@b.com", phone: "555-1234", tagline: "We build" };

  it("renders all fields escaped", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).toContain("Alice");
    expect(html).toContain("Engineer");
    expect(html).toContain("a@b.com");
    expect(html).toContain("555-1234");
    expect(html).toContain("We build");
  });

  it("escapes fields with special characters", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", { name: '<script>alert("x")</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("uses light palette background", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).toContain("background:#ffffff");
  });

  it("includes key CSS classes", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).toContain(".card");
    expect(html).toContain(".name");
  });

  it("includes inline logo data URI", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).toContain("data:image/svg+xml;base64,");
  });

  it("renders icon on the front", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", fields), page: "front" });
    expect(html).toContain('class="front-icon"');
  });

  it("renders a QR code column on back when website is provided", () => {
    const html = generateAssetHTML(
      baseOpts(BUSINESS_CARD, "light", fields, null, false, "", null, "https://flawlesselectricinc.com"),
    );
    expect(html).toContain('class="qr-col"');
  });

  it("omits QR column when website is empty", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).not.toContain('class="qr-col"');
  });
});

describe("business-card page option", () => {
  const fields = { name: "Test", title: "Dev", email: "t@t.com", phone: "555", tagline: "Tag" };

  it("front-only contains .card but not a back wrapper", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", fields), page: "front" });
    expect(html).toContain("class=\"card\"");
    expect(html).not.toMatch(/class="back(-center)?"/);
  });

  it("back-only contains a back wrapper but not .card", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", fields), page: "back" });
    expect(html).toMatch(/class="back(-center)?"/);
    expect(html).not.toContain("class=\"card\"");
  });

  it("no page option renders both front and back", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).toContain("class=\"card\"");
    expect(html).toMatch(/class="back(-center)?"/);
  });
});

describe("business-card back social icons", () => {
  it("includes FIND US ON text on the back", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", {}), page: "back" });
    expect(html).toContain("FIND US ON");
  });

  it("includes Facebook and Instagram colors on the back", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", {}), page: "back" });
    expect(html).toContain("#1877F2"); // Facebook blue
    expect(html).toContain("#E4405F"); // Instagram pink
    expect(html).not.toContain("#FF0000"); // YouTube removed
  });

  it("shows QR layout when website is provided", () => {
    const html = generateAssetHTML({
      ...baseOpts(BUSINESS_CARD, "light", {}, null, false, "", null, "https://flawlesselectricinc.com"),
      page: "back",
    });
    expect(html).toContain('class="back"');
    expect(html).toContain('class="qr-col"');
  });

  it("shows centered layout when no website", () => {
    const html = generateAssetHTML({ ...baseOpts(BUSINESS_CARD, "light", {}), page: "back" });
    expect(html).toContain('class="back-center"');
    expect(html).not.toContain('class="qr-col"');
  });
});

describe("business-card spanish", () => {
  const fields = { name: "Carlos", title: "Jefe", email: "c@d.com", phone: "555", tagline: "English tagline" };

  it("light-es uses Spanish tagline", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light-es", fields));
    expect(html).toContain("Disciplina militar");
    expect(html).toContain("Precisión de oficio");
  });

  it("light (English) does not use Spanish tagline", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "light", fields));
    expect(html).not.toContain("Disciplina militar");
    expect(html).toContain("English tagline");
  });
});

// ---------------------------------------------------------------------------
// 3 — Envelopes
// ---------------------------------------------------------------------------

describe("envelope light", () => {
  const fields = { fromName: "Acme", fromAddress: "123 Main\nCity, ST", toName: "Bob", toAddress: "456 Oak\nTown, ST" };

  it("contains white-space:pre-line for addresses", () => {
    const html = generateAssetHTML(baseOpts(ENVELOPE, "light", fields));
    expect(html).toContain("white-space:pre-line");
  });

  it("renders from and to names", () => {
    const html = generateAssetHTML(baseOpts(ENVELOPE, "light", fields));
    expect(html).toContain("Acme");
    expect(html).toContain("Bob");
  });

  it("uses light palette background", () => {
    const html = generateAssetHTML(baseOpts(ENVELOPE, "light", fields));
    expect(html).toContain("background:#ffffff");
  });

  it("includes inline logo", () => {
    const html = generateAssetHTML(baseOpts(ENVELOPE, "light", fields));
    expect(html).toContain("data:image/svg+xml;base64,");
  });
});

// ---------------------------------------------------------------------------
// 4 — Stickers
// ---------------------------------------------------------------------------

describe("sticker light", () => {
  it("uses light palette background", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", {}));
    expect(html).toContain("background:#ffffff");
  });

  it("includes inline icon and logo", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", {}));
    const imgMatches = html.match(/<img/g);
    expect(imgMatches).not.toBeNull();
    expect(imgMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the brand tagline", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", {}, null, false, "Military discipline. Trade precision."));
    expect(html).toContain("Military discipline. Trade precision.");
  });

  it("includes sticker CSS class", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", {}));
    expect(html).toContain(".sticker");
  });

  it("renders phone number when provided", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", { phone: "(555) 987-6543" }));
    expect(html).toContain("(555) 987-6543");
  });

  it("omits phone div when phone is empty", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light", {}));
    expect(html).not.toContain('class="phone"');
  });
});

describe("sticker spanish", () => {
  it("light-es uses Spanish tagline", () => {
    const html = generateAssetHTML(baseOpts(STICKER, "light-es", {}));
    expect(html).toContain("Disciplina militar");
    expect(html).toContain("Precisión de oficio");
  });
});

// ---------------------------------------------------------------------------
// Fallback HTML
// ---------------------------------------------------------------------------

describe("fallbackHTML", () => {
  it("contains the fallback message", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "does-not-exist"));
    expect(html).toContain("Template preview not available");
  });

  it("is still a valid HTML document", () => {
    const html = generateAssetHTML(baseOpts(BUSINESS_CARD, "nope"));
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<meta charset");
  });

  it("uses correct dimensions from asset", () => {
    const html = generateAssetHTML(baseOpts(ENVELOPE, "nope"));
    expect(html).toContain("@page { size: 9.5in 4.125in; margin: 0; }");
  });

  it("respects dark mode palette", () => {
    const dark = generateAssetHTML(baseOpts(BUSINESS_CARD, "nope", {}, null, true));
    const light = generateAssetHTML(baseOpts(BUSINESS_CARD, "nope", {}, null, false));
    expect(dark).toContain("background: #09090b");
    expect(light).toContain("background: #ffffff");
  });
});
