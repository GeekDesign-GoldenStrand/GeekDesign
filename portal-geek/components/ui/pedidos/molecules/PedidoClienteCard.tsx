import { User } from "@phosphor-icons/react";

import { FieldRow } from "@/components/ui/cotizaciones/atoms/FieldRow";
import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import type { PedidoInfo } from "@/types/pedido";

interface Props {
  cliente: PedidoInfo["cliente"];
}

export function PedidoClienteCard({ cliente }: Props) {
  return (
    <SectionCard title="Cliente" icon={<User size={15} />}>
      <FieldRow label="Nombre" value={cliente.nombre_cliente} />
      {cliente.empresa && (
        <FieldRow
          label="Empresa"
          value={<span className="font-normal text-gray-500">{cliente.empresa}</span>}
        />
      )}
      <FieldRow
        label="Correo"
        value={<span className="font-normal text-gray-500">{cliente.correo_electronico}</span>}
      />
      <FieldRow
        label="Teléfono"
        value={<span className="font-normal text-gray-500">{cliente.numero_telefono}</span>}
      />
      <FieldRow
        label="RFC"
        value={<span className="font-normal text-gray-500">{cliente.rfc ?? "—"}</span>}
        last
      />
    </SectionCard>
  );
}
