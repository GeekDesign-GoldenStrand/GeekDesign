"use client";

import { EditIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/atoms/icons";

function formatPhone(phone: string) {
  if (/^(55|33|81)/.test(phone)) {
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3");
  }
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
}
import { StatusDropdown } from "@/components/ui/terceros/molecules/StatusDropdown";
import type { TerceroCardProps } from "@/types";

export function TerceroCard({
  companyName,
  contactName,
  location,
  role,
  status,
  email,
  phone,
  onEdit,
  onStatusChange,
}: TerceroCardProps) {
  return (
    <div className="bg-white rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-2.5 w-full font-['IBM_Plex_Sans_JP',sans-serif]">
      <h3 className="font-semibold text-xl text-[#1e1e1e] leading-tight">{companyName}</h3>

      <p className="font-medium text-[18px] text-[#1e1e1e]">{contactName}</p>

      <div className="flex items-center gap-1 text-[16px] font-light text-[#424242]">
        <MapPinIcon />
        <span>{location}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-[7px] bg-[rgba(0,128,255,0.07)] border border-[#006aff] text-[#006aff] text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]">
          {role}
        </span>

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

      <div className="flex items-center gap-2 mt-1">
        <a
          href={phone ? `tel:${phone}` : undefined}
          aria-disabled={!phone}
          className="flex items-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] aria-disabled:opacity-40 aria-disabled:pointer-events-none"
        >
          <PhoneIcon />
          Llamar
        </a>
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <MailIcon />
          Mail
        </a>
        <button
          onClick={onEdit}
          aria-label="Editar"
          className="flex items-center justify-center border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <EditIcon />
        </button>
      </div>
    </div>
  );
}
