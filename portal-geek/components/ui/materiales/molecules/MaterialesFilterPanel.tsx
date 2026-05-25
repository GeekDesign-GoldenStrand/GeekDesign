import type { MaterialSortOrder, MaterialTipoFilter, MaterialesVisibleColumns } from "@/types";

interface MaterialesFilterPanelProps {
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  onToggleColumn: (key: keyof MaterialesVisibleColumns) => void;
  onSortChange: (order: MaterialSortOrder) => void;
  onTipoFilterChange: (value: MaterialTipoFilter) => void;
  onReset: () => void;
  onClose: () => void;
  canViewProveedores?: boolean;
}

const COLUMN_OPTIONS: Array<{ key: keyof MaterialesVisibleColumns; label: string }> = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "unit", label: "Unidad de medida" },
  { key: "width", label: "Ancho" },
  { key: "height", label: "Alto" },
  { key: "thickness", label: "Grosor" },
  { key: "color", label: "Color" },
  { key: "image", label: "Imagen" },
  { key: "proveedores", label: "Proveedores" },
];

export function MaterialesFilterPanel({
  visibleColumns,
  sortOrder,
  tipoFilter,
  onToggleColumn,
  onSortChange,
  onTipoFilterChange,
  onReset,
  onClose,
  canViewProveedores = true,
}: MaterialesFilterPanelProps) {
  const columnOptions = canViewProveedores
    ? COLUMN_OPTIONS
    : COLUMN_OPTIONS.filter((o) => o.key !== "proveedores");
  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[26rem] rounded-[14px] border-4 border-[#ff7f7f] bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
      <div className="flex gap-5">
        <section className="flex-1 min-w-0">
          <p className="text-[24px] leading-none font-semibold text-[#1e1e1e] mb-2">Columnas</p>
          <div className="space-y-1.5">
            {columnOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[option.key]}
                  onChange={() => onToggleColumn(option.key)}
                  className="h-3.5 w-3.5 accent-[#ff7f7f]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4 w-[9rem] shrink-0">
          <section>
            <p className="text-[24px] leading-none font-semibold text-[#1e1e1e] mb-2">Orden</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="material-order"
                  checked={sortOrder === "az"}
                  onChange={() => onSortChange("az")}
                  className="h-3.5 w-3.5 accent-[#6b7280]"
                />
                De la A a la Z
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="material-order"
                  checked={sortOrder === "za"}
                  onChange={() => onSortChange("za")}
                  className="h-3.5 w-3.5 accent-[#6b7280]"
                />
                De la Z a la A
              </label>
            </div>
          </section>

          <section>
            <p className="text-[24px] leading-none font-semibold text-[#1e1e1e] mb-2">Ver</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="material-tipo"
                  checked={tipoFilter === "all"}
                  onChange={() => onTipoFilterChange("all")}
                  className="h-3.5 w-3.5 accent-[#6b7280]"
                />
                Todos
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="material-tipo"
                  checked={tipoFilter === "grupos"}
                  onChange={() => onTipoFilterChange("grupos")}
                  className="h-3.5 w-3.5 accent-[#6b7280]"
                />
                Solo grupos
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="material-tipo"
                  checked={tipoFilter === "individuales"}
                  onChange={() => onTipoFilterChange("individuales")}
                  className="h-3.5 w-3.5 accent-[#6b7280]"
                />
                Sin grupo
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {/* Footer actions to reset and close without leaving the page context. */}
        <button
          onClick={onReset}
          className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
        >
          Restablecer
        </button>
        <button
          onClick={onClose}
          className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
