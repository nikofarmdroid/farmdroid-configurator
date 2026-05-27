import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth-server";
import { AdminNav } from "@/components/admin/AdminNav";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Admin - FarmDroid Configurator",
  description: "Admin dashboard for FarmDroid Configurator",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated and is an admin
  let adminUser = await getAdminUser();

  // In local backend mode, provide a mock admin user
  if (!adminUser && process.env.USE_LOCAL_BACKEND === "true") {
    adminUser = {
      auth: { email: "dev@farmdroid.local" } as any,
      admin: {
        id: "dev-admin",
        email: "dev@farmdroid.local",
        role: "super_admin",
        name: "Dev Admin",
        notify_on_new_config: true,
      } as any,
    };
  }

  // Get the current path to determine if we're on the login page
  // The middleware handles actual protection, but we need to know
  // whether to show the nav or not

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-stone-100 min-h-screen">
        {adminUser ? (
          <div className="flex min-h-screen">
            <AdminNav
              userEmail={adminUser.auth.email || ""}
              userRole={adminUser.admin.role}
            />
            <main className="flex-1 p-8">{children}</main>
          </div>
        ) : (
          // Login page - no navigation
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
