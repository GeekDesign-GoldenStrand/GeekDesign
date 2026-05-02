"use client";

import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import {
  AgregarTerceroModal,
  ConfirmarEliminarProveedorModal,
  EditarProveedorModal,
  TercerosGrid,
  TercerosHeader,
} from "@/components/ui/terceros";
import type { ProveedorFormData } from "@/components/ui/terceros/organisms/EditarProveedorModal";
import type { UpdateProveedorInput } from "@/lib/schemas/proveedores";
import type { TerceroCardProps, TerceroStatus, TercerosTab as Tab } from "@/types";

type TerceroRow = TerceroCardProps;

type DbInstalador = {
  id_instalador: number;
  nombre_instalador: string;
  apodo: string | null;
  ubicacion: string | null;
  estatus: string;
  correo: string | null;
  telefono: string | null;
};

type DbProveedor = {
  id_proveedor: number;
  nombre_proveedor: string;
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
    contactName: item.nombre_proveedor,
    location: item.ubicacion ?? "",
    role: "Proveedor",
    status:
      item.estatus === "Activo" ? "Activo" : item.estatus === "Baneado" ? "Baneado" : "Inactivo",
    email: item.correo ?? "",
    phone: item.telefono ?? "",
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

  // PROV-03 – delete
  const [deletingProveedor, setDeletingProveedor] = useState<{ id: number; name: string } | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setEditingProveedorId(id);
    setEditData(null);
    setEditError(null);
    const res = await fetch(`/api/proveedores/${id}`);
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
    }));

  const initialModalType = activeTab === "Instaladores" ? "Instalador" : "Proveedor";

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-white">
      <TercerosHeader />
      <main className="p-8">
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
          onClose={() => setEditingProveedorId(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      <ConfirmarEliminarProveedorModal
        isOpen={deletingProveedor !== null}
        proveedorName={deletingProveedor?.name ?? ""}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setDeletingProveedor(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
