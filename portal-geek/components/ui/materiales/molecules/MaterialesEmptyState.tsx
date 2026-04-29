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
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-[14px] font-medium text-[#006aff] border border-[#006aff] rounded-[6px] hover:bg-[#e8f0ff] transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
