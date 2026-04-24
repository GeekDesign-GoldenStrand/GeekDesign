import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface MaterialesGridProps {
  items: MaterialCardProps[];
  visibleColumns: MaterialesVisibleColumns;
  onEditMaterial: (material: MaterialCardProps) => void;
}

const COLUMN_META: Array<{
  key: keyof MaterialesVisibleColumns;
  label: string;
  width: string;
}> = [
  { key: "name", label: "Nombre", width: "1.3fr" },
  { key: "description", label: "Descripción", width: "1.3fr" },
  { key: "unit", label: "Unidad de medida", width: "1.3fr" },
  { key: "width", label: "Ancho", width: "1fr" },
  { key: "height", label: "Alto", width: "1fr" },
  { key: "thickness", label: "Grosor", width: "1fr" },
  { key: "color", label: "Descripción del color", width: "1.2fr" },
  { key: "image", label: "Imagen", width: "1fr" },
];

export function MaterialesGrid({ items, visibleColumns, onEditMaterial }: MaterialesGridProps) {
  const enabledColumns = COLUMN_META.filter((column) => visibleColumns[column.key]);
  const templateColumns = `${enabledColumns.map((column) => column.width).join(" ")} auto`;

  return (
    <section className="space-y-3">
      <div
        className="grid items-center gap-4 px-4 py-2 rounded-[6px] bg-[#c6c6c6] text-[#1e1e1e] text-[20px] font-bold"
        style={{ gridTemplateColumns: templateColumns }}
      >
        {enabledColumns.map((column) => (
          <span key={column.key} className="text-center flex items-center justify-center">
            {column.label}
          </span>
        ))}
        <span />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <MaterialCard
            key={item.id}
            {...item}
            visibleColumns={visibleColumns}
            gridTemplateColumns={templateColumns}
            onEdit={onEditMaterial}
          />
        ))}
      </div>
    </section>
  );
}
