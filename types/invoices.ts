export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial" | "cash" | "cashapp" | "deferred" | "void";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number?: number;
  estimate_id: string | null;
  customer_id?: string;
  customerName: string;
  customer_address?: string | null;
  customer_email?: string | null;
  status: InvoiceStatus;
  total: number;
  amount_paid?: number;
  deposit?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  due_date?: string | null;
  job_id?: string | null;
  notes?: string;
  delivery_method?: "email" | "link" | "print" | null;
  customer_phone?: string | null;
  payment_terms?: string | null;
  salesperson?: string | null;
  created_at: string;
  items: InvoiceItem[];
}
