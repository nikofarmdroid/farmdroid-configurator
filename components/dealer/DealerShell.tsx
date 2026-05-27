"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dealer/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dealer/quotes", label: "Quotes", icon: FileText },
  { href: "/dealer/customers", label: "Customers", icon: Users },
  { href: "/dealer/profile", label: "Profile", icon: Settings },
];

export function DealerShell({ children, dealerName }: { children: React.ReactNode; dealerName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicAuthRoute = pathname === "/dealer/login" || pathname === "/dealer/register";

  async function logout() {
    await fetch("/api/dealer/auth/logout", { method: "POST" });
    router.push("/dealer/login");
    router.refresh();
  }

  if (publicAuthRoute) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="min-h-screen bg-stone-100 md:flex">
      <aside className="bg-stone-950 text-white md:min-h-screen md:w-64">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dealer/dashboard" className="font-semibold">FarmDroid Dealer</Link>
          <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 md:hidden" onClick={logout} aria-label="Logout">
            <LogOut />
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:block md:space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-300 hover:bg-white/10 hover:text-white",
                  active && "bg-[#5AB147] text-white"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 p-4 md:block">
          <p className="mb-3 truncate text-sm text-stone-300">{dealerName}</p>
          <Button variant="ghost" className="w-full justify-start text-stone-300 hover:bg-white/10 hover:text-white" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

