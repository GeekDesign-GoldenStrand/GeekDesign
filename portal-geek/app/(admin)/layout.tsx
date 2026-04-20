import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 pl-25.5">{children}</div>
    </div>
  );
}
