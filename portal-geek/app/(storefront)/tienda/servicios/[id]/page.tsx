import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormulaVariablesForm } from "@/components/storefront/organisms/FormulaVariablesForm";
import { getServicioWithDetails } from "@/lib/services/servicios";

export const metadata: Metadata = { title: "Servicio" };

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
  // KIKW12 review #5: servicio may not have an Activa formula yet.
  // Render the same product info, but swap the variables form for a contact CTA.
  const formula = servicio.formulas[0];
  const puedeCotizarEnLinea = formula !== undefined;

  const materiales = servicio.servicioMateriales.map((sm) => ({
    id_material: sm.id_material,
    nombre_material: sm.material.nombre_material,
  }));

  const variables = formula
    ? formula.variables.map((v) => ({
        id_variable: v.id_variable,
        nombre_variable: v.nombre_variable,
        etiqueta: v.etiqueta,
        unidad: v.unidad,
        valor_default: v.valor_default !== null ? Number(v.valor_default) : 0,
        editable_por_cliente: v.editable_por_cliente,
      }))
    : [];

  const materialesText = materiales.map((m) => m.nombre_material).join(", ");

  return (
    <div className="bg-[#fff8f9] min-h-[calc(100vh-106px)]">
      <div className="max-w-[1280px] mx-auto px-[42px] py-[32px]">
        <p className="text-[14px] text-[#666] mb-[20px]">Detalle del Servicio</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px]">
          {/* ── LEFT: image gallery + upload placeholder ── */}
          <div className="flex flex-col gap-[16px]">
            <div className="bg-[#ffd9e2] rounded-[14px] aspect-square flex items-center justify-center">
              <span className="font-medium text-[16px] text-[#1e1e1e]">
                Imagen principal del producto
              </span>
            </div>

            <div className="grid grid-cols-3 gap-[12px]">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#ffd9e2] rounded-[10px] aspect-square flex items-center justify-center"
                />
              ))}
            </div>

            <div className="border-2 border-dashed border-[#8b434a] rounded-[10px] py-[28px] text-center bg-[#fff8f9]">
              <p className="font-semibold text-[15px] text-[#1e1e1e]">Sube tu diseño</p>
              <p className="text-[12px] text-[#666] mt-[4px]">
                Arrastra tu archivo aquí o selecciónalo desde tu equipo.
              </p>
              <p className="text-[12px] text-[#666]">Formatos sugeridos: SVG, PNG, JPG.</p>
            </div>
          </div>

          {/* ── RIGHT: header + price + form ── */}
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[8px]">
              <h1 className="font-bold text-[32px] leading-tight text-[#1e1e1e]">
                {servicio.nombre_servicio}
              </h1>
              {servicio.descripcion_servicio && (
                <p className="text-[14px] text-[#1e1e1e] leading-normal">
                  {servicio.descripcion_servicio}
                </p>
              )}
              {materialesText && (
                <p className="text-[14px] text-[#1e1e1e] mt-[4px]">
                  <span className="font-semibold">Materiales disponibles:</span> {materialesText}.
                </p>
              )}
            </div>

            {puedeCotizarEnLinea ? (
              <FormulaVariablesForm
                servicioId={servicio.id_servicio}
                nombreServicio={servicio.nombre_servicio}
                materiales={materiales}
                variables={variables}
              />
            ) : (
              <div className="bg-white border border-[#c2c0c0] rounded-[10px] p-[24px] flex flex-col gap-[12px]">
                <h2 className="font-bold text-[18px] text-[#1e1e1e]">
                  Cotización en línea no disponible
                </h2>
                <p className="text-[14px] text-[#1e1e1e] leading-relaxed">
                  Este servicio requiere una cotización personalizada. Contáctanos y un asesor
                  preparará una propuesta para tu proyecto.
                </p>
                <Link
                  href="/tienda/cotizacion"
                  className="self-start bg-[#8b434a] text-white font-semibold text-[14px] rounded-[10px] px-[20px] h-[44px] flex items-center justify-center hover:bg-[#7a3a41] transition-colors"
                >
                  Solicitar cotización personalizada
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM: info cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mt-[32px]">
          <div className="bg-white border border-[#c2c0c0] rounded-[10px] p-[24px]">
            <h2 className="font-bold text-[18px] text-[#1e1e1e] mb-[12px]">
              Detalles del producto
            </h2>
            <p className="text-[14px] text-[#1e1e1e] leading-relaxed">
              Este producto está pensado para personalización rápida y producción precisa. Puedes
              adaptar medidas, material y acabado según las necesidades de tu proyecto.
            </p>
          </div>
          <div className="bg-white border border-[#c2c0c0] rounded-[10px] p-[24px]">
            <h2 className="font-bold text-[18px] text-[#1e1e1e] mb-[12px]">Recomendaciones</h2>
            <ul className="text-[14px] text-[#1e1e1e] leading-relaxed list-disc pl-[20px] flex flex-col gap-[4px]">
              <li>Sube archivos en buena resolución.</li>
              <li>Verifica dimensiones antes de confirmar.</li>
              <li>Para pedidos especiales, agrega notas claras.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
