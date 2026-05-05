"use client";

import { MapPin, PencilSimple, Phone } from "@phosphor-icons/react";

import { RoleTag } from "@/components/ui/atoms/RoleTag";
import { StatusTag } from "@/components/ui/atoms/StatusTag";

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
            <MapPin size={16} aria-hidden />
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
          <Phone size={18} aria-hidden />
          {user.telefono}
        </span>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {user.telefono ? (
          <a
            href={`tel:${user.telefono}`}
            className="flex items-center gap-1.5 h-[38px] rounded-[7px] border border-dashed border-[#1e1e1e] px-4 shadow-[0_4px_10px_rgba(0,0,0,0.25)] font-ibm-plex font-medium text-[14px] text-[#1e1e1e] hover:bg-[#f5f5f5] transition-colors"
          >
            <Phone size={18} aria-hidden />
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
            <PencilSimple size={18} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
