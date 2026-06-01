"use client";

import { ActionButton, EntityCard } from "@/components/ui/atoms";
import { EditIcon, TrashIcon } from "@/components/ui/atoms/icons";
import type { MachineStatus, MaquinaCardProps } from "@/types";

import MaquinaAssignButton from "../atoms/MaquinaAssignButton";
import MaquinaCreationDate from "../atoms/MaquinaCreationDate";
import MaquinaServiceBadge from "../atoms/MaquinaServiceBadge";
import MaquinaSubtitle from "../atoms/MaquinaSubtitle";
import MaquinaText from "../atoms/MaquinaText";
import MaquinaSection from "../molecules/MaquinaSection";
import MaquinaStatusDropdown from "../molecules/MaquinaStatusDropdown";

const MACHINE_STATUS_OPTIONS: MachineStatus[] = ["Activa", "En mantenimiento"];

export function MaquinaCard({
  nickname,
  model,
  store,
  description,
  services,
  creation_date,
  status,
  onDelete,
  onEdit,
  onAssignStore,
  onAssignServices,
  onChangeStatus,
}: MaquinaCardProps) {
  return (
    <EntityCard gap="gap-4">
      <div>
        <EntityCard.Title>{nickname}</EntityCard.Title>
        <EntityCard.Subtitle>{model}</EntityCard.Subtitle>
      </div>

      <MaquinaCreationDate creationDate={creation_date} />

      {store ? (
        <div>
          <div className="flex items-center gap-1">
            <MaquinaSubtitle subtitle="Sucursal" />
            <button
              onClick={onAssignStore}
              aria-label="Asignar sucursal"
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[7px] text-gray-500 hover:text-[#c30000]"
            >
              <EditIcon size={15} />
            </button>
          </div>
          <MaquinaText text={store} />
        </div>
      ) : (
        <div>
          <MaquinaSubtitle subtitle="Sucursal" />
          <MaquinaAssignButton onClick={onAssignStore} />
        </div>
      )}

      {services && services.length > 0 ? (
        <div>
          <div className="flex items-center gap-1">
            <MaquinaSubtitle subtitle="Servicios" />
            <button
              onClick={onAssignServices}
              aria-label="Asignar servicios"
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[7px] text-gray-500 hover:text-[#c30000]"
            >
              <EditIcon size={15} />
            </button>
          </div>
          <MaquinaServiceBadge services={services} />
        </div>
      ) : (
        <div>
          <MaquinaSubtitle subtitle="Servicios" />
          <MaquinaAssignButton onClick={onAssignServices} />
        </div>
      )}

      <MaquinaSection heading="Descripción" text={description || "Sin descripción"} />

      <div className="flex items-center justify-end mt-auto pt-2 flex-wrap gap-2">
        <MaquinaStatusDropdown
          status={status}
          options={MACHINE_STATUS_OPTIONS}
          onChange={onChangeStatus ?? (() => {})}
        />
        <ActionButton onClick={onEdit} aria-label="Editar" icon={<EditIcon size={16} />} />
        <ActionButton
          tone="danger"
          onClick={onDelete}
          aria-label="Eliminar"
          icon={<TrashIcon size={16} />}
        />
      </div>
    </EntityCard>
  );
}
