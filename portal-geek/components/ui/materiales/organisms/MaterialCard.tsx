import Image from "next/image";

import { EditIcon, UserGearIcon } from "@/components/ui/atoms/icons";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface MaterialCardRowProps extends MaterialCardProps {
  visibleColumns: MaterialesVisibleColumns;
  gridTemplateColumns: string;
  onEdit: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
}

function ColorDescription({ value }: { value: string }) {
  const hasValue = value !== "-";

  return (
    <div className="flex items-center justify-center">
      <span
        className="inline-flex min-h-6 items-center justify-center rounded-full border border-[#b9b8b8] px-3 py-1 text-sm text-[#1e1e1e] text-center"
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
  id_material_padre,
  tipo,
  subMateriales,
  visibleColumns,
  gridTemplateColumns,
  onEdit,
  onViewProveedores,
}: MaterialCardRowProps) {
  const onEditClick = () =>
    onEdit({
      id,
      name,
      unit,
      color,
      width,
      height,
      thickness,
      description,
      imageUrl,
      id_material_padre,
      tipo,
      subMateriales,
    });

  const onProveedoresClick = () => onViewProveedores(id, name);

  // Sizing matches CotizacionesTable: px-4 py-3, text-sm,
  // rounded shadow. Cells inherit text color/weight (no bolded name on desktop)
  // for visual consistency across admin tables.
  return (
    <article
      className="flex flex-col md:grid md:items-center gap-3 md:gap-4 p-4 md:px-4 md:py-3 bg-white text-[#1e1e1e] rounded shadow text-sm relative transition-shadow hover:shadow-md"
      style={{ gridTemplateColumns }}
    >
      <div className="flex items-center justify-between md:contents">
        {visibleColumns.name && (
          <div className="flex flex-col md:flex md:items-center md:justify-center min-w-0">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Nombre</span>
            <p className="text-sm font-semibold md:font-normal truncate max-w-full" title={name}>
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
        <div className="flex flex-col md:flex md:items-center md:justify-center min-w-0">
          <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">
            Descripción
          </span>
          <p className="text-sm line-clamp-2 max-w-full break-words">{description || "-"}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:contents gap-3">
        {visibleColumns.unit && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Unidad</span>
            <p className="text-sm">{unit}</p>
          </div>
        )}
        {visibleColumns.width && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Ancho</span>
            <p className="text-sm">{width}</p>
          </div>
        )}
        {visibleColumns.height && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Alto</span>
            <p className="text-sm">{height}</p>
          </div>
        )}
        {visibleColumns.thickness && (
          <div className="flex flex-col md:flex md:items-center md:justify-center">
            <span className="text-[10px] uppercase text-[#8e908f] font-bold md:hidden">Grosor</span>
            <p className="text-sm">{thickness}</p>
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

      {visibleColumns.proveedores && (
        <div className="flex items-center justify-center">
          <button
            onClick={onProveedoresClick}
            aria-label={`Ver proveedores de ${name}`}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded border border-[#575757] bg-[#e8e8e8] text-[#1e1e1e] text-sm font-medium hover:bg-[#d8d8d8] transition-colors whitespace-nowrap"
          >
            <UserGearIcon size={14} />
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
