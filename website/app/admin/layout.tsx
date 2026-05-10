import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin · Lagan" } };

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar email={user.email ?? ""} />
      <main className="ml-60 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
