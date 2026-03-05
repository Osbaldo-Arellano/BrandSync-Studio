"use client";

import { useState, useEffect } from "react";
import { defaultBrand } from "@/types/brand";
import type { BrandState } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { ASSET_TYPES } from "@/types/assets";
import {
  AssetSelector,
  AssetTemplateGrid,
  AssetEditor,
} from "@/components/dashboard";

export default function PrintPage() {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [loading, setLoading] = useState(true);

  const [selectedAssetId, setSelectedAssetId] = useState(ASSET_TYPES[0].id);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<AssetTypeConfig>(ASSET_TYPES[0]);
  const [editorTemplate, setEditorTemplate] = useState<AssetTemplate>(ASSET_TYPES[0].templates[0]);

  const selectedAsset = ASSET_TYPES.find((a) => a.id === selectedAssetId) ?? ASSET_TYPES[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/brand").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tenant").then((r) => (r.ok ? r.json() : null)),
    ]).then(([brandData, tenantData]) => {
      setBrand((prev) => {
        let next = { ...prev };

        // Logo, icon, about_us, social_links — from brands table
        if (brandData) {
          next = {
            ...next,
            logo:     brandData.logo_url     ?? prev.logo,
            icon:     brandData.icon_url     ?? prev.icon,
            about_us: brandData.about_us     ?? prev.about_us,
            social_links: (brandData.social_links ?? prev.social_links).map(
              (l: { platform?: string; url?: string; handle?: string }) => ({
                platform: l.platform ?? "",
                url:      l.url      ?? "",
                handle:   l.handle   ?? "",
              })
            ),
          };
        }

        // Name, tagline, phone, email, website, address — from tenants table (authoritative)
        if (tenantData) {
          next = {
            ...next,
            name:    tenantData.name    || brandData?.name    || prev.name,
            tagline: tenantData.tagline || brandData?.tagline || prev.tagline,
            email:   tenantData.email   || brandData?.email   || prev.email,
            phone:   tenantData.phone   || brandData?.phone   || prev.phone,
            website: tenantData.website || brandData?.website_url || prev.website,
            address: {
              street:  tenantData.address_street || brandData?.address?.street  || prev.address.street,
              city:    tenantData.address_city   || brandData?.address?.city    || prev.address.city,
              state:   tenantData.address_state  || brandData?.address?.state   || prev.address.state,
              zip:     tenantData.address_zip    || brandData?.address?.zip     || prev.address.zip,
              country: brandData?.address?.country || prev.address.country,
            },
          };
        }

        return next;
      });
    }).finally(() => setLoading(false));
  }, []);

  const openEditor = (asset: AssetTypeConfig, template: AssetTemplate) => {
    setEditorAsset(asset);
    setEditorTemplate(template);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Print Assets</h1>
          <p className="mt-1 text-gray-500">Generate print-ready assets for your brand</p>
        </div>

        <div className="space-y-4">
          <AssetSelector selected={selectedAssetId} onChange={setSelectedAssetId} />
          <AssetTemplateGrid
            asset={selectedAsset}
            onSelect={(tpl) => openEditor(selectedAsset, tpl)}
          />
        </div>
      </main>

      <AssetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        asset={editorAsset}
        template={editorTemplate}
        brand={brand}
      />
    </>
  );
}
