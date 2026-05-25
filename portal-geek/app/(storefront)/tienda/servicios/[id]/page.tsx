import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServicioDetalleClient } from "@/components/storefront/organisms/ServicioDetalleClient";
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

        <ServicioDetalleClient
          servicioId={servicio.id_servicio}
          nombreServicio={servicio.nombre_servicio}
          descripcionServicio={servicio.descripcion_servicio}
          materialesText={materialesText}
          materiales={materiales}
          variables={variables}
          puedeCotizarEnLinea={puedeCotizarEnLinea}
        />

        {/* ── Info cards ── */}
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
