export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  estimate_id: string | null;
  customer_id: string;
  customerName: string;
  status: InvoiceStatus;
  total: number;
  created_at: string;
  items: InvoiceItem[];
}
