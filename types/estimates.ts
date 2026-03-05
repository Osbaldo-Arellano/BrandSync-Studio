export type EstimateStatus = "draft" | "sent" | "approved" | "invoiced" | "declined";

export interface EstimateItem {
  id: string;
  estimate_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Estimate {
  id: string;
  customer_id: string | null;
  customerName: string;
  customerAddress: string;
  customer_email: string | null;
  customer_phone: string | null;
  salesperson: string;
  job: string;
  payment_terms: string;
  due_date: string;
  status: EstimateStatus;
  cash_note: string;
  notes: string;
  deposit: number;
  total: number;
  created_at: string;
  sent_at: string | null;
  signature_url: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  signed_ip: string | null;
  items: EstimateItem[];
}
