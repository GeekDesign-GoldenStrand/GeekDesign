"use client";

import { useEffect, useReducer, useState } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import {
  AgregarMaterialModal,
  EditarMaterialModal,
  MaterialesGrid,
  MaterialesToolbar,
  ProveedoresModal,
} from "@/components/ui/materiales";
import { mapMaterialRow, type MaterialApiRow } from "@/lib/utils/materiales";
import type { MaterialCardProps, MaterialSortOrder, MaterialesVisibleColumns } from "@/types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_VISIBLE_COLUMNS: MaterialesVisibleColumns = {
  name: true,
  description: true,
  unit: true,
  width: true,
  height: true,
  thickness: true,
  color: true,
  image: true,
  personas: true,
};

type FetchState = {
  loading: boolean;
  error: string | null;
  rows: MaterialCardProps[];
  totalPages: number;
};

type FetchAction =
  | { type: "start" }
  | { type: "success"; rows: MaterialCardProps[]; totalPages: number }
  | { type: "error" }
  | { type: "add"; row: MaterialCardProps }
  | { type: "update"; row: MaterialCardProps }
  | { type: "remove"; id: number };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { loading: false, error: null, rows: action.rows, totalPages: action.totalPages };
    case "error":
      return { ...state, loading: false, error: "No se pudieron cargar los materiales" };
    case "add":
      return { ...state, rows: [action.row, ...state.rows] };
    case "update":
      return { ...state, rows: state.rows.map((r) => (r.id === action.row.id ? action.row : r)) };
    case "remove":
      return { ...state, rows: state.rows.filter((r) => r.id !== action.id) };
  }
}

export function MaterialesView() {
  const [{ loading, error, rows, totalPages }, dispatch] = useReducer(fetchReducer, {
    loading: true,
    error: null,
    rows: [],
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [showPersonasModal, setShowPersonasModal] = useState(false);
  const [personasMaterialId, setPersonasMaterialId] = useState<number | null>(null);
  const [personasMaterialName, setPersonasMaterialName] = useState("");
  const [sortOrder, setSortOrder] = useState<MaterialSortOrder>("az");
  const [visibleColumns, setVisibleColumns] =
    useState<MaterialesVisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [page, setPage] = useState(1);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Debounce search and reset page together so only one fetch fires.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    dispatch({ type: "start" });
    const abortController = new AbortController();
    const sort = sortOrder === "az" ? "asc" : "desc";
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
    });
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());

    fetch(`/api/materiales?${params}`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        if (abortController.signal.aborted) return;
        const items = ((payload?.data ?? []) as MaterialApiRow[]).map(mapMaterialRow);
        const total = payload?.total ?? 0;
        dispatch({
          type: "success",
          rows: items,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
      })
      .catch(() => {
        if (abortController.signal.aborted) return;
        dispatch({ type: "error" });
      });

    return () => {
      abortController.abort();
    };
  }, [page, sortOrder, debouncedSearch, retryAttempt]);

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
  }

  function handleRetry() {
    setRetryAttempt((n) => n + 1);
  }

  function handleToggleColumn(key: keyof MaterialesVisibleColumns) {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  function handleResetFilters() {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setSortOrder("az");
    setSearch("");
  }

  function handleSortChange(order: MaterialSortOrder) {
    setSortOrder(order);
    setPage(1);
  }

  function handleCreated(row: MaterialCardProps) {
    dispatch({ type: "add", row });
  }

  function handleEditClick(material: MaterialCardProps) {
    setSelectedMaterialId(material.id);
    setShowEditModal(true);
  }

  function handleEditClose() {
    setShowEditModal(false);
    setSelectedMaterialId(null);
  }

  function handleViewPersonas(materialId: number, materialName: string) {
    setPersonasMaterialId(materialId);
    setPersonasMaterialName(materialName);
    setShowPersonasModal(true);
  }

  function handlePersonasClose() {
    setShowPersonasModal(false);
    setPersonasMaterialId(null);
    setPersonasMaterialName("");
  }

  function handleUpdated(row: MaterialCardProps) {
    dispatch({ type: "update", row });
  }

  function handleDeleted(materialId: number) {
    dispatch({ type: "remove", id: materialId });
  }

  return (
    <div className="min-h-screen bg-[#ececec] font-ibm-plex">
      <AdminHeader title="Materiales" />
      <main className="py-6">
        <section className="max-w-[1350px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
          <MaterialesToolbar
            search={search}
            onSearchChange={setSearch}
            isFilterOpen={showFilters}
            visibleColumns={visibleColumns}
            sortOrder={sortOrder}
            onToggleColumn={handleToggleColumn}
            onSortChange={handleSortChange}
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
              items={rows}
              visibleColumns={visibleColumns}
              onEditMaterial={handleEditClick}
              onViewPersonas={handleViewPersonas}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasSearch={!!debouncedSearch.trim()}
              onClearFilters={handleResetFilters}
            />
          )}
        </section>
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

      <ProveedoresModal
        isOpen={showPersonasModal}
        materialId={personasMaterialId}
        materialName={personasMaterialName}
        onClose={handlePersonasClose}
      />
    </div>
  );
}
