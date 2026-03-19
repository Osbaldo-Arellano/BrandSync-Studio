// lib/validation.ts

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export const INVOICE_TRANSITIONS: Record<string, string[]> = {
  draft:    ["sent", "void"],
  sent:     ["paid", "overdue", "partial", "cash", "cashapp", "deferred", "void"],
  partial:  ["sent", "paid", "overdue", "void"],
  overdue:  ["paid", "void"],
  cash:     ["paid"],
  cashapp:  ["paid"],
  deferred: ["sent", "paid", "overdue"],
  paid:     [],
  void:     [],
};

export const PAYABLE_STATUSES = new Set(["draft", "sent", "partial", "overdue", "deferred"]);

export interface LineItem {
  description?: unknown;
  quantity?: unknown;
  unit_price?: unknown;
  line_total?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateLineItems(items: unknown[]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: "items", message: "At least one line item is required" });
    return errors;
  }
  if (items.length > 100) {
    errors.push({ field: "items", message: "Maximum 100 line items allowed" });
    return errors;
  }
  items.forEach((raw, idx) => {
    const item = raw as LineItem;
    const label = `Item ${idx + 1}`;
    const desc = String(item.description ?? "").trim();
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);

    if (!desc) errors.push({ field: `items[${idx}].description`, message: `${label}: description is required` });
    else if (desc.length > 500) errors.push({ field: `items[${idx}].description`, message: `${label}: description must be ≤ 500 characters` });
    if (!Number.isFinite(qty) || qty <= 0) errors.push({ field: `items[${idx}].quantity`, message: `${label}: quantity must be greater than 0` });
    if (!Number.isFinite(price) || price < 0) errors.push({ field: `items[${idx}].unit_price`, message: `${label}: unit price cannot be negative` });
  });
  return errors;
}
