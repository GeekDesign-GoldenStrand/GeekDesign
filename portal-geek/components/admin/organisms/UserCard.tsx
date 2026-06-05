"use client";

import { MapPin } from "@phosphor-icons/react";

import { EntityCard } from "@/components/ui/atoms";
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
    <EntityCard>
      <EntityCard.Title>{user.nombre_completo}</EntityCard.Title>

      <div className="flex flex-col gap-0.5 font-light text-[16px] text-[#424242]">
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

      <EntityCard.TagRow>
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
      </EntityCard.TagRow>

      <EntityCard.Contact email={user.correo_electronico} phone={user.telefono} />

      <EntityCard.Actions
        email={user.correo_electronico}
        phone={user.telefono}
        onEdit={onEdit ? () => onEdit(user.id_usuario) : undefined}
        onDelete={onDelete ? () => onDelete(user.id_usuario) : undefined}
        editLabel={`Editar ${user.nombre_completo}`}
        deleteLabel={`Eliminar ${user.nombre_completo}`}
      />
    </EntityCard>
  );
}
