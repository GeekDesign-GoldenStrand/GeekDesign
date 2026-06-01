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
import type { MaterialCardProps, MaterialSortOrder, MaterialTipoFilter, UserRole } from "@/types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type Tipo = "individual" | "grupo" | "sub";

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

    case "add": {
      if (action.row.tipo === "sub" && action.row.id_material_padre !== null) {
        return {
          ...state,
          rows: state.rows.map((r) =>
            r.id === action.row.id_material_padre
              ? { ...r, subMateriales: [...(r.subMateriales ?? []), action.row] }
              : r
          ),
        };
      }
      return { ...state, rows: [action.row, ...state.rows] };
    }

    case "update": {
      if (action.row.tipo === "sub" && action.row.id_material_padre !== null) {
        return {
          ...state,
          rows: state.rows.map((r) =>
            r.id === action.row.id_material_padre
              ? {
                  ...r,
                  subMateriales: (r.subMateriales ?? []).map((s) =>
                    s.id === action.row.id ? action.row : s
                  ),
                }
              : r
          ),
        };
      }
      return { ...state, rows: state.rows.map((r) => (r.id === action.row.id ? action.row : r)) };
    }

    case "remove": {
      const isTopLevel = state.rows.some((r) => r.id === action.id);
      if (isTopLevel) {
        return { ...state, rows: state.rows.filter((r) => r.id !== action.id) };
      }
      return {
        ...state,
        rows: state.rows.map((r) => ({
          ...r,
          subMateriales: (r.subMateriales ?? []).filter((s) => s.id !== action.id),
        })),
      };
    }
  }
}

export function MaterialesView({ role }: { role: UserRole }) {
  const canViewProveedores = role !== "Colaborador";
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
  const [addModalTipo, setAddModalTipo] = useState<Tipo>("individual");
  const [addModalPadreId, setAddModalPadreId] = useState<number | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [showProveedoresModal, setShowProveedoresModal] = useState(false);
  const [proveedoresMaterialId, setProveedoresMaterialId] = useState<number | null>(null);
  const [proveedoresMaterialName, setProveedoresMaterialName] = useState("");
  const [sortOrder, setSortOrder] = useState<MaterialSortOrder>("az");
  const [tipoFilter, setTipoFilter] = useState<MaterialTipoFilter>("all");
  const [page, setPage] = useState(1);
  const [retryAttempt, setRetryAttempt] = useState(0);

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
    if (tipoFilter !== "all") params.set("tipo", tipoFilter);

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
  }, [page, sortOrder, debouncedSearch, tipoFilter, retryAttempt]);

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
  }

  function handleRetry() {
    setRetryAttempt((n) => n + 1);
  }

  function handleResetFilters() {
    setSortOrder("az");
    setTipoFilter("all");
    setSearch("");
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

  function handleViewProveedores(materialId: number, materialName: string) {
    setProveedoresMaterialId(materialId);
    setProveedoresMaterialName(materialName);
    setShowProveedoresModal(true);
  }

  function handleProveedoresClose() {
    setShowProveedoresModal(false);
    setProveedoresMaterialId(null);
    setProveedoresMaterialName("");
  }

  function handleUpdated(row: MaterialCardProps) {
    dispatch({ type: "update", row });
  }

  function handleDeleted(materialId: number) {
    dispatch({ type: "remove", id: materialId });
  }

  function handleAddSubMaterial(groupId: number) {
    setAddModalTipo("sub");
    setAddModalPadreId(groupId);
    setShowAddModal(true);
  }

  function handleSortChange(order: MaterialSortOrder) {
    setSortOrder(order);
    setPage(1);
  }

  function handleTipoFilterChange(value: MaterialTipoFilter) {
    setTipoFilter(value);
    setPage(1);
  }

  function handleOpenAddModal() {
    setAddModalTipo("individual");
    setAddModalPadreId(undefined);
    setShowAddModal(true);
  }

  function handleAddModalClose() {
    setShowAddModal(false);
    setAddModalTipo("individual");
    setAddModalPadreId(undefined);
  }

  const activeFilterChips = [
    sortOrder !== "az"
      ? {
          key: "sort",
          label: "Orden: Z a A",
          clear: () => {
            setSortOrder("az");
            setPage(1);
          },
        }
      : null,
    tipoFilter === "grupos"
      ? {
          key: "tipo",
          label: "Solo grupos",
          clear: () => {
            setTipoFilter("all");
            setPage(1);
          },
        }
      : null,
    tipoFilter === "individuales"
      ? {
          key: "tipo",
          label: "Sin grupo",
          clear: () => {
            setTipoFilter("all");
            setPage(1);
          },
        }
      : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-ibm-plex">
      <AdminHeader title="Materiales" />
      <main className="py-6">
        <section className="max-w-[1350px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
          <MaterialesToolbar
            search={search}
            onSearchChange={setSearch}
            isFilterOpen={showFilters}
            sortOrder={sortOrder}
            tipoFilter={tipoFilter}
            onSortChange={handleSortChange}
            onTipoFilterChange={handleTipoFilterChange}
            onResetFilters={handleResetFilters}
            onAddClick={handleOpenAddModal}
            onFilterClick={() => setShowFilters((s) => !s)}
            onCloseFilter={() => setShowFilters(false)}
          />

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffecec] border border-[#e42200]/30 text-[12px] font-medium text-[#e42200]"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Quitar filtro ${chip.label}`}
                    className="leading-none hover:text-[#b31a00]"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[12px] text-[#8e908f] underline hover:text-[#1e1e1e] transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}

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
              canViewProveedores={canViewProveedores}
              onEditMaterial={handleEditClick}
              onViewProveedores={handleViewProveedores}
              onAddSubMaterial={handleAddSubMaterial}
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
        onClose={handleAddModalClose}
        onCreated={handleCreated}
        initialTipo={addModalTipo}
        initialPadreId={addModalPadreId}
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
        isOpen={showProveedoresModal}
        materialId={proveedoresMaterialId}
        materialName={proveedoresMaterialName}
        onClose={handleProveedoresClose}
      />
    </div>
  );
}
