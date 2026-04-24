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
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCardProps | null>(null);
  const [sortOrder, setSortOrder] = useState<MaterialSortOrder>("az");
  const [visibleColumns, setVisibleColumns] =
    useState<MaterialesVisibleColumns>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    // Initial read-only load for the materials catalog.
    fetch("/api/materiales?pageSize=100")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        const items = ((payload?.data ?? []) as DbMaterial[]).map(mapMaterial);
        setRows(items);
      })
      .catch(() => setError("No se pudieron cargar los materiales"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    // free-text search
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
      // Keep at least one column visible to avoid empty rows
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  function handleResetFilters() {
    // Restore filter popup state to its initial configuration
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setSortOrder("az");
  }

  function handleCreated(row: MaterialCardProps) {
    // Optimistically prepend the new item so users see it immediately
    setRows((prev) => [row, ...prev]);
  }

  function handleEditClick(material: MaterialCardProps) {
    setSelectedMaterial(material);
    setShowEditModal(true);
  }

  function handleEditClose() {
    setShowEditModal(false);
    setSelectedMaterial(null);
  }

  function handleUpdated(row: MaterialCardProps) {
    // Update the row in the list
    setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)));
  }

  function handleDeleted(materialId: number) {
    // Remove the deleted material from the list
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

        {error && !loading && <p className="text-[#e42200] text-[16px]">{error}</p>}

        {!loading && !error && (
          <MaterialesGrid
            items={filtered}
            visibleColumns={visibleColumns}
            onEditMaterial={handleEditClick}
          />
        )}
      </main>

      <AgregarMaterialModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />

      <EditarMaterialModal
        isOpen={showEditModal}
        material={selectedMaterial}
        onClose={handleEditClose}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
