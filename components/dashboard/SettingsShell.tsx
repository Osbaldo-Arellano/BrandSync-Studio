"use client";

import { useState } from "react";
import type { TenantProfile } from "@/types/tenant";
import { TenantSettingsForm } from "./TenantSettingsForm";
import { BrandAssetsSection } from "./BrandAssetsSection";

type Tab = "company" | "brand";

const TABS: { id: Tab; label: string; description: string }[] = [
  {
    id: "company",
    label: "Company Info",
    description: "Name, contact details, and address shown on estimates.",
  },
  {
    id: "brand",
    label: "Brand Assets",
    description: "Logo, icon, social links, and photo gallery for print assets.",
  },
];

export function SettingsShell({ initial }: { initial: TenantProfile }) {
  const [tab, setTab] = useState<Tab>("company");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex min-h-full">

      {/* ── Left settings nav (desktop) ── */}
      <nav className="hidden lg:block w-56 shrink-0 border-r border-gray-200 px-3 pt-10 pb-8">
        <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          Settings
        </p>
        <ul className="space-y-0.5">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setTab(t.id)}
                className={`w-full text-left rounded px-3 py-2.5 transition-colors ${
                  tab === t.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="block text-sm font-medium">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Content area ── */}
      <div className="flex-1 min-w-0 px-6 lg:px-12 py-10">

        {/* Mobile tab pills */}
        <div className="flex gap-1 mb-8 lg:hidden p-1 rounded bg-gray-100 border border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Section heading */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">{active.label}</h1>
          <p className="mt-1 text-sm text-gray-500">{active.description}</p>
        </div>

        {/* Tab content */}
        <div className="max-w-2xl">
          {tab === "company" && <TenantSettingsForm initial={initial} />}
          {tab === "brand" && <BrandAssetsSection />}
        </div>
      </div>
    </div>
  );
}
