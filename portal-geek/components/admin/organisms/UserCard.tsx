"use client";

import { MapPin } from "@phosphor-icons/react";

import { EditIcon, MailIcon, PhoneIcon, TrashIcon } from "@/components/ui/atoms/icons";
import { RoleTag } from "@/components/ui/atoms/RoleTag";
import { StatusTag } from "@/components/ui/atoms/StatusTag";

export interface UserCardUser {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico?: string | null;
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
  onStatusChange?: (userId: number, newStatus: string) => void;
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
  onSucursalClick?: (userId: number) => void;
  saving?: boolean;
  savingStatus?: boolean;
}

const ACTION_BTN =
  "flex items-center justify-center gap-1.5 border border-dashed border-[#1e1e1e] rounded-[7px] px-3 py-2 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f5f5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors";

export function UserCard({
  user,
  roles,
  onRolChange,
  onStatusChange,
  onEdit,
  onDelete,
  onSucursalClick,
  saving,
  savingStatus,
}: UserCardProps) {
  return (
    <div className="w-full rounded-[7px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-2.5">
      <h3 className="font-ibm-plex font-semibold text-[24px] text-[#1e1e1e] leading-tight">
        {user.nombre_completo}
      </h3>

      <div className="flex flex-col gap-0.5 font-ibm-plex font-light text-[16px] text-[#424242]">
        {user.edad != null && <span>Edad: {user.edad}</span>}
        {user.sexo && <span>Sexo: {user.sexo}</span>}
        {onSucursalClick ? (
          <button
            type="button"
            onClick={() => onSucursalClick(user.id_usuario)}
            aria-label={
              user.sucursal
                ? `Cambiar sucursal de ${user.nombre_completo}`
                : `Asignar sucursal a ${user.nombre_completo}`
            }
            className="flex items-center gap-1 self-start rounded-[6px] px-1 -mx-1 hover:bg-[#f5f5f5] text-left transition-colors"
          >
            <MapPin size={16} aria-hidden />
            <span className={user.sucursal ? "" : "italic text-[#8e908f]"}>
              {user.sucursal ?? "Sin sucursal"}
            </span>
          </button>
        ) : (
          user.sucursal && (
            <span className="flex items-center gap-1">
              <MapPin size={16} aria-hidden />
              {user.sucursal}
            </span>
          )
        )}
        {user.fecha_modificacion && (
          <span className="text-[14px]">Modificado: {user.fecha_modificacion}</span>
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
        <StatusTag
          status={user.estatus}
          onStatusChange={onStatusChange ? (s) => onStatusChange(user.id_usuario, s) : undefined}
          saving={savingStatus}
        />
      </div>

      {user.correo_electronico && (
        <span className="font-ibm-plex font-medium text-[16px] text-[#1e1e1e] flex items-center gap-2">
          <MailIcon size={16} aria-hidden />
          {user.correo_electronico}
        </span>
      )}

      {user.telefono && (
        <span className="font-ibm-plex font-medium text-[16px] text-[#1e1e1e] flex items-center gap-2">
          <PhoneIcon size={16} aria-hidden />
          {/^(55|33|81)/.test(user.telefono)
            ? user.telefono.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3")
            : user.telefono.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")}
        </span>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
        <a
          href={user.telefono ? `tel:${user.telefono}` : undefined}
          aria-disabled={!user.telefono}
          className={`flex-1 min-w-[80px] ${ACTION_BTN} aria-disabled:opacity-40 aria-disabled:pointer-events-none`}
        >
          <PhoneIcon size={16} aria-hidden />
          Llamar
        </a>
        <a
          href={user.correo_electronico ? `mailto:${user.correo_electronico}` : undefined}
          aria-disabled={!user.correo_electronico}
          className={`flex-1 min-w-[80px] ${ACTION_BTN} aria-disabled:opacity-40 aria-disabled:pointer-events-none`}
        >
          <MailIcon size={16} aria-hidden />
          Mail
        </a>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(user.id_usuario)}
            aria-label={`Editar ${user.nombre_completo}`}
            className="flex-none flex items-center justify-center border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-[#f5f5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
          >
            <EditIcon size={16} aria-hidden />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(user.id_usuario)}
            aria-label={`Eliminar ${user.nombre_completo}`}
            className="flex-none flex items-center justify-center border border-dashed border-[#e42200] rounded-[7px] p-2 text-[#e42200] hover:bg-[#fff5f5] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
          >
            <TrashIcon size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
