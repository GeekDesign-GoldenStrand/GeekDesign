"use client";

import { useEffect, useRef, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import {
  AgregarTerceroModal,
  ConfirmarEliminarInstaladorModal,
  ConfirmarEliminarProveedorModal,
  EditarInstaladorModal,
  EditarProveedorModal,
  TercerosGrid,
  TercerosHeader,
} from "@/components/ui/terceros";
import type { InstaladorFormData } from "@/components/ui/terceros/organisms/EditarInstaladorModal";
import type { ProveedorFormData } from "@/components/ui/terceros/organisms/EditarProveedorModal";
import type { UpdateInstaladorInput } from "@/lib/schemas/instaladores";
import type { UpdateProveedorInput } from "@/lib/schemas/proveedores";
import type { TerceroCardProps, TerceroStatus, TercerosTab as Tab } from "@/types";

type TerceroRow = TerceroCardProps;

type DbInstalador = {
  id_instalador: number;
  nombre_instalador: string;
  apodo: string | null;
  tipo: string;
  ubicacion: string | null;
  estatus: string;
  correo: string;
  telefono: string;
  notas: string | null;
};

type DbProveedor = {
  id_proveedor: number;
  nombre_proveedor: string;
  apodo: string | null;
  tipo: string;
  ubicacion: string | null;
  estatus: string;
  correo: string | null;
  telefono: string | null;
  descripcion_proveedor: string | null;
};

function mapInstalador(item: DbInstalador): TerceroRow {
  return {
    id: item.id_instalador,
    companyName: item.nombre_instalador,
    contactName: item.apodo ?? item.nombre_instalador,
    location: item.ubicacion ?? "",
    role: "Instalador",
    status:
      item.estatus === "Activo" ? "Activo" : item.estatus === "Baneado" ? "Baneado" : "Inactivo",
    email: item.correo ?? "",
    phone: item.telefono ?? "",
  };
}

function mapProveedor(item: DbProveedor): TerceroRow {
  return {
    id: item.id_proveedor,
    companyName: item.nombre_proveedor,
    contactName: item.apodo ?? item.nombre_proveedor,
    location: item.ubicacion ?? "",
    role: "Proveedor",
    status:
      item.estatus === "Activo" ? "Activo" : item.estatus === "Baneado" ? "Baneado" : "Inactivo",
    email: item.correo ?? "",
    phone: item.telefono ?? "",
    tipo: item.tipo,
  };
}

const TABS: Tab[] = ["Todos", "Proveedores", "Instaladores"];

export default function TercerosPage() {
  const [rows, setRows] = useState<TerceroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // PROV-02 – edit
  const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);
  const [editData, setEditData] = useState<ProveedorFormData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editControllerRef = useRef<AbortController | null>(null);

  // PROV-03 – delete
  const [deletingProveedor, setDeletingProveedor] = useState<{ id: number; name: string } | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // INST-02 – edit
  const [editingInstaladorId, setEditingInstaladorId] = useState<number | null>(null);
  const [editInstaladorData, setEditInstaladorData] = useState<InstaladorFormData | null>(null);
  const [editInstaladorLoading, setEditInstaladorLoading] = useState(false);
  const [editInstaladorError, setEditInstaladorError] = useState<string | null>(null);
  const editInstaladorControllerRef = useRef<AbortController | null>(null);

  // INST-03 – delete
  const [deletingInstalador, setDeletingInstalador] = useState<{ id: number; name: string } | null>(
    null
  );
  const [deleteInstaladorLoading, setDeleteInstaladorLoading] = useState(false);
  const [deleteInstaladorError, setDeleteInstaladorError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/instaladores?pageSize=100").then((r) => r.json()),
      fetch("/api/proveedores?pageSize=100").then((r) => r.json()),
    ])
      .then(([instRes, provRes]) => {
        const instaladores = (instRes.data ?? []).map(mapInstalador);
        const proveedores = (provRes.data ?? []).map(mapProveedor);
        setRows([...instaladores, ...proveedores]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(
    id: number,
    newStatus: TerceroStatus,
    role: TerceroRow["role"]
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id && r.role === role ? { ...r, status: newStatus } : r))
    );
    const endpoint = role === "Instalador" ? "instaladores" : "proveedores";
    await fetch(`/api/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: newStatus }),
    });
  }

  function handleCreated(newRow: TerceroRow) {
    setRows((prev) => [...prev, newRow]);
  }

  // ── PROV-02 ──────────────────────────────────────────────────────────────

  async function openEditModal(id: number) {
    editControllerRef.current?.abort();
    const controller = new AbortController();
    editControllerRef.current = controller;

    setEditingProveedorId(id);
    setEditData(null);
    setEditError(null);
    try {
      const res = await fetch(`/api/proveedores/${id}`, { signal: controller.signal });
      const payload = await res.json();
      if (!res.ok) {
        setEditError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      const d: DbProveedor = payload.data;
      setEditData({
        nombre_proveedor: d.nombre_proveedor,
        tipo: d.tipo as ProveedorFormData["tipo"],
        correo: d.correo ?? "",
        telefono: d.telefono ?? "",
        ubicacion: d.ubicacion ?? "",
        descripcion_proveedor: d.descripcion_proveedor ?? "",
        estatus: d.estatus,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setEditError("Error inesperado al cargar el proveedor");
      }
    }
  }

  async function handleEditSubmit(data: UpdateProveedorInput) {
    if (!editingProveedorId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/proveedores/${editingProveedorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        setEditError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      const updated: DbProveedor = payload.data;
      setRows((prev) =>
        prev.map((r) =>
          r.id === updated.id_proveedor && r.role === "Proveedor"
            ? {
                ...r,
                companyName: updated.nombre_proveedor,
                contactName: updated.nombre_proveedor,
                location: updated.ubicacion ?? "",
                email: updated.correo ?? "",
                phone: updated.telefono ?? "",
                status:
                  updated.estatus === "Activo"
                    ? "Activo"
                    : updated.estatus === "Baneado"
                      ? "Baneado"
                      : "Inactivo",
              }
            : r
        )
      );
      setEditingProveedorId(null);
      setEditData(null);
    } finally {
      setEditLoading(false);
    }
  }

  // ── PROV-03 ──────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!deletingProveedor) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/proveedores/${deletingProveedor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setDeleteError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      setRows((prev) =>
        prev.filter((r) => !(r.id === deletingProveedor.id && r.role === "Proveedor"))
      );
      setDeletingProveedor(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── INST-02 ──────────────────────────────────────────────────────────────

  async function openEditInstaladorModal(id: number) {
    editInstaladorControllerRef.current?.abort();
    const controller = new AbortController();
    editInstaladorControllerRef.current = controller;

    setEditingInstaladorId(id);
    setEditInstaladorData(null);
    setEditInstaladorError(null);
    try {
      const res = await fetch(`/api/instaladores/${id}`, { signal: controller.signal });
      const payload = await res.json();
      if (!res.ok) {
        setEditInstaladorError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      const d: DbInstalador = payload.data;
      setEditInstaladorData({
        nombre_instalador: d.nombre_instalador,
        apodo: d.apodo ?? "",
        tipo: d.tipo as InstaladorFormData["tipo"],
        correo: d.correo,
        telefono: d.telefono,
        ubicacion: d.ubicacion ?? "",
        notas: d.notas ?? "",
        estatus: d.estatus,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setEditInstaladorError("Error inesperado al cargar el instalador");
      }
    }
  }

  async function handleEditInstaladorSubmit(data: UpdateInstaladorInput) {
    if (!editingInstaladorId) return;
    setEditInstaladorLoading(true);
    setEditInstaladorError(null);
    try {
      const res = await fetch(`/api/instaladores/${editingInstaladorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        setEditInstaladorError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      const updated: DbInstalador = payload.data;
      setRows((prev) =>
        prev.map((r) =>
          r.id === updated.id_instalador && r.role === "Instalador"
            ? {
                ...r,
                companyName: updated.nombre_instalador,
                contactName: updated.apodo ?? updated.nombre_instalador,
                location: updated.ubicacion ?? "",
                email: updated.correo,
                phone: updated.telefono,
                status:
                  updated.estatus === "Activo"
                    ? "Activo"
                    : updated.estatus === "Baneado"
                      ? "Baneado"
                      : "Inactivo",
              }
            : r
        )
      );
      setEditingInstaladorId(null);
      setEditInstaladorData(null);
    } finally {
      setEditInstaladorLoading(false);
    }
  }

  // ── INST-03 ──────────────────────────────────────────────────────────────

  async function handleDeleteInstaladorConfirm() {
    if (!deletingInstalador) return;
    setDeleteInstaladorLoading(true);
    setDeleteInstaladorError(null);
    try {
      const res = await fetch(`/api/instaladores/${deletingInstalador.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setDeleteInstaladorError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      setRows((prev) =>
        prev.filter((r) => !(r.id === deletingInstalador.id && r.role === "Instalador"))
      );
      setDeletingInstalador(null);
    } finally {
      setDeleteInstaladorLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const filtered = rows
    .filter((r) => {
      const matchesTab =
        activeTab === "Todos" ||
        (activeTab === "Instaladores" && r.role === "Instalador") ||
        (activeTab === "Proveedores" && r.role === "Proveedor");

      const matchesSearch =
        !search ||
        r.companyName.toLowerCase().includes(search.toLowerCase()) ||
        r.contactName.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    })
    .map((r) => ({
      ...r,
      onStatusChange: (newStatus: TerceroStatus) => handleStatusChange(r.id, newStatus, r.role),
      ...(r.role === "Proveedor" && {
        onEdit: () => openEditModal(r.id),
        onDelete: () => {
          setDeletingProveedor({ id: r.id, name: r.companyName });
          setDeleteError(null);
        },
      }),
      ...(r.role === "Instalador" && {
        onEdit: () => openEditInstaladorModal(r.id),
        onDelete: () => {
          setDeletingInstalador({ id: r.id, name: r.companyName });
          setDeleteInstaladorError(null);
        },
      }),
    }));

  const initialModalType = activeTab === "Instaladores" ? "Instalador" : "Proveedor";

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-white">
      <TercerosHeader />
      <main className="p-4 md:p-8">
        <AdminToolbar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as Tab)}
          search={search}
          onSearchChange={setSearch}
          onAgregar={() => setIsModalOpen(true)}
        />
        {loading ? (
          <p className="text-[#8e908f] text-[16px]">Cargando...</p>
        ) : (
          <TercerosGrid items={filtered} />
        )}
      </main>

      <AgregarTerceroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
        initialType={initialModalType}
      />

      {editData && (
        <EditarProveedorModal
          key={editingProveedorId ?? 0}
          isOpen
          initialData={editData}
          loading={editLoading}
          serverError={editError}
          onClose={() => {
            setEditingProveedorId(null);
            setEditData(null);
          }}
          onSubmit={handleEditSubmit}
        />
      )}
      {editingProveedorId !== null && !editData && editError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-[8px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-5 py-3 shadow-lg">
          {editError}
        </div>
      )}

      <ConfirmarEliminarProveedorModal
        isOpen={deletingProveedor !== null}
        proveedorName={deletingProveedor?.name ?? ""}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setDeletingProveedor(null)}
        onConfirm={handleDeleteConfirm}
      />

      {editInstaladorData && (
        <EditarInstaladorModal
          key={editingInstaladorId ?? 0}
          isOpen
          initialData={editInstaladorData}
          loading={editInstaladorLoading}
          serverError={editInstaladorError}
          onClose={() => {
            setEditingInstaladorId(null);
            setEditInstaladorData(null);
          }}
          onSubmit={handleEditInstaladorSubmit}
        />
      )}
      {editingInstaladorId !== null && !editInstaladorData && editInstaladorError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-[8px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-5 py-3 shadow-lg">
          {editInstaladorError}
        </div>
      )}

      <ConfirmarEliminarInstaladorModal
        isOpen={deletingInstalador !== null}
        instaladorName={deletingInstalador?.name ?? ""}
        loading={deleteInstaladorLoading}
        serverError={deleteInstaladorError}
        onClose={() => setDeletingInstalador(null)}
        onConfirm={handleDeleteInstaladorConfirm}
      />
    </div>
  );
}
