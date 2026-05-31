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
import type {
  MaterialCardProps,
  MaterialSortOrder,
  MaterialTipoFilter,
  MaterialesVisibleColumns,
  UserRole,
} from "@/types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type Tipo = "individual" | "grupo" | "sub" | "categoria";

function buildDefaultColumns(canViewProveedores: boolean): MaterialesVisibleColumns {
  return {
    name: true,
    description: true,
    unit: true,
    width: true,
    height: true,
    thickness: true,
    color: true,
    image: true,
    proveedores: canViewProveedores,
  };
}

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

// Recursive tree updaters (max 3 levels: categoría → grupo|individual → variante).
function insertChild(
  nodes: MaterialCardProps[],
  parentId: number,
  child: MaterialCardProps
): MaterialCardProps[] {
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, subMateriales: [...(n.subMateriales ?? []), child] };
    }
    if (n.subMateriales?.length) {
      return { ...n, subMateriales: insertChild(n.subMateriales, parentId, child) };
    }
    return n;
  });
}

function replaceNode(nodes: MaterialCardProps[], row: MaterialCardProps): MaterialCardProps[] {
  return nodes.map((n) => {
    if (n.id === row.id) return { ...row, subMateriales: n.subMateriales };
    if (n.subMateriales?.length) {
      return { ...n, subMateriales: replaceNode(n.subMateriales, row) };
    }
    return n;
  });
}

function removeNode(nodes: MaterialCardProps[], id: number): MaterialCardProps[] {
  const filtered = nodes.filter((n) => n.id !== id);
  return filtered.map((n) =>
    n.subMateriales?.length ? { ...n, subMateriales: removeNode(n.subMateriales, id) } : n
  );
}

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { loading: false, error: null, rows: action.rows, totalPages: action.totalPages };
    case "error":
      return { ...state, loading: false, error: "No se pudieron cargar los materiales" };

    case "add": {
      if (action.row.id_material_padre != null) {
        return {
          ...state,
          rows: insertChild(state.rows, action.row.id_material_padre, action.row),
        };
      }
      return { ...state, rows: [action.row, ...state.rows] };
    }

    case "update":
      return { ...state, rows: replaceNode(state.rows, action.row) };

    case "remove":
      return { ...state, rows: removeNode(state.rows, action.id) };
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
  const [visibleColumns, setVisibleColumns] = useState<MaterialesVisibleColumns>(() =>
    buildDefaultColumns(canViewProveedores)
  );
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
        const items = ((payload?.data ?? []) as MaterialApiRow[]).map((row) => mapMaterialRow(row));
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

  function handleToggleColumn(key: keyof MaterialesVisibleColumns) {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  function handleResetFilters() {
    setVisibleColumns(buildDefaultColumns(canViewProveedores));
    setSortOrder("az");
    setTipoFilter("all");
    setSearch("");
  }

  function handleSortChange(order: MaterialSortOrder) {
    setSortOrder(order);
    setPage(1);
  }

  function handleTipoFilterChange(value: MaterialTipoFilter) {
    setTipoFilter(value);
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

  function handleAddGrupo(categoriaId: number) {
    setAddModalTipo("grupo");
    setAddModalPadreId(categoriaId);
    setShowAddModal(true);
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-ibm-plex">
      <AdminHeader title="Materiales" />
      <main className="py-6">
        <section className="max-w-[1350px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
          <MaterialesToolbar
            search={search}
            onSearchChange={setSearch}
            isFilterOpen={showFilters}
            visibleColumns={visibleColumns}
            sortOrder={sortOrder}
            tipoFilter={tipoFilter}
            onToggleColumn={handleToggleColumn}
            onSortChange={handleSortChange}
            onTipoFilterChange={handleTipoFilterChange}
            onResetFilters={handleResetFilters}
            onAddClick={handleOpenAddModal}
            onFilterClick={() => setShowFilters((state) => !state)}
            onCloseFilter={() => setShowFilters(false)}
            canViewProveedores={canViewProveedores}
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
              onViewProveedores={handleViewProveedores}
              onAddSubMaterial={handleAddSubMaterial}
              onAddGrupo={handleAddGrupo}
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
