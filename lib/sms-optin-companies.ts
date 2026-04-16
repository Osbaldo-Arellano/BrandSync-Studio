export interface SmsOptinCompany {
  /** URL slug — must match the [company] segment exactly */
  slug: string;
  name: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  /** Shown in the trade/role dropdown. Empty array hides the field. */
  roles: string[];
  /** Optional absolute URL to company logo */
  logoUrl?: string;
}

const companies: SmsOptinCompany[] = [
  {
    slug: "blue-life-labor",
    name: "Blue Life Labor",
    tagline: "Connecting skilled workers with quality opportunities",
    location: "Portland, OR",
    phone: "(503) 555-0200",
    email: "info@bluelifelabor.com",
    roles: [
      "General laborer",
      "Skilled tradesperson",
      "Foreman / lead",
      "Equipment operator",
      "Driver / logistics",
      "Other",
    ],
  },
];

export function getCompany(slug: string): SmsOptinCompany | null {
  return companies.find((c) => c.slug === slug) ?? null;
}
