import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";

interface AssetTemplateGridProps {
  asset: AssetTypeConfig;
  onSelect: (template: AssetTemplate) => void;
}

export function AssetTemplateGrid({ asset, onSelect }: AssetTemplateGridProps) {
  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
          </svg>
          {asset.label}
        </h2>
        <p className="text-sm text-gray-500">{asset.description}</p>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          {asset.templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="group text-left"
            >
              <div
                className="overflow-hidden rounded border-2 border-gray-200 bg-white transition-colors hover:border-blue-500"
                style={{ aspectRatio: asset.aspect }}
              >
                <TemplateThumbnail assetId={asset.id} templateId={tpl.id} />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                {tpl.name}
              </p>
              <p className="text-xs text-gray-500">{tpl.description}</p>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-center text-sm text-gray-500">
            Select a template to customize
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini skeleton thumbnails per asset/template
// ---------------------------------------------------------------------------

function TemplateThumbnail({ assetId, templateId }: { assetId: string; templateId: string }) {
  const isDark = templateId.startsWith("dark");
  const isEs = templateId.endsWith("-es");

  // Derive a base key (strip -es suffix) to reuse the same skeleton shape
  const baseKey = `${assetId}::${isDark ? "dark" : "light"}`;

  // Small "ES" badge overlay for Spanish variants
  const esBadge = isEs ? (
    <span className={`absolute bottom-1 right-1 rounded px-1 text-[8px] font-bold ${isDark ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"}`}>
      ES
    </span>
  ) : null;

  switch (baseKey) {
    // Business cards
    case "business-card::light":
      return (
        <div className="relative flex h-full w-full flex-col justify-between bg-white p-3">
          <div className="flex items-start justify-between">
            <div className="h-3 w-6 rounded bg-gray-300" />
            <div className="h-0.5 w-4 bg-blue-500" />
          </div>
          <div>
            <div className="mb-1 h-2 w-16 rounded bg-gray-700" />
            <div className="mb-2 h-1.5 w-12 rounded bg-gray-400" />
            <div className="mb-0.5 h-1 w-20 rounded bg-gray-400" />
            <div className="h-1 w-14 rounded bg-gray-400" />
          </div>
          {esBadge}
        </div>
      );
    case "business-card::dark":
      return (
        <div className="relative flex h-full w-full flex-col justify-between bg-zinc-950 p-3">
          <div className="flex items-start justify-between">
            <div className="h-3 w-6 rounded bg-zinc-600" />
            <div className="h-0.5 w-4 bg-blue-500" />
          </div>
          <div>
            <div className="mb-1 h-2 w-16 rounded bg-zinc-300" />
            <div className="mb-2 h-1.5 w-12 rounded bg-zinc-500" />
            <div className="mb-0.5 h-1 w-20 rounded bg-zinc-600" />
            <div className="h-1 w-14 rounded bg-zinc-600" />
          </div>
          {esBadge}
        </div>
      );

    // Envelopes
    case "envelope::light":
      return (
        <div className="relative flex h-full w-full bg-white p-3">
          <div className="absolute left-3 top-3">
            <div className="mb-1 h-1.5 w-10 rounded bg-gray-400" />
            <div className="h-1 w-16 rounded bg-gray-300" />
          </div>
          <div className="m-auto text-center">
            <div className="mx-auto mb-1 h-2 w-14 rounded bg-gray-700" />
            <div className="mx-auto h-1 w-20 rounded bg-gray-400" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 h-px bg-gray-300" />
          {esBadge}
        </div>
      );
    case "envelope::dark":
      return (
        <div className="relative flex h-full w-full bg-zinc-950 p-3">
          <div className="absolute left-3 top-3">
            <div className="mb-1 h-1.5 w-10 rounded bg-zinc-500" />
            <div className="h-1 w-16 rounded bg-zinc-600" />
          </div>
          <div className="m-auto text-center">
            <div className="mx-auto mb-1 h-2 w-14 rounded bg-zinc-300" />
            <div className="mx-auto h-1 w-20 rounded bg-zinc-500" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 h-px bg-zinc-700" />
          {esBadge}
        </div>
      );

    // Stickers
    case "sticker::light":
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded bg-white border border-gray-200">
          <div className="h-5 w-5 rounded bg-gray-300" />
          <div className="h-2.5 w-14 rounded bg-gray-300" />
          {esBadge}
        </div>
      );
    case "sticker::dark":
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-5 w-5 rounded bg-zinc-600" />
          <div className="h-2.5 w-14 rounded bg-zinc-600" />
          {esBadge}
        </div>
      );

    default:
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-3 w-12 rounded bg-gray-300" />
        </div>
      );
  }
}
