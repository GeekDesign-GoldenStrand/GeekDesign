"use client";

import type { TerceroCardProps } from "@/types";

function MapPinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MailIconSm() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIconSm() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function TerceroCard({
  companyName,
  contactName,
  location,
  role,
  status,
  email,
  phone,
  onCall,
  onMail,
  onEdit,
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

        <button
          className={`flex items-center gap-1 px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] ${
            status === "Activo"
              ? "bg-[rgba(255,0,0,0.07)] border-red-500 text-red-500"
              : "bg-[rgba(0,0,0,0.07)] border-[#090909] text-[#090909]"
          }`}
        >
          {status}
          <ChevronDownIcon />
        </button>
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[18px]">
        <MailIconSm />
        <a href={`mailto:${email}`} className="underline lowercase hover:opacity-70">
          {email}
        </a>
      </div>

      <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[18px] lowercase">
        <PhoneIconSm />
        <span>{phone}</span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={onCall}
          className="flex items-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <PhoneIconSm />
          Llamar
        </button>
        <button
          onClick={onMail}
          className="flex items-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <MailIconSm />
          Mail
        </button>
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
