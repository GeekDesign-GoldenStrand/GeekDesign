import { Sidebar } from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Persistent Responsive Sidebar */}
        <Sidebar />

        <main className="flex-1 pl-[64px] md:pl-[102px] bg-white min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
