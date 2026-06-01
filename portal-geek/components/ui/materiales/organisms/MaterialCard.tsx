import Image from "next/image";

import { EditIcon, UserGearIcon } from "@/components/ui/atoms/icons";
import type { MaterialCardProps } from "@/types";

interface MaterialCardRowProps extends MaterialCardProps {
  gridTemplateColumns: string;
  variant?: "default" | "sub";
  showProveedores?: boolean;
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
      <div className="relative h-15 w-15 rounded-sm overflow-hidden bg-[#d9d9d9] shrink-0">
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
  gridTemplateColumns,
  variant = "default",
  showProveedores = false,
  onEdit,
  onViewProveedores,
}: MaterialCardRowProps) {
  const material = {
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
  };
  const onEditClick = () => onEdit(material);
  const onProveedoresClick = () => onViewProveedores(id, name);

  // Sizing matches CotizacionesTable: px-4 py-3, text-sm,
  // rounded shadow. Cells inherit text color/weight (no bolded name on desktop)
  // for visual consistency across admin tables.
  const dim = (value: string) => (value !== "-" && unit ? `${value} ${unit}` : value);

  return (
    <>
      {/* Desktop row */}
      <div
        className={`hidden md:grid items-center gap-4 px-4 py-3 bg-white text-[#1e1e1e] text-sm ${variant === "sub" ? "" : "rounded shadow transition-shadow hover:shadow-md"}`}
        style={{ gridTemplateColumns }}
      >
        <p className="truncate max-w-full text-center" title={name}>
          {name}
        </p>
        <p className="line-clamp-2 text-center wrap-break-word">{description || "-"}</p>
        <p className="text-center">{dim(width)}</p>
        <p className="text-center">{dim(height)}</p>
        <p className="text-center">{dim(thickness)}</p>
        <ColorDescription value={color} />
        <PreviewImage imageUrl={imageUrl} name={name} />
        {showProveedores && (
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
          className="flex items-center justify-center text-[#1e1e1e] hover:opacity-70 transition-opacity"
        >
          <EditIcon size={20} />
        </button>
      </div>

      {/* Mobile compact card */}
      <div className="md:hidden bg-white p-4 rounded-xl shadow-sm border border-[#F0F0F0]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {imageUrl && (
              <div className="relative h-12 w-12 rounded-sm overflow-hidden bg-[#d9d9d9] shrink-0">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="3rem"
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#1e1e1e] truncate">{name}</p>
              {unit && unit !== "-" && <p className="text-[12px] text-[#8e908f] mt-0.5">{unit}</p>}
            </div>
          </div>
          <button
            onClick={onEditClick}
            aria-label={`Editar material ${id}`}
            className="shrink-0 p-2 -mr-1 text-[#1e1e1e] hover:opacity-70 transition-opacity"
          >
            <EditIcon size={20} />
          </button>
        </div>

        {showProveedores && (
          <div className="mt-3 pt-3 border-t border-[#F5F5F5]">
            <button
              onClick={onProveedoresClick}
              aria-label={`Ver proveedores de ${name}`}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded border border-[#575757] bg-[#e8e8e8] text-[#1e1e1e] text-sm font-medium hover:bg-[#d8d8d8] transition-colors"
            >
              <UserGearIcon size={14} />
              Ver proveedores
            </button>
          </div>
        )}
      </div>
    </>
  );
}
