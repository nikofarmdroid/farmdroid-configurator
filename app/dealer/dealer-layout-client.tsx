"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Plus, Tractor } from "lucide-react";
import { useDealer } from "@/contexts/DealerContext";

export function DealerLayoutInner({ children }: { children: React.ReactNode }) {
  const { dealer, isLoading, isAuthenticated, logout } = useDealer();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/dealer/login") {
      router.push("/dealer/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading...</div>
      </div>
    );
  }

  // Don't show dealer nav on the login page
  if (pathname === "/dealer/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Nav */}
            <div className="flex items-center gap-6">
              <Link
                href="/dealer/dashboard"
                className="flex items-center gap-2 font-semibold text-stone-900 hover:text-emerald-700 transition-colors"
              >
                <Tractor className="w-5 h-5 text-emerald-600" />
                <span className="hidden sm:inline">FarmDroid</span>
                <span className="text-stone-400">Dealer</span>
              </Link>

              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dealer/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/dealer/dashboard"
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/en/configurator?mode=partner"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.includes("configurator")
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  New Quote
                </Link>
              </nav>
            </div>

            {/* Right: User info + Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-stone-900">
                  {dealer?.name}
                </p>
                <p className="text-xs text-stone-500">{dealer?.companyName}</p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/dealer/login");
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav bar */}
      <nav className="sm:hidden bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <Link
          href="/dealer/dashboard"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
            pathname === "/dealer/dashboard"
              ? "bg-stone-100 text-stone-900"
              : "text-stone-600"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/en/configurator?mode=partner"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-stone-600 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
