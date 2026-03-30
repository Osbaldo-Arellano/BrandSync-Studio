import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}

interface InvoiceData {
  id: string;
  invoice_number?: number;
  customer_name: string;
  customer_address?: string | null;
  customer_phone?: string | null;
  delivery_method?: string | null;
  status: string;
  total: number;
  amount_paid?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  due_date?: string | null;
  notes?: string;
  created_at: string;
  payment_terms?: string | null;
  items: InvoiceItem[];
}

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const STATUS_LABELS: Record<string, string> = {
  draft:    "Draft",
  sent:     "Sent",
  paid:     "Paid",
  overdue:  "Overdue",
  partial:  "Partial",
  cash:     "Cash",
  cashapp:  "Cash App",
  deferred: "Pay Later",
  void:     "Void",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  email: "Sent via email",
  link:  "Shared via link",
  print: "Physical delivery",
};

export function invoiceHtml(invoice: InvoiceData, tenant: TenantProfile): string {
  const { street, cityLine, ccbLine } = formatTenantAddress(tenant);
  const logoUrl = tenant.logo_url ?? null;

  const addrHtml = [street, cityLine].filter(Boolean).map((l) => `${l}<br/>`).join("");
  const ccbHtml = ccbLine ? `${ccbLine}<br/>` : "";

  const invoiceNum = invoice.invoice_number
    ? `INV-${String(invoice.invoice_number).padStart(4, "0")}`
    : `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  const createdDate = new Date(invoice.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status;

  const itemRows = invoice.items.map((item) => {
    const lt = (item.line_total && item.line_total > 0)
      ? item.line_total
      : item.quantity * item.unit_price;
    return `
    <tr>
      <td style="border:1px solid #d1d5db;padding:8px 10px;">${item.description || "—"}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">${item.quantity}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;">${usd(item.unit_price)}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:600;">${usd(lt)}</td>
    </tr>`;
  }).join("");

  const fillerRows = Array.from({ length: Math.max(0, 3 - invoice.items.length) })
    .map(
      () => `
    <tr>
      <td colspan="4" style="border:1px solid #d1d5db;padding:12px;background:#f9fafb;">&nbsp;</td>
    </tr>`
    )
    .join("");

  const subtotal = invoice.items.reduce((s, i) => {
    const lt = (i.line_total && i.line_total > 0) ? i.line_total : i.quantity * i.unit_price;
    return s + lt;
  }, 0);

  const totalsHtml = `
  <tr>
    <td colspan="3" style="padding:6px 10px;text-align:right;font-size:12px;color:#6b7280;">Subtotal</td>
    <td style="padding:6px 10px;text-align:right;font-size:12px;color:#374151;">${usd(subtotal)}</td>
  </tr>
  ${(invoice.discount_amount ?? 0) > 0 ? `
  <tr>
    <td colspan="3" style="padding:6px 10px;text-align:right;font-size:12px;color:#6b7280;">Discount</td>
    <td style="padding:6px 10px;text-align:right;font-size:12px;color:#059669;">−${usd(invoice.discount_amount!)}</td>
  </tr>` : ""}
  ${(invoice.tax_amount ?? 0) > 0 ? `
  <tr>
    <td colspan="3" style="padding:6px 10px;text-align:right;font-size:12px;color:#6b7280;">Tax${invoice.tax_rate ? ` (${invoice.tax_rate}%)` : ""}</td>
    <td style="padding:6px 10px;text-align:right;font-size:12px;color:#374151;">${usd(invoice.tax_amount!)}</td>
  </tr>` : ""}
  ${(invoice.amount_paid ?? 0) > 0 ? `
  <tr>
    <td colspan="3" style="padding:6px 10px;text-align:right;font-size:12px;color:#6b7280;">Deposit Paid</td>
    <td style="padding:6px 10px;text-align:right;font-size:12px;color:#059669;">−${usd(invoice.amount_paid!)}</td>
  </tr>` : ""}
  <tr style="background:#f9fafb;">
    <td colspan="3" style="padding:8px 10px;text-align:right;font-weight:700;font-size:13px;border-top:2px solid #d1d5db;">Total</td>
    <td style="padding:8px 10px;text-align:right;font-weight:700;font-size:13px;border-top:2px solid #d1d5db;">${usd(invoice.total)}</td>
  </tr>
  ${(invoice.amount_paid ?? 0) > 0 && invoice.status !== "paid" ? `
  <tr>
    <td colspan="3" style="padding:6px 10px;text-align:right;font-size:12px;color:#6b7280;">Balance Due</td>
    <td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:600;color:#111827;">${usd(invoice.total - (invoice.amount_paid ?? 0))}</td>
  </tr>` : ""}
`;

  const paidStamp = invoice.status === "paid" ? `
    <div style="position:absolute;top:40px;right:40px;border:3px solid #059669;border-radius:4px;padding:4px 14px;transform:rotate(-15deg);opacity:0.35;">
      <span style="font-size:28px;font-weight:900;color:#059669;letter-spacing:.1em;text-transform:uppercase;">PAID</span>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: letter; margin: 0.75in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; position: relative; }
    table { border-collapse: collapse; width: 100%; }
    th { font-weight: 600; }
  </style>
