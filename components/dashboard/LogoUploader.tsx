"use client";

import { useRef, useState } from "react";

interface LogoUploaderProps {
  logo: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  /** API path to POST/DELETE — defaults to /api/brand/logo */
  apiPath?: string;
  /** Label shown above the uploader — defaults to "Logo" */
  label?: string;
  /** Helper text shown below the upload button */
  hint?: string;
}

export function LogoUploader({
  logo,
  onUpload,
  onRemove,
  apiPath = "/api/brand/logo",
  label = "Logo",
  hint = "PNG, JPG or SVG. Recommended 512×512px.",
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(apiPath, { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onUpload(url);
      }
    } catch {
      // Could add error UI
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await fetch(apiPath, { method: "DELETE" });
    } catch {
      // best effort
    }
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-start gap-4">
        <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800">
          {logo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={label} className="h-full w-full object-contain p-2" />
              <button
                onClick={handleRemove}
                className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-center text-zinc-500">
              <svg className="mx-auto mb-1 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs">{uploading ? "Uploading..." : "None"}</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id={`upload-${label.toLowerCase().replace(/\s+/g, "-")}`}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : `Upload ${label}`}
          </button>
          <p className="text-xs text-zinc-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
