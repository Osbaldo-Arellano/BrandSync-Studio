"use client";

import Link from "next/link";

const PRINT_PRODUCTS = [
  {
    href: "/dashboard/print",
    label: "Business Cards",
    description: '3.5" × 2"',
    icon: (
      <svg
        className="h-7 w-7 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/print",
    label: "Envelopes",
    description: '9.5" × 4.125"',
    icon: (
      <svg
        className="h-7 w-7 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/print",
    label: "Stickers",
    description: '3" × 2.5"',
    icon: (
      <svg
        className="h-7 w-7 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6h.008v.008H6V6z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/print",
    label: "Google Review Cards",
    description: '3.5" × 2" double-sided',
    icon: (
      <svg
        className="h-7 w-7 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
  },
];

export function DashboardPrint({ tenantName }: { tenantName: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {greeting}
          {tenantName ? `, ${tenantName}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Quick action */}
      <div className="bg-blue-600 rounded p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-lg">
            Ready to order prints?
          </p>
          <p className="text-blue-100 text-sm mt-0.5">
            It&apos;s easy to print for your branded materials.
          </p>
        </div>
        <Link
          href="/dashboard/print"
          className="shrink-0 rounded bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          Open Print Studio →
        </Link>
      </div>

      {/* Products */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Available Products
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRINT_PRODUCTS.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="bg-white border border-gray-200 rounded p-4 flex flex-col items-center gap-2 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="p-2 rounded bg-blue-50 group-hover:bg-blue-100 transition-colors">
                {p.icon}
              </div>
              <p className="text-sm font-medium text-gray-900">{p.label}</p>
              <p className="text-xs text-gray-400">{p.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Brand settings shortcut */}
      <div className="bg-white border border-gray-200 rounded p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Brand Assets</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Keep your logo, colors, and company info up to date so all prints
            stay current.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="shrink-0 rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          Edit Brand →
        </Link>
      </div>
    </div>
  );
}
