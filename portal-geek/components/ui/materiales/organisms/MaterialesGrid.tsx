import { MaterialesEmptyState } from "@/components/ui/materiales/molecules/MaterialesEmptyState";
import { PaginacionControles } from "@/components/ui/materiales/molecules/PaginacionControles";
import { CategoriaCard } from "@/components/ui/materiales/organisms/CategoriaCard";
import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import { MaterialGroupCard } from "@/components/ui/materiales/organisms/MaterialGroupCard";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface MaterialesGridProps {
  items: MaterialCardProps[];
  visibleColumns: MaterialesVisibleColumns;
  onEditMaterial: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
  onAddSubMaterial: (groupId: number) => void;
  onAddGrupo: (categoriaId: number) => void;
  // Server-side pagination state.
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Whether a search term is currently active (drives empty-state copy).
  hasSearch: boolean;
  onClearFilters: () => void;
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
  { key: "proveedores", label: "Proveedores", width: "1.3fr" },
];

export function MaterialesGrid({
  items,
  visibleColumns,
  onEditMaterial,
  onViewProveedores,
  onAddSubMaterial,
  onAddGrupo,
  page,
  totalPages,
  onPageChange,
  hasSearch,
  onClearFilters,
}: MaterialesGridProps) {
  const enabledColumns = COLUMN_META.filter((column) => visibleColumns[column.key]);
  const templateColumns = `${enabledColumns.map((column) => column.width).join(" ")} auto`;

  const categorias = items.filter((item) => item.tipo === "categoria");
  const groups = items.filter((item) => item.tipo === "grupo");
  const individuals = items.filter((item) => item.tipo === "individual");
  const hasItems = items.length > 0;

  return (
    <section className="space-y-3">
      {/* Column headers — hidden on mobile and when there are no rows.
          Sizing matches CotizacionesTable + ClientesTable: px-4 py-2,
          text-sm, bg-[#c6c6c6], rounded. */}
      {hasItems && (
        <div
          className="hidden md:grid items-center gap-4 px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] text-sm font-bold"
          style={{ gridTemplateColumns: templateColumns }}
        >
          {enabledColumns.map((column) => (
            <span key={column.key} className="text-center flex items-center justify-center">
              {column.label}
            </span>
          ))}
          <span />
        </div>
      )}

      {/* Empty state when search or filters produce zero results */}
      {!hasItems ? (
        <MaterialesEmptyState hasSearch={hasSearch} onClearFilters={onClearFilters} />
      ) : (
        <div className="space-y-2">
          {/* Categorías first (cada una envuelve sus grupos + individuales) */}
          {categorias.map((cat) => (
            <CategoriaCard
              key={cat.id}
              categoria={cat}
              visibleColumns={visibleColumns}
              gridTemplateColumns={templateColumns}
              onEdit={onEditMaterial}
              onViewProveedores={onViewProveedores}
              onAddSubMaterial={onAddSubMaterial}
              onAddGrupo={onAddGrupo}
            />
          ))}

          {/* Grupos huérfanos (sin categoría) */}
          {groups.map((group) => (
            <MaterialGroupCard
              key={group.id}
              group={group}
              visibleColumns={visibleColumns}
              gridTemplateColumns={templateColumns}
              onEdit={onEditMaterial}
              onViewProveedores={onViewProveedores}
              onAddSubMaterial={onAddSubMaterial}
            />
          ))}

          {/* Individuales huérfanos (sin categoría) */}
          {individuals.map((item) => (
            <MaterialCard
              key={item.id}
              {...item}
              visibleColumns={visibleColumns}
              gridTemplateColumns={templateColumns}
              onEdit={onEditMaterial}
              onViewProveedores={onViewProveedores}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      <PaginacionControles page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  );
}
