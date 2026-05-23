import { User } from "@phosphor-icons/react";
import React from "react";

import type { Cliente } from "@/lib/utils/cotizacion";

import { ClientBadge } from "../atoms/ClientBadge";
import { FieldRow } from "../atoms/FieldRow";
import { SectionCard } from "../atoms/SectionCard";

import { formatPhoneNumber } from "@/lib/utils/format";

interface ClientCardProps {
  cliente: Cliente;
  empresaCotizacion?: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({ cliente, empresaCotizacion }) => {
  // When the cotización was placed under an empresa, surface the empresa
  // as the headline and demote the contact name to the byline. Otherwise the
  // person is the headline.
  const empresa = empresaCotizacion ?? cliente.empresa;
  const headline = empresa ?? cliente.nombre_cliente;
  const phoneNumber = cliente.numero_telefono ? formatPhoneNumber(cliente.numero_telefono) : "";

  return (
    <SectionCard title="Cliente" icon={<User size={15} />}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="font-medium text-[15px] text-gray-900 leading-tight">
            {headline}
            {cliente.categoria && <ClientBadge categoria={cliente.categoria} />}
          </p>
        </div>
      </div>
      {empresaCotizacion && <FieldRow label="Nombre" value={cliente.nombre_cliente} />}
      {cliente.rfc && <FieldRow label="RFC" value={cliente.rfc} />}
      <FieldRow
        label="Correo"
        value={
          <a
            href={`mailto:${cliente.correo_electronico}`}
            className="font-normal text-gray-500 text-[13px] hover:text-gray-900"
          >
            {cliente.correo_electronico}
          </a>
        }
      />
      <FieldRow
        label="Teléfono"
        value={
          <a
            href={cliente.numero_telefono ? `tel:${cliente.numero_telefono}` : undefined}
            className="font-normal text-gray-500 hover:text-gray-900"
          >
            {cliente.numero_telefono}
          </a>
        }
        last
      />
    </SectionCard>
  );
};
