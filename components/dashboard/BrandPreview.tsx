import type { BrandState } from "@/types/brand";

interface BrandPreviewProps {
  brand: BrandState;
}

export function BrandPreview({ brand }: BrandPreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Brand Preview</h2>
        <p className="text-sm text-zinc-400">See how your brand looks</p>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="Logo preview" className="h-16 w-16 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-950">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{brand.name || "Company Name"}</h3>
            <p className="text-sm text-zinc-400">{brand.tagline || "Your tagline here"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
