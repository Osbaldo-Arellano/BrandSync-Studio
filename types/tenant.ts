export interface TenantProfile {
  name: string;
  ccb_number: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  logo_url?: string | null;
  icon_url?: string | null;
}

export const emptyTenant: TenantProfile = {
  name: "",
  ccb_number: "",
  tagline: "",
  email: "",
  phone: "",
  website: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  logo_url: null,
  icon_url: null,
};

/** Helper used in letterheads */
export function formatTenantAddress(t: TenantProfile): {
  street: string;
  cityLine: string;
  ccbLine: string;
} {
  const cityLine = [
    [t.address_city, t.address_state].filter(Boolean).join(", "),
    t.address_zip,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    street: t.address_street,
    cityLine,
    ccbLine: t.ccb_number ? `CCB #${t.ccb_number}` : "",
  };
}
