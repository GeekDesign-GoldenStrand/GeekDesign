import type { Servicios } from "@prisma/client";
import type { Metadata } from "next";
import { preload } from "react-dom";

import { ServiceCatalogCard } from "@/components/storefront/atoms/ServiceCatalogCard";
import { AnnouncementBar } from "@/components/storefront/molecules/AnnouncementBar";
import { CTABanner } from "@/components/storefront/molecules/CTABanner";
import { HeroBanner } from "@/components/storefront/organisms/HeroBanner";
import { ServiceGrid } from "@/components/storefront/organisms/ServiceGrid";
import { listServicios } from "@/lib/services/servicios";
import { getServiceImageUrlsResolved } from "@/lib/utils/images";

export const metadata: Metadata = { title: "Tienda" };

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
  preload("/storefront/hero-bg.jpg", { as: "image", fetchPriority: "high" });
  const { q } = await searchParams;
  const services = await getCatalogo(q);

  // Resolve image URLs to direct GCS reads at render time. The HTML emitted
  // by ISR (revalidate = 60s) embeds presigned URLs the browser fetches
  // straight from storage.googleapis.com — no /api/images proxy hop, no
  // App Engine cold-start cost per image. See lib/utils/images.ts.
  const visibleServices = services.slice(0, 6);
  const resolvedImages = await Promise.all(
    visibleServices.map((s) => getServiceImageUrlsResolved(s.imagen_url))
  );

  return (
    <>
      <AnnouncementBar />
      <HeroBanner />
      <ServiceGrid services={services} searchQuery={q} />

      {/* Catalog grid — large cards with image + info bar */}
      {services.length > 0 && (
        <section className="bg-[#fff8f9] pb-8 md:pb-[40px]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-[34px]">
            <h2 className="font-bold text-[24px] md:text-[30px] text-[#1e1e1e] mb-[20px]">
              Catálogo de Servicios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleServices.map((s, i) => (
                <ServiceCatalogCard
                  key={s.id_servicio}
                  id={s.id_servicio}
                  nombre={s.nombre_servicio}
                  descripcion={s.descripcion_servicio}
                  imagenUrl={resolvedImages[i][0] || null}
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
