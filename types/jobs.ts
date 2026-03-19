export type JobStatus = "active" | "completed" | "cancelled";

export interface Job {
  id: string;
  tenant_id?: string;
  customer_id: string | null;
  title: string;
  address: string | null;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  // Joined data (optional, present on detail fetch)
  customer: { id: string; name: string; phone: string | null; email: string | null; address: string | null } | null;
  estimates: JobEstimate[];
  invoices: JobInvoice[];
}

export interface JobEstimate {
  id: string;
  estimate_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

export interface JobInvoice {
  id: string;
  invoice_number: number | null;
  customer_name: string;
  status: string;
  total: number;
  amount_paid: number;
  created_at: string;
}
