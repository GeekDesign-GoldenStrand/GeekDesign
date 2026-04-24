import { EditIcon } from "@/components/ui/atoms/icons";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface MaterialCardRowProps extends MaterialCardProps {
  visibleColumns: MaterialesVisibleColumns;
  gridTemplateColumns: string;
  onEdit: (material: MaterialCardProps) => void;
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
          // Use native img
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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
}: MaterialCardRowProps) {
  return (
    <article
      className="grid items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.14)]"
      style={{ gridTemplateColumns }}
    >
      {visibleColumns.name && <p className="text-[16px] text-[#1e1e1e] text-center">{name}</p>}
      {visibleColumns.description && (
        <p className="text-[12px] text-[#575757] text-center line-clamp-2">{description || "-"}</p>
      )}
      {visibleColumns.unit && <p className="text-[14px] text-[#1e1e1e] text-center">{unit}</p>}
      {visibleColumns.width && <p className="text-[16px] text-[#1e1e1e] text-center">{width}</p>}
      {visibleColumns.height && <p className="text-[16px] text-[#1e1e1e] text-center">{height}</p>}
      {visibleColumns.thickness && (
        <p className="text-[16px] text-[#1e1e1e] text-center">{thickness}</p>
      )}
      {visibleColumns.color && <ColorDescription value={color} />}
      {visibleColumns.image && <PreviewImage imageUrl={imageUrl} name={name} />}
      <button
        onClick={() =>
          onEdit({ id, name, unit, color, width, height, thickness, description, imageUrl })
        }
        aria-label={`Editar material ${id}`}
        className="text-[#1e1e1e] hover:opacity-70 transition-opacity flex items-center justify-center"
      >
        <EditIcon size={20} />
      </button>
    </article>
  );
}
