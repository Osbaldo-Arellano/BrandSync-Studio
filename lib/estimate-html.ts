import type { Estimate } from "@/types/estimates";
import type { TenantProfile } from "@/types/tenant";
import { formatTenantAddress } from "@/types/tenant";

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function estimateHtml(estimate: Estimate, signatureDataUrl?: string, tenant?: TenantProfile): string {
  const name = tenant?.name ?? "";
  const { street, cityLine, ccbLine } = tenant
    ? formatTenantAddress(tenant)
    : { street: "", cityLine: "", ccbLine: "" };
  const tagline = tenant?.tagline ?? "";
  const logoUrl = tenant?.logo_url ?? null;
  const iconUrl = tenant?.icon_url ?? null;

  const addrHtml = [street, cityLine].filter(Boolean).map(l => `${l}<br/>`).join("");
  const ccbHtml = ccbLine ? `${ccbLine}<br/>` : "";
  const taglineHtml = tagline || "Licensed, Bonded, Insured";

  const subtotal = estimate.items.reduce((s, i) => s + i.line_total, 0);
  const total = subtotal - estimate.deposit;

  const itemRows = estimate.items.map((item) => `
    <tr>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">${item.quantity}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;">${item.description}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;">${item.unit_price ? usd(item.unit_price) : ""}</td>
      <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:600;">${usd(item.line_total)}</td>
    </tr>
  `).join("");

  const fillerRows = Array.from({ length: Math.max(0, 3 - estimate.items.length) }).map(() => `
    <tr>
      <td colspan="4" style="border:1px solid #d1d5db;padding:12px;background:#f5f8f5;">&nbsp;</td>
    </tr>
  `).join("");

  const signatureBlock = signatureDataUrl ? `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#6b7280;margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Electronic Signature</p>
      <div style="display:flex;align-items:flex-end;gap:40px;flex-wrap:wrap;">
        <div>
          <img src="${signatureDataUrl}" alt="Signature" style="height:70px;border-bottom:1px solid #374151;display:block;" />
          <p style="font-size:11px;color:#6b7280;margin-top:4px;">Signature</p>
        </div>
        <div>
          <p style="font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #374151;padding-bottom:2px;min-width:180px;">${estimate.signed_by_name ?? ""}</p>
          <p style="font-size:11px;color:#6b7280;margin-top:4px;">Printed name</p>
        </div>
        <div>
          <p style="font-size:14px;color:#111827;border-bottom:1px solid #374151;padding-bottom:2px;">${estimate.signed_at ? new Date(estimate.signed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}</p>
          <p style="font-size:11px;color:#6b7280;margin-top:4px;">Date</p>
        </div>
      </div>
      ${estimate.signed_ip ? `<p style="font-size:10px;color:#9ca3af;margin-top:16px;">IP address: ${estimate.signed_ip} · Electronically signed via ${name}</p>` : ""}
    </div>
  ` : `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:13px;color:#6b7280;">To accept this estimate, sign and return &nbsp;<span style="display:inline-block;border-bottom:1px solid #6b7280;width:220px;">&nbsp;</span></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    @page { size: letter; margin: 0.75in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; }
    table { border-collapse: collapse; width: 100%; }
    th { font-weight: 600; }
  </style>
</head>
<body>

  <!-- Letterhead -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e5e7eb;margin-bottom:24px;">
    <div>
      <p style="font-size:16px;font-weight:700;color:#111827;">${name}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:4px;line-height:1.5;">${addrHtml}${ccbHtml}${taglineHtml}</p>
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height:52px;max-width:180px;object-fit:contain;display:block;margin-left:auto;margin-bottom:4px;">` : ""}
      <p style="font-size:16px;font-weight:700;color:#111827;">Estimate</p>
      <p style="font-size:12px;color:#6b7280;">Date: ${new Date(estimate.created_at).toLocaleDateString("en-US")}</p>
    </div>
  </div>

  <!-- To -->
  <div style="margin-bottom:24px;">
    <p style="font-size:13px;font-weight:600;color:#111827;"><strong>To:</strong> ${estimate.customerName}${estimate.customerAddress ? " &mdash; " + estimate.customerAddress : ""}</p>
  </div>

  <!-- Job info table -->
  <table style="margin-bottom:24px;">
    <thead>
      <tr style="background:#e8f0e8;">
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:12px;color:#4b5563;">Salesperson</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:12px;color:#4b5563;">Job</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:12px;color:#4b5563;">Payment terms</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:12px;color:#4b5563;">Due date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #d1d5db;padding:8px 10px;">${estimate.salesperson || "&mdash;"}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;">${estimate.job || "&mdash;"}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;">${estimate.payment_terms || "&mdash;"}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;">${estimate.due_date || "TBD"}</td>
      </tr>
    </tbody>
  </table>

  <!-- Line items -->
  <table style="margin-bottom:24px;">
    <thead>
      <tr style="background:#e8f0e8;">
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:12px;color:#4b5563;width:60px;">Qty</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:12px;color:#4b5563;">Description</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-size:12px;color:#4b5563;width:100px;">Unit price</th>
        <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-size:12px;color:#4b5563;width:100px;">Line total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${fillerRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
    <table style="width:260px;">
      <tbody>
        <tr>
          <td style="padding:6px 12px;text-align:right;color:#6b7280;">Subtotal</td>
          <td style="padding:6px 12px;text-align:right;border:1px solid #d1d5db;background:#e8f0e8;min-width:110px;">${usd(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;text-align:right;color:#6b7280;">Deposit</td>
          <td style="padding:6px 12px;text-align:right;border:1px solid #d1d5db;background:#e8f0e8;">${usd(estimate.deposit)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;text-align:right;font-weight:700;color:#111827;">Total</td>
          <td style="padding:6px 12px;text-align:right;border:1px solid #d1d5db;background:#e8f0e8;font-weight:700;">${usd(total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Notes -->
  ${estimate.cash_note || estimate.notes ? `
  <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-bottom:24px;">
    ${estimate.cash_note ? `<p style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:6px;">NOTE: ${estimate.cash_note}</p>` : ""}
    ${estimate.notes ? `<p style="font-size:13px;color:#374151;white-space:pre-wrap;">${estimate.notes}</p>` : ""}
  </div>
  ` : ""}

  ${signatureBlock}

  <p style="text-align:center;font-size:13px;font-weight:500;color:#6b7280;margin-top:32px;">Thank you for your business!</p>

</body>
</html>`;
}
