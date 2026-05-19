import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="px-8 py-8">
        <p className="text-[#888]">Bienvenido al panel de administración.</p>
      </div>
    </>
  );
}
