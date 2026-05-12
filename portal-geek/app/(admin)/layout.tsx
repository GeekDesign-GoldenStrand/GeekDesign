import { Sidebar } from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white overflow-x-auto">
      <div className="flex min-w-max">
        <Sidebar />

        <main className="flex-1 pl-25.5 bg-white min-h-screen">{children}</main>
      </div>
    </div>
  );
}
