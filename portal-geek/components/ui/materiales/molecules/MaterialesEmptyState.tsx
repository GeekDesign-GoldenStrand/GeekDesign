import { Button } from "@/components/ui/atoms/Button";

interface MaterialesEmptyStateProps {
  // True when a search term or active filter caused the empty result.
  hasSearch: boolean;
  onClearFilters: () => void;
}

export function MaterialesEmptyState({ hasSearch, onClearFilters }: MaterialesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-[#8e908f] text-[16px]">
        {hasSearch
          ? "No se encontraron materiales con esos filtros."
          : "No hay materiales registrados."}
      </p>

      {hasSearch && (
        <Button variant="secondary" size="sm" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
