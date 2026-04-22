import { AdminHeader } from "@/components/admin/admin-header";

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
