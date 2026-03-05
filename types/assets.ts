export interface AssetField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel" | "textarea" | "currency";
  required?: boolean;
  /** If true, the field is display-only — the value comes from brand state, not user input. */
  readonly?: boolean;
  /** Shown below a readonly field to guide the user where to edit it. */
  hint?: string;
}

export interface AssetTemplate {
  id: string;
  name: string;
  description: string;
}

export interface AssetTypeConfig {
  id: string;
  label: string;
  description: string;
  width: string;   // CSS inches e.g. "3.5in"
  height: string;
  /** Pixel dimensions at 96dpi for on-screen preview */
  previewWidth: number;
  previewHeight: number;
  /** Aspect ratio CSS value e.g. "1.75/1" */
  aspect: string;
  templates: AssetTemplate[];
  fields: AssetField[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: "business-card",
    label: "Business Cards",
    description: "US Standard 3.5\" × 2\"",
    width: "3.5in",
    height: "2in",
    previewWidth: 336,   // 3.5 * 96
    previewHeight: 192,  // 2 * 96
    aspect: "1.75/1",
    templates: [
      { id: "light", name: "English", description: "Clean light background" },
      { id: "light-es", name: "Spanish", description: "Light background, Spanish" },
    ],
    fields: [
      { key: "name", label: "Name", placeholder: "John Smith", required: true },
      { key: "title", label: "Title", placeholder: "Software Engineer" },
      { key: "email", label: "Email", placeholder: "contact@company.com", type: "email" },
      { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", type: "tel" },
      { key: "tagline", label: "Tagline", placeholder: "Your company tagline", readonly: true, hint: "Edit in Settings → Company Info" },
      { key: "website", label: "Website / QR Code URL", placeholder: "https://yourcompany.com", readonly: true, hint: "Edit in Settings → Company Info" },
    ],
  },
  {
    id: "envelope",
    label: "Envelopes",
    description: "#10 Envelope 9.5\" × 4.125\"",
    width: "9.5in",
    height: "4.125in",
    previewWidth: 912,   // 9.5 * 96
    previewHeight: 396,  // 4.125 * 96
    aspect: "9.5/4.125",
    templates: [
      { id: "light", name: "English", description: "Classic light envelope" },
      { id: "light-es", name: "Spanish", description: "Light envelope, Spanish" },
    ],
    fields: [
      { key: "fromName", label: "From Name", placeholder: "Company Name", readonly: true, hint: "Edit in Settings → Company Info" },
      { key: "fromAddress", label: "From Address", placeholder: "123 Main St\nCity, ST 12345", readonly: true, hint: "Edit in Settings → Company Info" },
      { key: "toName", label: "To Name", placeholder: "Recipient Name", required: true },
      { key: "toAddress", label: "To Address", placeholder: "456 Oak Ave, City, ST 67890" },
    ],
  },
  {
    id: "sticker",
    label: "Stickers",
    description: "3\" × 2.5\" Rectangle",
    width: "3in",
    height: "2.5in",
    previewWidth: 288,   // 3 * 96
    previewHeight: 240,  // 2.5 * 96
    aspect: "3/2.5",
    templates: [
      { id: "light", name: "English", description: "White background sticker" },
      { id: "light-es", name: "Spanish", description: "White sticker, Spanish" },
    ],
    fields: [
      { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", type: "tel" as const, readonly: true, hint: "Edit in Settings → Company Info" },
    ],
  },
  {
    id: "google-review",
    label: "Google Review Cards",
    description: "3.5\" × 2\" · Double-Sided",
    width: "3.5in",
    height: "2in",
    previewWidth: 336,
    previewHeight: 192,
    aspect: "1.75/1",
    templates: [
      { id: "light",    name: "English", description: "Rate us on Google (English)" },
      { id: "light-es", name: "Spanish", description: "Califícanos en Google (Español)" },
    ],
    fields: [
      {
        key: "googleUrl",
        label: "Google Review Link",
        placeholder: "https://g.page/r/your-review-id",
        required: true,
        hint: "Find this in your Google Business Profile → Get more reviews",
      },
    ],
  },
];

export function getAssetType(id: string): AssetTypeConfig | undefined {
  return ASSET_TYPES.find((a) => a.id === id);
}
