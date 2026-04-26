import Link from "next/link";
import { notFound } from "next/navigation";

import { getServicioWithDetails, listServicios } from "@/lib/services/servicios";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServicioDetallePage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) notFound();

  let result: Awaited<ReturnType<typeof getServicioWithDetails>>;
  try {
    result = await getServicioWithDetails(numId);
  } catch {
    notFound();
  }

  const { servicio, precioBase } = result;

  const materiales = [...new Set(servicio.opciones.map((o) => o.material.nombre_material))];

  const { items: otrosServicios } = await listServicios(1, 5, true);
  const otros = otrosServicios.filter((s) => s.id_servicio !== numId).slice(0, 2);

  return (
    <div className="bg-[#fff8f9]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-[34px] py-8 md:py-[40px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[60px]">
          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5 lg:w-[600px] lg:shrink-0">
            <h1 className="font-bold text-[24px] md:text-[30px] text-[#1e1e1e] leading-tight">
              {servicio.nombre_servicio}
            </h1>

            {servicio.descripcion_servicio && (
              <p className="text-[#1e1e1e] text-[16px] leading-relaxed">
                {servicio.descripcion_servicio}
              </p>
            )}

            {materiales.length > 0 && (
              <p className="text-[16px] text-[#1e1e1e]">
                <span className="font-semibold">Materiales disponibles:</span>{" "}
                {materiales.join(", ")}.
              </p>
            )}

            {precioBase !== null && (
              <p className="text-[16px] text-[#1e1e1e]">
                <span className="font-semibold">Desde: </span>
                <span className="text-[#df2646] font-semibold">${precioBase.toFixed(2)}</span>
              </p>
            )}

            <Link
              href={`/cotizacion?servicio=${servicio.id_servicio}`}
              className="mt-2 bg-[#8b434a] rounded-[10px] h-[63px] flex items-center justify-center text-white font-semibold text-[18px] md:text-[20px] tracking-[1px] hover:bg-[#7a3a41] active:scale-[0.99] transition-all duration-150"
            >
              ¡Quiero contratar este servicio!
            </Link>

            {/* Otros Servicios */}
            {otros.length > 0 && (
              <div className="mt-2">
                <h2 className="font-bold text-[24px] md:text-[30px] text-[#1e1e1e] mb-4">
                  Otros Servicios
                </h2>
                <div className="flex flex-col gap-4">
                  {otros.map((s) => (
                    <Link
                      key={s.id_servicio}
                      href={`/servicios/${s.id_servicio}`}
                      className="block group"
                    >
                      <div className="relative w-full h-[160px] md:h-[224px] bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden group-hover:shadow-[0px_8px_24px_0px_rgba(0,0,0,0.18)] group-hover:scale-[1.02] transition-all duration-200">
                        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/20 to-transparent">
                          <p className="font-bold text-[16px] text-[#1e1e1e]">
                            {s.nombre_servicio}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — image gallery ── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Main large image */}
            <div className="w-full aspect-[645/463] bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden flex items-end px-4 pb-3">
              <span className="font-bold text-[16px] text-[#1e1e1e]">
                {servicio.nombre_servicio}
              </span>
            </div>

            {/* Two example images */}
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="w-full aspect-[316/351] bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden flex items-end px-3 pb-3"
                >
                  <span className="font-bold text-[14px] text-[#1e1e1e]">Ejemplo de Servicio</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
