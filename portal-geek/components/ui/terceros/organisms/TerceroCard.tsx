"use client";

import { useState } from "react";

import { EditIcon, MailIcon, MapPinIcon, PhoneIcon, TrashIcon } from "@/components/ui/atoms/icons";
import { TerceroTypeTag } from "@/components/ui/terceros/atoms/TerceroTypeTag";
import { StatusDropdown } from "@/components/ui/terceros/molecules/StatusDropdown";
import { formatPhoneNumber } from "@/lib/utils/format";
import type { TerceroCardProps } from "@/types";

import { AsignarItemsModal } from "./AsignarItemsModal";

const ACTION_BTN =
  "flex items-center justify-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f5f5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors";


export function TerceroCard({
  id,
  companyName,
  contactName,
  location,
  role,
  status,
  email,
  phone,
  tipo,
  onEdit,
  onDelete,
  onStatusChange,
}: TerceroCardProps) {
  const [isServiciosOpen, setIsServiciosOpen] = useState(false);
  const [isMaterialesOpen, setIsMaterialesOpen] = useState(false);

  const types = tipo ? tipo.split(",").map((t) => t.trim()) : [];
  const hasMaterial = types.some(
    (t) => t.toLowerCase() === "proveedor de material" || t.toLowerCase() === "material"
  );
  const hasServicio = types.some(
    (t) => t.toLowerCase() === "proveedor de servicio" || t.toLowerCase() === "servicio"
  );

  return (
    <div className="bg-white rounded-[7px] shadow-[0_0_20px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-2.5 w-full font-ibm-plex">
      <h3 className="font-semibold text-[24px] text-[#1e1e1e] leading-tight">{companyName}</h3>

      <p className="font-medium text-[18px] text-[#424242]">{contactName}</p>

      <div className="flex items-center gap-1 text-[16px] font-light text-[#424242]">
        <MapPinIcon />
        <span>{location}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] ${
            role === "Proveedor"
              ? "bg-[rgba(139,92,246,0.12)] border-[#8b5cf6] text-[#8b5cf6]"
              : tipo === "Contratista"
                ? "bg-[rgba(30,58,138,0.08)] border-[#1e3a8a] text-[#1e3a8a]"
                : "bg-[rgba(0,128,255,0.07)] border-[#006aff] text-[#006aff]"
          }`}
        >
          {tipo === "Contratista" ? "Contratista" : role}
        </span>

        {hasMaterial && role === "Proveedor" && (
          <TerceroTypeTag type="Material" onClick={() => setIsMaterialesOpen(true)} />
        )}
        {hasServicio && role === "Proveedor" && (
          <TerceroTypeTag type="Servicio" onClick={() => setIsServiciosOpen(true)} />
        )}
        {role === "Instalador" && (
          <TerceroTypeTag type="Servicio" onClick={() => setIsServiciosOpen(true)} />
        )}

        <StatusDropdown status={status} onChange={onStatusChange} />
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[16px] truncate">
        <MailIcon size={16} />
        <a href={`mailto:${email}`} className="lowercase hover:opacity-70 truncate">
          {email}
        </a>
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[16px] lowercase">
        <PhoneIcon size={16} />
        <span>{phone ? formatPhoneNumber(phone) : "–"}</span>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
        <a
          href={phone ? `tel:${phone}` : undefined}
          aria-disabled={!phone}
          className={`flex-1 min-w-[80px] ${ACTION_BTN} aria-disabled:opacity-40 aria-disabled:pointer-events-none`}
        >
          <PhoneIcon size={16} />
          Llamar
        </a>
        <a
          href={email ? `mailto:${email}` : undefined}
          aria-disabled={!email}
          className={`flex-1 min-w-[80px] ${ACTION_BTN} aria-disabled:opacity-40 aria-disabled:pointer-events-none`}
        >
          <MailIcon size={16} />
          Mail
        </a>
        <button
          onClick={onEdit}
          aria-label="Editar"
          className="flex-none flex items-center justify-center border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-[#f5f5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
        >
          <EditIcon size={16} />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="Eliminar"
            className="flex-none flex items-center justify-center border border-dashed border-[#e42200] rounded-[7px] p-2 text-[#e42200] hover:bg-[#fff5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
          >
            <TrashIcon size={16} />
          </button>
        )}
      </div>

      {isServiciosOpen && (
        <AsignarItemsModal
          itemType="servicio"
          targetId={id}
          targetType={role === "Proveedor" ? "proveedor" : "instalador"}
          companyName={companyName}
          contactName={contactName}
          email={email}
          phone={phone}
          role={role}
          tipo={tipo}
          status={status}
          isOpen={isServiciosOpen}
          onClose={() => setIsServiciosOpen(false)}
          onSaved={() => {}}
        />
      )}

      {role === "Proveedor" && isMaterialesOpen && (
        <AsignarItemsModal
          itemType="material"
          targetId={id}
          targetType="proveedor"
          companyName={companyName}
          contactName={contactName}
          email={email}
          phone={phone}
          role={role}
          tipo={tipo}
          status={status}
          isOpen={isMaterialesOpen}
          onClose={() => setIsMaterialesOpen(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
