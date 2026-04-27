import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Servicios } from "@prisma/client";

import { ServiceCarousel } from "./ServiceCarousel";

interface ServiceGridProps {
  services: Servicios[];
  searchQuery?: string;
}

const PLACEHOLDER_LABELS = [
  "Servicio1",
  "Servicio2",
  "Servicio3",
  "Servicio4",
  "Servicio5",
  "Servicio6",
];

export function ServiceGrid({ services, searchQuery }: ServiceGridProps) {
  const hasResults = services.length > 0;
  const isSearching = Boolean(searchQuery?.trim());

  return (
    <section className="bg-[#fff8f9] pt-5 md:pt-[27px] pb-8 md:pb-[40px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-[34px]">
        <h2 className="font-bold text-[30px] text-[#1e1e1e] mb-[15px]">
          {isSearching ? `Resultados para "${searchQuery}"` : "Nuestros Servicios"}
        </h2>

        {hasResults ? (
          <ServiceCarousel services={services} />
        ) : isSearching ? (
          /* ── No search results ── */
          <div className="py-[60px] flex flex-col items-center gap-4">
            <p className="text-[#1e1e1e] text-[20px] font-medium">
              No encontramos servicios que coincidan con tu búsqueda.
            </p>
            <a
              href="/storefront"
              className="text-[#df2646] text-[16.742px] font-semibold hover:underline transition-all"
            >
              Ver todos los servicios
            </a>
          </div>
        ) : (
          /* ── Empty catalog: placeholder cards ── */
          <div className="relative">
            <div className="flex overflow-x-auto scrollbar-hide pb-1 gap-3 md:gap-5">
              {PLACEHOLDER_LABELS.map((label) => (
                <div
                  key={label}
                  className="shrink-0 cursor-pointer group flex flex-col items-center"
                >
                  <div className="w-[178px] h-[178px] bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] group-hover:shadow-[0px_8px_24px_0px_rgba(0,0,0,0.18)] group-hover:scale-[1.03] transition-all duration-200" />
                  <p className="mt-[8px] w-[178px] text-[15px] font-medium text-[#1e1e1e] text-center group-hover:text-[#df2646] transition-colors duration-200">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <button className="absolute right-0 top-[100px] w-[60px] h-[60px] bg-[#fffcfc] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:shadow-[0px_6px_16px_0px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-200">
              <CaretRight size={24} weight="light" className="text-[#1e1e1e]" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
