export interface BrandAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

export interface BrandState {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  logo: string | null;  // wide/horizontal logo
  icon: string | null;  // square brand mark
  about_us: string;
  address: BrandAddress;
  social_links: SocialLink[];
}

export const defaultBrand: BrandState = {
  name: "",
  tagline: "",
  email: "",
  phone: "",
  website: "",
  logo: null,
  icon: null,
  about_us: "",
  address: { street: "", city: "", state: "", zip: "", country: "" },
  social_links: [],
};
