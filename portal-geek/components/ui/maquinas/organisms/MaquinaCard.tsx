import { EditIcon, TrashIcon } from "@/components/ui/atoms/icons";

import MaquinaCreationDate from "../atoms/MaquinaCreationDate";
import MaquinaServiceBadge from "../atoms/MaquinaServiceBadge";
import MaquinaSubtitle from "../atoms/MaquinaSubtitle";
import MaquinaTitle from "../atoms/MaquinaTitle";
import MaquinaSection from "../molecules/MaquinaSection";

import type MaquinaCardProps from "@/types/MaquinaCardProps";

export function MaquinaCard({
  nickname,
  model,
  store,
  description,
  services,
  creation_date,
  onDelete,
  onEdit,
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
      <MaquinaSection heading="Sucursal" text={store} />
      <MaquinaSubtitle subtitle="Servicios" />
      <MaquinaServiceBadge services={services} />
      <MaquinaSection heading="Descripción" text={description} />
      <MaquinaCreationDate creationDate={creation_date} />
    </div>
  );
}
