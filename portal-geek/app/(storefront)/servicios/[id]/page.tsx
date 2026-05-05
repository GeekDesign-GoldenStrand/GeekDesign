import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/components/storefront/molecules/AddToCartForm";
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

  const { servicio } = result;

  const materiales = [...new Set(servicio.opciones.map((o) => o.material.nombre_material))];

  const { items: otrosServicios } = await listServicios(1, 5, true);
  const otros = otrosServicios.filter((s) => s.id_servicio !== numId).slice(0, 2);

  return (
    <div className="bg-[#fff8f9] lg:h-[calc(100vh-106px)] lg:overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[42px] py-[25px] h-full">
        <div className="flex flex-col lg:flex-row gap-[40px] h-full">
          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col lg:w-[601px] lg:shrink-0 h-full">
            <h1 className="font-bold text-[30px] text-[#1e1e1e] leading-tight">
              {servicio.nombre_servicio}
            </h1>

            {servicio.descripcion_servicio && (
              <p className="mt-[20px] text-[#1e1e1e] text-[16.742px] leading-normal">
                {servicio.descripcion_servicio}
              </p>
            )}

            {materiales.length > 0 && (
              <p className="mt-[16px] text-[16.742px] text-[#1e1e1e]">
                <span className="font-semibold">Materiales disponibles:</span>{" "}
                {materiales.join(", ")}.
              </p>
            )}

            <AddToCartForm
              servicioId={servicio.id_servicio}
              nombreServicio={servicio.nombre_servicio}
              opciones={servicio.opciones.map((o) => ({
                id_opcion: o.id_opcion,
                nombre_opcion: o.nombre_opcion,
                valores: o.valores.map((v) => ({
                  id_valor: v.id_valor,
                  valor: v.valor,
                  es_default: v.es_default,
                  matriz: v.matriz.map((m) => ({
                    cantidad_minima: m.cantidad_minima,
                    cantidad_maxima: m.cantidad_maxima ?? null,
                    precio_unitario: Number(m.precio_unitario),
                  })),
                })),
              }))}
            />

            {/* Otros Servicios */}
            {otros.length > 0 && (
              <div className="mt-[30px] flex-1 flex flex-col min-h-0">
                <h2 className="font-bold text-[30px] text-[#1e1e1e] mb-[16px] shrink-0">
                  Otros Servicios
                </h2>
                <div className="flex flex-col gap-[11px] flex-1 min-h-0">
                  {otros.map((s) => (
                    <Link
                      key={s.id_servicio}
                      href={`/servicios/${s.id_servicio}`}
                      className="block group flex-1 min-h-0"
                    >
                      <div className="relative w-full h-full bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden group-hover:shadow-[0px_8px_24px_0px_rgba(0,0,0,0.18)] group-hover:scale-[1.01] transition-all duration-200">
                        <p className="absolute bottom-[13px] left-[17px] font-bold text-[16.742px] text-[#1e1e1e]">
                          {s.nombre_servicio}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — image gallery (56.8% main, 43.2% bottom = Figma ratio 463:351) ── */}
          <div className="flex-1 flex flex-col gap-[12px] min-w-0 h-full">
            <div className="w-full flex-[463] bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center min-h-0">
              <span className="font-bold text-[16.742px] text-[#1e1e1e]">Ejemplo de Servicio</span>
            </div>

            <div className="grid grid-cols-2 gap-[13px] flex-[351] min-h-0">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="w-full h-full bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center"
                >
                  <span className="font-bold text-[16.742px] text-[#1e1e1e]">
                    Ejemplo de Servicio
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
