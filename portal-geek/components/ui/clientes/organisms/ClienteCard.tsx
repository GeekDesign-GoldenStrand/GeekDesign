"use client";

import type { Clientes } from "@prisma/client";

import { EntityCard } from "@/components/ui/atoms";

import { CategoryDropdown, type ClientCategory } from "../molecules/CategoryDropdown";

interface ClienteCardProps {
  cliente: Clientes;
  onUpdateCategory?: (id: number, category: ClientCategory) => void;
}

// Mirrors UserCard / TerceroCard layout so the three admin entity grids
// (Colaboradores, Terceros, Clientes) share the same visual rhythm:
// Title → Subtitle → details → TagRow → Contact (mail/phone) → Actions (Llamar / Mail).
// Placeholder used when an optional column is empty — keeps every card the
// same height/shape regardless of which fields the client filled in, and
// matches the "—" the old ClientesTable showed for missing values.
const EMPTY = "—";

export function ClienteCard({ cliente, onUpdateCategory }: ClienteCardProps) {
  return (
    <EntityCard>
      <EntityCard.Title>{cliente.nombre_cliente}</EntityCard.Title>

      {/* Empresa and RFC are always rendered — even when null — so a card
          surfaces every column the old ClientesTable did. Empty values fall
          back to a dash placeholder, italicized for visual de-emphasis. */}
      <EntityCard.Subtitle>
        {cliente.empresa || <span className="italic text-[#8e908f]">{EMPTY}</span>}
      </EntityCard.Subtitle>

      <p className="text-[14px] font-light text-[#424242] font-mono break-all">
        RFC:{" "}
        {cliente.rfc ? (
          cliente.rfc
        ) : (
          <span className="not-italic font-sans italic text-[#8e908f]">{EMPTY}</span>
        )}
      </p>

      <EntityCard.TagRow>
        <CategoryDropdown
          category={cliente.categoria}
          onChange={(newCat) => onUpdateCategory?.(cliente.id_cliente, newCat)}
        />
      </EntityCard.TagRow>

      <EntityCard.Contact email={cliente.correo_electronico} phone={cliente.numero_telefono} />

      {/* No onEdit/onDelete — the clientes API doesn't expose those today, so the
          card only surfaces the Llamar + Mail action links (same shape as the
          other entity cards, with edit/delete simply omitted). */}
      <EntityCard.Actions email={cliente.correo_electronico} phone={cliente.numero_telefono} />
    </EntityCard>
  );
}
