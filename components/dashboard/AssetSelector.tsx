import type { AssetTypeConfig } from "@/types/assets";

interface AssetSelectorProps {
  assetTypes: AssetTypeConfig[];
  selected: string;
  onChange: (id: string) => void;
}

export function AssetSelector({ assetTypes, selected, onChange }: AssetSelectorProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor="asset-type"
        className="block text-sm font-medium text-gray-700"
      >
        Select Product Type
      </label>
      <select
        id="asset-type"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
      >
        {assetTypes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  );
}
