import { MaterialesEmptyState } from "@/components/ui/materiales/molecules/MaterialesEmptyState";
import { PaginacionControles } from "@/components/ui/materiales/molecules/PaginacionControles";
import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import { MaterialGroupCard } from "@/components/ui/materiales/organisms/MaterialGroupCard";
import type { MaterialCardProps } from "@/types";

const COLUMNS = [
  { label: "Nombre", width: "1.3fr" },
  { label: "Descripción", width: "1.3fr" },
  { label: "Ancho", width: "1fr" },
  { label: "Alto", width: "1fr" },
  { label: "Grosor", width: "1fr" },
  { label: "Descripción del color", width: "1.2fr" },
  { label: "Imagen", width: "1fr" },
] as const;

const PROVEEDORES_WIDTH = "1.3fr";

interface MaterialesGridProps {
  items: MaterialCardProps[];
  canViewProveedores?: boolean;
  onEditMaterial: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
  onAddSubMaterial: (groupId: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasSearch: boolean;
  onClearFilters: () => void;
}

export function MaterialesGrid({
  items,
  canViewProveedores = false,
  onEditMaterial,
  onViewProveedores,
  onAddSubMaterial,
  page,
  totalPages,
  onPageChange,
  hasSearch,
  onClearFilters,
}: MaterialesGridProps) {
  const baseWidths = COLUMNS.map((c) => c.width).join(" ");
  const templateColumns = canViewProveedores
    ? `${baseWidths} ${PROVEEDORES_WIDTH} auto`
    : `${baseWidths} auto`;

  const groups = items.filter((item) => item.tipo === "grupo");
  const individuals = items.filter((item) => item.tipo !== "grupo");
  const hasItems = items.length > 0;

  return (
    <section className="space-y-3">
      <div className="bg-transparent md:bg-white rounded">
        <div className="space-y-4 md:space-y-2">
          {hasItems && (
            <div
              className="hidden md:grid items-center gap-4 px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] text-sm font-bold"
              style={{ gridTemplateColumns: templateColumns }}
            >
              {COLUMNS.map((col) => (
                <span key={col.label} className="text-center flex items-center justify-center">
                  {col.label}
                </span>
              ))}
              {canViewProveedores && (
                <span className="text-center flex items-center justify-center">Proveedores</span>
              )}
              <span />
            </div>
          )}

          {!hasItems ? (
            <MaterialesEmptyState hasSearch={hasSearch} onClearFilters={onClearFilters} />
          ) : (
            <>
              {groups.map((group) => (
                <MaterialGroupCard
                  key={group.id}
                  group={group}
                  canViewProveedores={canViewProveedores}
                  gridTemplateColumns={templateColumns}
                  onEdit={onEditMaterial}
                  onViewProveedores={onViewProveedores}
                  onAddSubMaterial={onAddSubMaterial}
                />
              ))}

              {individuals.map((item) => (
                <MaterialCard
                  key={item.id}
                  {...item}
                  showProveedores={canViewProveedores}
                  gridTemplateColumns={templateColumns}
                  onEdit={onEditMaterial}
                  onViewProveedores={onViewProveedores}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <PaginacionControles page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  );
}
