"use client";

import { useEffect, useState } from "react";

import TercerosGrid from "@/components/ui/terceros/TercerosGrid";
import TercerosHeader from "@/components/ui/terceros/TercerosHeader";
import TercerosToolbar from "@/components/ui/terceros/TercerosToolbar";
import type { TerceroCardProps, TerceroStatus, TercerosTab as Tab } from "@/types";

type InstaladorRow = TerceroCardProps;

type DbInstalador = {
  id_instalador: number;
  nombre_proveedor: string;
  apodo: string | null;
  ubicacion: string | null;
  estatus: string;
  correo: string | null;
  telefono: string | null;
};

function mapInstalador(item: DbInstalador): InstaladorRow {
  return {
    id_instalador: item.id_instalador,
    companyName: item.nombre_proveedor,
    contactName: item.apodo ?? item.nombre_proveedor,
    location: item.ubicacion ?? "",
    role: "Instalador",
    status: item.estatus === "Activo" ? "Activo" : "Inactivo",
    email: item.correo ?? "",
    phone: item.telefono ?? "",
  };
}

const TABS: Tab[] = ["Todos", "Proveedores", "Instaladores"];

export default function TercerosPage() {
  const [rows, setRows] = useState<InstaladorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Instaladores");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/instaladores?pageSize=100")
      .then((r) => r.json())
      .then((json: { data: DbInstalador[] | null }) =>
        setRows((json.data ?? []).map(mapInstalador))
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id: number, newStatus: TerceroStatus) {
    setRows((prev) => prev.map((r) => (r.id_instalador === id ? { ...r, status: newStatus } : r)));
    await fetch(`/api/instaladores/${id}`, {
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
      onStatusChange: (newStatus: TerceroStatus) => handleStatusChange(r.id_instalador, newStatus),
    }));

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
        />
        {loading ? (
          <p className="text-[#8e908f] text-[16px]">Cargando...</p>
        ) : (
          <TercerosGrid items={filtered} />
        )}
      </main>
    </div>
  );
}
