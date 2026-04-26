import { AnnouncementBar } from "@/components/storefront/molecules/AnnouncementBar";
import { Navbar } from "@/components/storefront/organisms/Navbar";
import { listServicios } from "@/lib/services/servicios";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let categories: { id: number; name: string }[] = [];
  try {
    const { items } = await listServicios(1, 20, true);
    categories = items.map((s) => ({ id: s.id_servicio, name: s.nombre_servicio }));
  } catch {
    // Fallback to empty categories if DB is unavailable
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f9]">
      <Navbar categories={categories} />
      <AnnouncementBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
