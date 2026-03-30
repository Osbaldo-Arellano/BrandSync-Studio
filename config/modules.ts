// ─────────────────────────────────────────────────────────────────────────────
// Module definitions and defaults.
// Per-tenant overrides live in tenants.modules (jsonb) in the DB.
// Manage via Supabase dashboard: set {"invoices": false} to disable a module.
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleKey =
  | "dashboard"
  | "customers"
  | "jobs"
  | "invoices"
  | "print"
  | "settings"
  | "emailMarketing";

export type Modules = Record<ModuleKey, boolean>;

// Default state — all on except emailMarketing.
// Any key present in tenants.modules overrides these.
export const MODULE_DEFAULTS: Modules = {
  dashboard:      true,
  customers:      true,
  jobs:           true,
  invoices:       true,
  print:          true,
  settings:       true,
  emailMarketing: false,
};

// Ordered fallback destinations when dashboard module is disabled
export const MODULE_HOME_ROUTES: Partial<Record<ModuleKey, string>> = {
  emailMarketing: "/dashboard/email-marketing",
  jobs:           "/dashboard/jobs",
  invoices:       "/dashboard/invoices",
  print:          "/dashboard/print",
  customers:      "/dashboard/customers",
};
