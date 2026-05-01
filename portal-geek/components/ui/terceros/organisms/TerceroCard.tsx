"use client";

import { useState } from "react";

import { EditIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/atoms/icons";
import { TerceroTypeTag } from "@/components/ui/terceros/atoms/TerceroTypeTag";
import { StatusDropdown } from "@/components/ui/terceros/molecules/StatusDropdown";
import type { TerceroCardProps } from "@/types";

import { AsignarItemsModal } from "./AsignarItemsModal";

function formatPhone(phone: string) {
  if (/^(55|33|81)/.test(phone)) {
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3");
  }
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
}

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
    <div className="bg-white rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-2.5 w-full font-['IBM_Plex_Sans_JP',sans-serif]">
      <h3 className="font-semibold text-xl text-[#1e1e1e] leading-tight">{companyName}</h3>

      <p className="font-medium text-[18px] text-[#1e1e1e]">{contactName}</p>

      <div className="flex items-center gap-1 text-[16px] font-light text-[#424242]">
        <MapPinIcon />
        <span>{location}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] ${
            role === "Proveedor"
              ? "bg-[rgba(139,92,246,0.12)] border-[#8b5cf6] text-[#8b5cf6]"
              : "bg-[rgba(0,128,255,0.07)] border-[#006aff] text-[#006aff]"
          }`}
        >
          {role}
        </span>

        {hasMaterial && (
          <TerceroTypeTag type="Material" onClick={() => setIsMaterialesOpen(true)} />
        )}
        {hasServicio && <TerceroTypeTag type="Servicio" onClick={() => setIsServiciosOpen(true)} />}

        <StatusDropdown status={status} onChange={onStatusChange} />
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[18px]">
        <MailIcon />
        <a href={`mailto:${email}`} className="underline lowercase hover:opacity-70">
          {email}
        </a>
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[18px] lowercase">
        <PhoneIcon />
        <span>{phone ? formatPhone(phone) : "–"}</span>
      </div>

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <a
          href={phone ? `tel:${phone}` : undefined}
          aria-disabled={!phone}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] aria-disabled:opacity-40 aria-disabled:pointer-events-none"
        >
          <PhoneIcon />
          Llamar
        </a>
        <a
          href={`mailto:${email}`}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <MailIcon />
          Mail
        </a>
        <button
          onClick={onEdit}
          aria-label="Editar"
          className="flex-none flex items-center justify-center border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <EditIcon />
        </button>
      </div>

      <AsignarItemsModal
        itemType="servicio"
        id_proveedor={id}
        companyName={companyName}
        contactName={contactName}
        email={email}
        phone={phone}
        role={role}
        status={status}
        isOpen={isServiciosOpen}
        onClose={() => setIsServiciosOpen(false)}
        onSaved={() => {}}
      />

      <AsignarItemsModal
        itemType="material"
        id_proveedor={id}
        companyName={companyName}
        contactName={contactName}
        email={email}
        phone={phone}
        role={role}
        status={status}
        isOpen={isMaterialesOpen}
        onClose={() => setIsMaterialesOpen(false)}
        onSaved={() => {}}
      />
    </div>
  );
}
