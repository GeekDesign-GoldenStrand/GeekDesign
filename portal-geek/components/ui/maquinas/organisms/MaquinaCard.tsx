import { EditIcon, TrashIcon, PlusIcon } from "@/components/ui/atoms/icons";
import type { MaquinaCardProps, MachineStatus } from "@/types";

import MaquinaCreationDate from "../atoms/MaquinaCreationDate";
import MaquinaServiceBadge from "../atoms/MaquinaServiceBadge";
import MaquinaSubtitle from "../atoms/MaquinaSubtitle";
import MaquinaTitle from "../atoms/MaquinaTitle";
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
}: MaquinaCardProps) {
  return (
    <div className="bg-white rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col w-full font-['IBM_Plex_Sans_JP',sans-serif]">
      <div>
        <div className="flex gap-6 justify-between items-start">
          <MaquinaTitle title={nickname} />

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              aria-label="Editar"
              className="flex-none flex items-center justify-center w-9 h-9 border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
            >
              <EditIcon />
            </button>
            <button
              onClick={onDelete}
              aria-label="Eliminar"
              className="flex items-center justify-center w-9 h-9 border border-dashed border-[#e42200] rounded-[7px] p-2 text-[#e42200] hover:bg-[#fff5f5] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
        <MaquinaSubtitle subtitle={model} />
      </div>
      {store ? (
        <MaquinaSection heading="Sucursal" text={store} />
      ) : (
        <div className="my-3">
          <MaquinaSubtitle subtitle="Sucursal" />
          <button
            onClick={onAssignStore}
            aria-label="Asignar sucursal"
            className="flex-none gap-3 mt-3 flex items-center justify-center border border-[#006aff] rounded-[7px] p-2 text-[#006aff] text-[13px] max-h-[45px] hover:bg-[#f0f5ff] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
          >
            Asignar <PlusIcon size={10} />
          </button>
        </div>
      )}
      {services && services.length > 0 ? (
        <div>
          <MaquinaSubtitle subtitle="Servicios" />
          <MaquinaServiceBadge services={services} />
        </div>
      ) : (
        <MaquinaSection heading="Servicios" text="Sin asignar" />
      )}
      <MaquinaSection heading="Descripción" text={description || "Sin descripción"} />

      <div className="flex justify-between">
        <MaquinaCreationDate creationDate={creation_date} />
        <MaquinaStatusDropdown
          status={status}
          options={MACHINE_STATUS_OPTIONS}
          optionColors={["#00c853", "#8e908f"]}
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
