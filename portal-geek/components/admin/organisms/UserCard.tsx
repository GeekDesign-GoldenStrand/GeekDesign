"use client";

import { RoleTag } from "@/components/ui/atoms/RoleTag";
import { StatusTag } from "@/components/ui/atoms/StatusTag";

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .91h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export interface UserCardUser {
  id_usuario: number;
  nombre_completo: string;
  edad?: number | string | null;
  sexo?: string | null;
  sucursal?: string | null;
  fecha_modificacion?: string | null;
  telefono?: string | null;
  estatus: string;
  id_rol: number;
  rol: { nombre_rol: string };
}

interface UserCardProps {
  user: UserCardUser;
  roles?: { id_rol: number; nombre_rol: string }[];
  onRolChange?: (userId: number, newRolId: number) => void;
  onEdit?: (userId: number) => void;
  saving?: boolean;
}

export function UserCard({ user, roles, onRolChange, onEdit, saving }: UserCardProps) {
  return (
    <div className="w-full rounded-[7px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.25)] p-6 flex flex-col gap-3 min-h-[321px]">
      <h3 className="font-ibm-plex font-semibold text-[24px] text-[#1e1e1e] leading-tight">
        {user.nombre_completo}
      </h3>

      <div className="flex flex-col gap-0.5 font-ibm-plex font-light text-[16px] text-[#424242]">
        {user.edad != null && <span>Edad: {user.edad}</span>}
        {user.sexo && <span>Sexo: {user.sexo}</span>}
        {user.sucursal && (
          <span className="flex items-center gap-1">
            <PinIcon />
            {user.sucursal}
          </span>
        )}
        {user.fecha_modificacion && (
          <span className="text-[14px]">Fecha de Modificación: {user.fecha_modificacion}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <RoleTag
          role={user.rol.nombre_rol}
          roles={roles}
          currentRolId={user.id_rol}
          onRolChange={onRolChange ? (id) => onRolChange(user.id_usuario, id) : undefined}
          saving={saving}
        />
        <StatusTag status={user.estatus} />
      </div>

      {user.telefono && (
        <span className="font-ibm-plex font-medium text-[18px] text-[#1e1e1e] lowercase flex items-center gap-2">
          <PhoneIcon />
          {user.telefono}
        </span>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {user.telefono ? (
          <a
            href={`tel:${user.telefono}`}
            className="flex items-center gap-1.5 h-[38px] rounded-[7px] border border-dashed border-[#1e1e1e] px-4 shadow-[0_4px_10px_rgba(0,0,0,0.25)] font-ibm-plex font-medium text-[14px] text-[#1e1e1e] hover:bg-[#f5f5f5] transition-colors"
          >
            <PhoneIcon />
            Llamar
          </a>
        ) : (
          <div />
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(user.id_usuario)}
            aria-label={`Editar ${user.nombre_completo}`}
            className="text-[#555] hover:text-[#e42200] transition-colors"
          >
            <EditIcon />
          </button>
        )}
      </div>
    </div>
  );
}
