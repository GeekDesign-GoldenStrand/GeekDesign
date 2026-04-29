"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AgregarMaterialModal,
  EditarMaterialModal,
  MaterialesGrid,
  MaterialesHeader,
  MaterialesToolbar,
} from "@/components/ui/materiales";
import type { MaterialCardProps, MaterialSortOrder, MaterialesVisibleColumns } from "@/types";

// How many materials to fetch per page
const PAGE_SIZE = 10;

type DbMaterial = {
  id_material: number;
  nombre_material: string;
  descripcion_material: string | null;
  unidad_medida: string;
  ancho: string | number | null;
  alto: string | number | null;
  grosor: string | number | null;
  color: string | null;
  imagen_url: string | null;
};

function normalizeDecimal(value: string | number | null): string {
  // Normalize units for UI rendering.
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function mapMaterial(item: DbMaterial): MaterialCardProps {
  return {
    id: item.id_material,
    name: item.nombre_material,
    unit: item.unidad_medida,
    color: item.color ?? "-",
    width: normalizeDecimal(item.ancho),
    height: normalizeDecimal(item.alto),
    thickness: normalizeDecimal(item.grosor),
    description: item.descripcion_material ?? "",
    imageUrl: item.imagen_url ?? "",
  };
}

const DEFAULT_VISIBLE_COLUMNS: MaterialesVisibleColumns = {
  // All columns visible when the module loads.
  name: true,
  description: true,
  unit: true,
  width: true,
  height: true,
  thickness: true,
  color: true,
  image: true,
};

export default function MaterialesPage() {
  const [rows, setRows] = useState<MaterialCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // Only the ID is stored; EditarMaterialModal fetches fresh data on open.
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<MaterialSortOrder>("az");
  const [visibleColumns, setVisibleColumns] =
    useState<MaterialesVisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Incrementing this re-triggers the fetch effect without changing the page.
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    fetch(`/api/materiales?page=${page}&pageSize=${PAGE_SIZE}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        const items = ((payload?.data ?? []) as DbMaterial[]).map(mapMaterial);
        setRows(items);
        const total = payload?.total ?? 0;
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      })
      .catch(() => setError("No se pudieron cargar los materiales"))
      .finally(() => setLoading(false));
  }, [page, retryAttempt]);

  function handlePageChange(nextPage: number) {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  }

  function handleRetry() {
    setLoading(true);
    setError(null);
    setRetryAttempt((n) => n + 1);
  }

  const filtered = useMemo(() => {
    // Free-text search against the current page's rows.
    const q = search.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(q) ||
            row.unit.toLowerCase().includes(q) ||
            row.color.toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q)
        )
      : rows;

    return [...base].sort((a, b) => {
      const compare = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      return sortOrder === "az" ? compare : -compare;
    });
  }, [rows, search, sortOrder]);

  function handleToggleColumn(key: keyof MaterialesVisibleColumns) {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Keep at least one column visible to avoid empty rows.
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  function handleResetFilters() {
    // Restore all filter state (search, columns, sort) to initial configuration.
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setSortOrder("az");
    setSearch("");
  }

  function handleCreated(row: MaterialCardProps) {
    // Optimistically prepend the new item so users see it immediately.
    setRows((prev) => [row, ...prev]);
  }

  function handleEditClick(material: MaterialCardProps) {
    setSelectedMaterialId(material.id);
    setShowEditModal(true);
  }

  function handleEditClose() {
    setShowEditModal(false);
    setSelectedMaterialId(null);
  }

  function handleUpdated(row: MaterialCardProps) {
    // Update the row in the current page list.
    setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)));
  }

  function handleDeleted(materialId: number) {
    // Remove the deleted material from the current page list.
    setRows((prev) => prev.filter((item) => item.id !== materialId));
  }

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-[#ececec]">
      <MaterialesHeader />
      <main className="p-8">
        <MaterialesToolbar
          search={search}
          onSearchChange={setSearch}
          isFilterOpen={showFilters}
          visibleColumns={visibleColumns}
          sortOrder={sortOrder}
          onToggleColumn={handleToggleColumn}
          onSortChange={setSortOrder}
          onResetFilters={handleResetFilters}
          onAddClick={() => setShowAddModal(true)}
          onFilterClick={() => setShowFilters((state) => !state)}
          onCloseFilter={() => setShowFilters(false)}
        />

        {loading && <p className="text-[#8e908f] text-[20px]">Cargando...</p>}

        {error && !loading && (
          <div className="flex flex-col gap-3">
            <p className="text-[#e42200] text-[16px]">{error}</p>
            <button
              onClick={handleRetry}
              className="self-start px-4 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <MaterialesGrid
            items={filtered}
            visibleColumns={visibleColumns}
            onEditMaterial={handleEditClick}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hasSearch={!!search.trim()}
            onClearFilters={handleResetFilters}
          />
        )}
      </main>

      <AgregarMaterialModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />

      <EditarMaterialModal
        key={`${showEditModal}-${selectedMaterialId ?? "none"}`}
        isOpen={showEditModal}
        materialId={selectedMaterialId}
        onClose={handleEditClose}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
