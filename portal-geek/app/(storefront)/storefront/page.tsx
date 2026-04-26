import type { Servicios } from "@prisma/client";

import { ServiceCatalogCard } from "@/components/storefront/atoms/ServiceCatalogCard";
import { CTABanner } from "@/components/storefront/molecules/CTABanner";
import { HeroBanner } from "@/components/storefront/organisms/HeroBanner";
import { ServiceGrid } from "@/components/storefront/organisms/ServiceGrid";
import { listServicios } from "@/lib/services/servicios";

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}

async function getCatalogo(query?: string): Promise<Servicios[]> {
  try {
    const { items } = await listServicios(1, 100, true, query);
    return items;
  } catch {
    return [];
  }
}

export default async function StorefrontHome({ searchParams }: Props) {
  const { q } = await searchParams;
  const services = await getCatalogo(q);

  return (
    <>
      <HeroBanner />
      <ServiceGrid services={services} searchQuery={q} />

      {/* Catalog grid — large cards with image + info bar */}
      {services.length > 0 && (
        <section className="bg-[#fff8f9] pb-8 md:pb-[40px]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-[34px]">
            <h2 className="font-bold text-[24px] md:text-[30px] text-[#1e1e1e] mb-[20px]">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.map((s) => (
                <ServiceCatalogCard
                  key={s.id_servicio}
                  id={s.id_servicio}
                  nombre={s.nombre_servicio}
                  descripcion={s.descripcion_servicio}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner />
    </>
  );
}
