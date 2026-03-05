"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface DashboardHeaderProps {
  companyName?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ companyName, onMenuClick }: DashboardHeaderProps) {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {companyName && <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">{companyName}</span>}
        </div>
        {email && (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-gray-500 truncate max-w-[180px]">{email}</span>
            <button
              onClick={handleLogout}
              className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
