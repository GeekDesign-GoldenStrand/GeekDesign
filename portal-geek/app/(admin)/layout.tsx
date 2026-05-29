import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <AdminShell role={session.role}>{children}</AdminShell>
    </div>
  );
}
