"use client";

import type { Clientes } from "@prisma/client";
import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { ClientesTable } from "@/components/ui/clientes";

export function ClientesView() {
  const [clientes, setClientes] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClientes() {
      try {
        setLoading(true);
        const res = await fetch("/api/clientes?pageSize=100");
        if (!res.ok) throw new Error("Falla al cargar clientes");
        const json = await res.json();
        setClientes(json.data || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar la lista de clientes. Por favor, intente de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
      (c.empresa?.toLowerCase() || "").includes(search.toLowerCase()) ||
      c.correo_electronico.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AdminHeader title="Clientes" />

      <main className="p-8">
        <AdminToolbar search={search} onSearchChange={setSearch} />

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md font-ibm-plex">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e42200]"></div>
            <span className="ml-4 text-[#8e908f] font-medium font-ibm-plex">
              Cargando clientes...
            </span>
          </div>
        ) : (
          <ClientesTable items={filteredClientes} />
        )}
      </main>
    </div>
  );
}
