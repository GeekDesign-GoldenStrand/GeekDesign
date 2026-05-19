import { redirect } from "next/navigation";

import { Sidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar role={session.role} />
        <main className="flex-1 pl-[64px] md:pl-[102px] bg-white min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
