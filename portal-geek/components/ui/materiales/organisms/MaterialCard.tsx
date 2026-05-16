import Image from "next/image";

import { EditIcon, UsersIcon } from "@/components/ui/atoms/icons";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface MaterialCardRowProps extends MaterialCardProps {
  visibleColumns: MaterialesVisibleColumns;
  gridTemplateColumns: string;
  onEdit: (material: MaterialCardProps) => void;
  onViewPersonas: (materialId: number, materialName: string) => void;
}

function ColorDescription({ value }: { value: string }) {
  const hasValue = value !== "-";

  return (
    <div className="flex items-center justify-center">
      <span
        className="inline-flex min-h-6 items-center justify-center rounded-full border border-[#b9b8b8] px-3 py-1 text-[14px] text-[#1e1e1e] text-center"
        aria-label={hasValue ? `Descripción del color ${value}` : "Sin descripción del color"}
      >
        {hasValue ? value : "-"}
      </span>
    </div>
  );
}

function PreviewImage({ imageUrl, name }: { imageUrl: string; name: string }) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative h-[3.75rem] w-[3.75rem] rounded-[4px] overflow-hidden bg-[#d9d9d9] shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="3.75rem"
            unoptimized
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

export function MaterialCard({
  id,
  name,
  unit,
  color,
  width,
  height,
  thickness,
  description,
  imageUrl,
  visibleColumns,
  gridTemplateColumns,
  onEdit,
  onViewPersonas,
}: MaterialCardRowProps) {
  const onEditClick = () =>
    onEdit({ id, name, unit, color, width, height, thickness, description, imageUrl });

  const onPersonasClick = () => onViewPersonas(id, name);

  return (
    <article
      className="flex flex-col md:grid md:items-center gap-3 md:gap-4 p-4 md:px-4 md:py-3 bg-white rounded-[7px] shadow-[0_2px_7px_rgba(0,0,0,0.14)] relative"
      style={{ gridTemplateColumns }}
    >
      <div className="flex items-center justify-between md:contents">
        {visibleColumns.name && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Nombre</span>
            <p className="text-[15px] lg:text-[16px] text-[#1e1e1e] font-semibold md:font-normal truncate">
              {name}
            </p>
          </div>
        )}

        <button
          onClick={onEditClick}
          aria-label={`Editar material ${id}`}
          className="md:hidden text-[#1e1e1e] hover:opacity-70 transition-opacity p-2 -mr-2"
        >
          <EditIcon size={20} />
        </button>
      </div>

      {visibleColumns.description && (
        <div className="flex flex-col md:flex md:items-center md:justify-center">
          <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">
            Descripción
          </span>
          <p className="text-[12px] text-[#575757] line-clamp-2">{description || "-"}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:contents gap-3">
        {visibleColumns.unit && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Unidad</span>
            <p className="text-[14px] text-[#1e1e1e]">{unit}</p>
          </div>
        )}
        {visibleColumns.width && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Ancho</span>
            <p className="text-[14px] md:text-[16px] text-[#1e1e1e]">{width}</p>
          </div>
        )}
        {visibleColumns.height && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Alto</span>
            <p className="text-[14px] md:text-[16px] text-[#1e1e1e]">{height}</p>
          </div>
        )}
        {visibleColumns.thickness && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Grosor</span>
            <p className="text-[14px] md:text-[16px] text-[#1e1e1e]">{thickness}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 md:contents">
        {visibleColumns.color && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Color</span>
            <ColorDescription value={color} />
          </div>
        )}

        {visibleColumns.image && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Imagen</span>
            <PreviewImage imageUrl={imageUrl} name={name} />
          </div>
        )}
      </div>

      {visibleColumns.personas && (
        <div className="flex items-center justify-center">
          <button
            onClick={onPersonasClick}
            aria-label={`Ver personas relacionadas con ${name}`}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-[7px] border border-[#575757] bg-[#e8e8e8] text-[#1e1e1e] text-[12px] font-medium hover:bg-[#d8d8d8] transition-colors whitespace-nowrap"
          >
            <UsersIcon size={14} />
            Ver proveedores
          </button>
        </div>
      )}

      <button
        onClick={onEditClick}
        aria-label={`Editar material ${id}`}
        className="hidden md:flex text-[#1e1e1e] hover:opacity-70 transition-opacity items-center justify-center"
      >
        <EditIcon size={20} />
      </button>
    </article>
  );
}
