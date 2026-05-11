import { InfoRow } from "@/components/ui/pedidos/atoms/InfoRow";
import { Section } from "@/components/ui/pedidos/atoms/Section";
import { fmtDate } from "@/components/ui/pedidos/format";
import type { PedidoDetailData } from "@/components/ui/pedidos/types";

export function InfoTab({ data }: { data: PedidoDetailData }) {
  return (
    <div className="space-y-6">
      <Section title="Pedido">
        <InfoRow label="ID" value={`#${data.id_pedido}`} />
        <InfoRow label="Fecha creación" value={fmtDate(data.fecha_creacion)} />
        <InfoRow
          label="Fecha estimada"
          value={data.fecha_estimada ? fmtDate(data.fecha_estimada) : undefined}
        />
        <InfoRow label="Fecha fin" value={data.fecha_fin ? fmtDate(data.fecha_fin) : undefined} />
        <InfoRow label="Sucursal" value={data.sucursal?.nombre_sucursal} />
        <InfoRow label="Requiere factura" value={data.factura ? "Sí" : "No"} />
        <InfoRow label="Facturado" value={data.facturado ? "Sí" : "No"} />
        {data.facturado && <InfoRow label="N° Factura" value={data.numero_factura} />}
        <InfoRow label="Notas" value={data.notas} />
      </Section>

      <Section title="Cliente">
        <InfoRow label="Nombre" value={data.cliente.nombre_cliente} />
        <InfoRow label="Empresa" value={data.cliente.empresa} />
        <InfoRow label="RFC" value={data.cliente.rfc} />
        <InfoRow label="Correo" value={data.cliente.correo_electronico} />
        <InfoRow label="Teléfono" value={data.cliente.numero_telefono} />
      </Section>
    </div>
  );
}