</head>
<body>

${paidStamp}

<!-- Letterhead -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb;">
  <div>
    ${logoUrl ? `<img src="${logoUrl}" alt="${tenant.name}" style="height:48px;width:auto;margin-bottom:10px;display:block;" />` : ""}
    <p style="font-size:15px;font-weight:700;color:#111827;">${tenant.name}</p>
    ${addrHtml ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;line-height:1.6;">${addrHtml}</p>` : ""}
    ${tenant.phone ? `<p style="font-size:12px;color:#6b7280;">${tenant.phone}</p>` : ""}
    ${tenant.email ? `<p style="font-size:12px;color:#6b7280;">${tenant.email}</p>` : ""}
    ${ccbHtml ? `<p style="font-size:11px;color:#9ca3af;margin-top:4px;">${ccbHtml}</p>` : ""}
  </div>
  <div style="text-align:right;">
    <p style="font-size:26px;font-weight:800;color:#111827;letter-spacing:.04em;">INVOICE</p>
    <p style="font-size:12px;font-family:monospace;color:#6b7280;margin-top:4px;">${invoiceNum}</p>
    <p style="font-size:12px;color:#6b7280;margin-top:2px;">${createdDate}</p>
    <p style="margin-top:8px;display:inline-block;border:1px solid #d1d5db;border-radius:3px;padding:2px 10px;font-size:11px;font-weight:600;color:#374151;">${statusLabel}</p>
    ${invoice.delivery_method && PAYMENT_METHOD_LABELS[invoice.delivery_method]
      ? `<p style="font-size:11px;color:#9ca3af;margin-top:2px;">${PAYMENT_METHOD_LABELS[invoice.delivery_method]}</p>`
      : ""}
    ${invoice.due_date ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;">Due: ${invoice.due_date}</p>` : ""}
  </div>
</div>

<!-- Bill To -->
<div style="margin-bottom:24px;">
  <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px;">Bill To</p>
  <p style="font-size:13px;font-weight:600;color:#111827;">${invoice.customer_name || "—"}</p>
  ${invoice.customer_address ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;">${invoice.customer_address}</p>` : ""}
  ${invoice.customer_phone ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;">${invoice.customer_phone}</p>` : ""}
</div>

${invoice.payment_terms ? `
<table style="margin-bottom:24px;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">Payment Terms</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #d1d5db;padding:8px 10px;">${invoice.payment_terms}</td>
    </tr>
  </tbody>
</table>` : ""}

<!-- Line items -->
<table style="margin-bottom:0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">Description</th>
      <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;width:60px;">Qty</th>
      <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;width:100px;">Unit Price</th>
      <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;width:100px;">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${fillerRows}
    ${totalsHtml}
  </tbody>
</table>

${invoice.notes ? `
<div style="margin-top:24px;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;">
  <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px;">Notes</p>
  <p style="font-size:12px;color:#374151;white-space:pre-wrap;">${invoice.notes}</p>
</div>` : ""}

<!-- Footer -->
<div style="margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end;">
  <p style="font-size:11px;color:#9ca3af;">Thank you for your business.</p>
  ${tenant.website ? `<p style="font-size:11px;color:#9ca3af;">${tenant.website}</p>` : ""}
</div>

</body>
</html>`;
}
