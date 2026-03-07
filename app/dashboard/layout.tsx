"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";

const navLinks = [
  { href: "/dashboard",           label: "Dashboard",   exact: true },
  { href: "/dashboard/estimates", label: "Estimates" },
  { href: "/dashboard/invoices",  label: "Invoices" },
  { href: "/dashboard/print",     label: "Order Prints" },
  { href: "/dashboard/settings",  label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-gray-200 bg-white
          transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-gray-200 shrink-0">
          <img src="/BrandSyncStudioLogo.svg" alt="BrandSync Studio" className="h-8 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto pt-3">
          {navLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent pl-[10px]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
