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
import type { AssetTemplateRow } from "@/app/api/asset-templates/route";

type TemplateMap = Record<string, Record<string, AssetTemplateRow>>;

export default function PrintPage() {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [templateMap, setTemplateMap] = useState<TemplateMap>({});

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<AssetTypeConfig>(ASSET_TYPES[0]);
  const [editorTemplate, setEditorTemplate] = useState<AssetTemplate>(ASSET_TYPES[0].templates[0]);
  const [editorTemplateBody, setEditorTemplateBody] = useState("");
  const [editorType, setEditorType] = useState<"template" | "pdf">("template");
  const [editorPdfUrl, setEditorPdfUrl] = useState<string | null>(null);

  const availableAssets: AssetTypeConfig[] = ASSET_TYPES
    .filter((a) => templateMap[a.id])
    .map((a) => ({
      ...a,
      templates: a.templates.filter((t) => templateMap[a.id]?.[t.id]),
    }));

  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  useEffect(() => {
    if (availableAssets.length > 0 && !availableAssets.find((a) => a.id === selectedAssetId)) {
      setSelectedAssetId(availableAssets[0].id);
    }
  }, [availableAssets, selectedAssetId]);

  const selectedAsset =
    availableAssets.find((a) => a.id === selectedAssetId) ?? availableAssets[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/brand").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tenant").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/asset-templates").then((r) =>
        r.ok ? (r.json() as Promise<AssetTemplateRow[]>) : Promise.resolve([])
      ),
    ]).then(([brandData, tenantData, templateRows]) => {
      setBrand((prev) => {
        let next = { ...prev };

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

      const map: TemplateMap = {};
      for (const row of (templateRows as AssetTemplateRow[])) {
        if (!map[row.asset_type_id]) map[row.asset_type_id] = {};
        map[row.asset_type_id][row.template_id] = row;
      }
      setTemplateMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const openEditor = (asset: AssetTypeConfig, template: AssetTemplate) => {
    const row = templateMap[asset.id]?.[template.id];
    setEditorAsset(asset);
    setEditorTemplate(template);
    setEditorTemplateBody(row?.html_body ?? "");
    setEditorType(row?.type ?? "template");
    setEditorPdfUrl(row?.pdf_url ?? null);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (availableAssets.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Print Assets</h1>
          <p className="mt-1 text-gray-500">No print templates configured for your account.</p>
        </div>
      </main>
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
          <AssetSelector
            assetTypes={availableAssets}
            selected={selectedAssetId}
            onChange={setSelectedAssetId}
          />
          {selectedAsset && (
            <AssetTemplateGrid
              asset={selectedAsset}
              onSelect={(tpl) => openEditor(selectedAsset, tpl)}
            />
          )}
        </div>
      </main>

      <AssetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        asset={editorAsset}
        template={editorTemplate}
        type={editorType}
        templateBody={editorTemplateBody}
        pdfUrl={editorPdfUrl}
        brand={brand}
      />
    </>
  );
}
