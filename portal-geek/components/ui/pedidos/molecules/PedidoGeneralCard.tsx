import { FileText } from "@phosphor-icons/react";

import { FieldRow } from "@/components/ui/cotizaciones/atoms/FieldRow";
import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import { formatDate } from "@/lib/utils/date";
import type { PedidoInfo } from "@/types/pedido";

const STATUS_COLORS: Record<string, string> = {
  Pendiente: "bg-[#F7B9FF]/70 text-[#D83CFF]",
  "En producción": "bg-blue-100 text-blue-700",
  Finalizado: "bg-[#CCFFA5]/60 text-[#26AF00]",
  Entregado: "bg-[#B9EAFF] text-[#0D7794]",
  Cancelado: "bg-[#B1B1B1] text-black",
};

function StatusChip({ estatus }: { estatus: string }) {
  const colorClass = STATUS_COLORS[estatus] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium text-[11px] px-2 py-0.5 ${colorClass}`}
    >
      {estatus}
    </span>
  );
}

interface Props {
  pedido: PedidoInfo;
}

export function PedidoGeneralCard({ pedido }: Props) {
  return (
    <SectionCard title="Datos generales" icon={<FileText size={15} />}>
      <FieldRow label="Estatus" value={<StatusChip estatus={pedido.estatus.descripcion} />} />
      <FieldRow
        label="Fecha creación"
        value={
          <span className="font-normal text-gray-700">{formatDate(pedido.fecha_creacion)}</span>
        }
      />
      <FieldRow
        label="Fecha estimada"
        value={
          <span className="font-normal text-gray-700">{formatDate(pedido.fecha_estimada)}</span>
        }
      />
      <FieldRow
        label="Fecha entrega"
        value={<span className="font-normal text-gray-700">{formatDate(pedido.fecha_fin)}</span>}
      />
      <FieldRow
        label="Sucursal"
        value={
          <span className="font-normal text-gray-700">
            {pedido.sucursal?.nombre_sucursal ?? "—"}
          </span>
        }
      />
      <FieldRow
        label="Estado factura"
        value={
          <span className="font-normal text-gray-700">
            {pedido.estado_factura?.descripcion ?? "—"}
          </span>
        }
      />
      {pedido.factura && (
        <>
          <FieldRow
            label="Facturado"
            value={
              <span className="font-normal text-gray-700">{pedido.facturado ? "Sí" : "No"}</span>
            }
          />
          {pedido.numero_factura && (
            <FieldRow
              label="# Factura"
              value={<span className="font-normal text-gray-700">{pedido.numero_factura}</span>}
            />
          )}
        </>
      )}
      {pedido.nombre_oportunidad && (
        <FieldRow
          label="Oportunidad"
          value={
            <span className="font-normal text-gray-700 text-right max-w-[200px]">
              {pedido.nombre_oportunidad}
            </span>
          }
        />
      )}
      {pedido.notas && (
        <FieldRow
          label="Notas"
          last
          value={
            <span className="font-normal text-gray-700 text-right max-w-[200px] whitespace-pre-wrap">
              {pedido.notas}
            </span>
          }
        />
      )}
    </SectionCard>
  );
}
