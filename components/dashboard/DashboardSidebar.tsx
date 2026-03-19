"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";

const topLinks = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/customers", label: "Customers" },
];

const bottomLinks = [
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/print", label: "Order Prints" },
  { href: "/dashboard/settings", label: "Settings" },
];

const jobsChildren = [{ href: "/dashboard/estimates", label: "Estimates" }];

export function DashboardSidebar({
  logoUrl,
  children,
}: {
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const jobsActive =
    pathname.startsWith("/dashboard/jobs") ||
    pathname.startsWith("/dashboard/estimates");
  const [jobsExpanded, setJobsExpanded] = useState(jobsActive);

  function NavLink({
    href,
    label,
    exact,
  }: {
    href: string;
    label: string;
    exact?: boolean;
  }) {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center rounded px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent pl-[10px]"
        }`}
      >
        {label}
      </Link>
    );
  }

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
        <div className="flex h-30 items-center justify-between px-5 border-b border-gray-200 shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Company logo"
              className="h-20 w-auto object-contain max-w-[140px]"
            />
          ) : (
            <img
              src="/BrandSyncStudioLogo.svg"
              alt="BrandSync Studio"
              className="h-100 w-auto"
            />
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto pt-3">
          {topLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}

          {/* Jobs — expandable */}
          <div>
            <div className="flex items-center">
              <Link
                href="/dashboard/jobs"
                onClick={() => setSidebarOpen(false)}
                className={`flex-1 flex items-center rounded-l px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard/jobs")
                    ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent pl-[10px]"
                }`}
              >
                Jobs
              </Link>
              <button
                onClick={() => setJobsExpanded((v) => !v)}
                className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={jobsExpanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${jobsExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {jobsExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                {jobsChildren.map((child) => {
                  const active = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {bottomLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
