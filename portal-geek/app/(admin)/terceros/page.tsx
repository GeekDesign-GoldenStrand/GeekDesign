"use client";

import { useEffect, useState } from "react";

import AgregarTerceroModal from "@/components/ui/terceros/AgregarTerceroModal";
import TercerosGrid from "@/components/ui/terceros/TercerosGrid";
import TercerosHeader from "@/components/ui/terceros/TercerosHeader";
import TercerosToolbar from "@/components/ui/terceros/TercerosToolbar";
import type { TerceroCardProps, TerceroStatus, TercerosTab as Tab } from "@/types";

type TerceroRow = TerceroCardProps;

type DbInstalador = {
  id_instalador: number;
  nombre_proveedor: string;
  apodo: string | null;
  ubicacion: string | null;
  estatus: string;
  correo: string | null;
  telefono: string | null;
};

type DbProveedor = {
  id_proveedor: number;
  nombre_proveedor: string;
  ubicacion: string | null;
  estatus: string;
  correo: string | null;
  telefono: string | null;
};

function mapInstalador(item: DbInstalador): TerceroRow {
  return {
    id: item.id_instalador,
    companyName: item.nombre_proveedor,
    contactName: item.apodo ?? item.nombre_proveedor,
    location: item.ubicacion ?? "",
    role: "Instalador",
    status: item.estatus === "Activo" ? "Activo" : "Inactivo",
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
    status: item.estatus === "Activo" ? "Activo" : "Inactivo",
    email: item.correo ?? "",
    phone: item.telefono ?? "",
  };
}

const TABS: Tab[] = ["Todos", "Proveedores", "Instaladores"];

export default function TercerosPage() {
  const [rows, setRows] = useState<TerceroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Instaladores");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    }));

  function handleCreated(newRow: TerceroRow) {
    setRows((prev) => [...prev, newRow]);
  }

  // Si estamos en la pestaña Instaladores, por defecto el modal abrirá como Instalador.
  const initialModalType = activeTab === "Instaladores" ? "Instalador" : "Proveedor";

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-white">
      <TercerosHeader />
      <main className="p-8">
        <TercerosToolbar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          onAddClick={() => setIsModalOpen(true)}
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
    </div>
  );
}
