"use client";

import type { Clientes } from "@prisma/client";
import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { ClientesTable, type ClientCategory } from "@/components/ui/clientes";

export function ClientesView() {
  // State for data management, loading, errors, and search
  const [clientes, setClientes] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Initial data loading from the API
  useEffect(() => {
    async function fetchClientes() {
      try {
        setLoading(true);
        const res = await fetch("/api/clientes?pageSize=100");
        if (!res.ok) throw new Error("Failed to load clients");
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

  // Update client category
  const handleUpdateCategory = async (id: number, category: ClientCategory) => {
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: category }),
      });

      if (!res.ok) throw new Error("Failed to update category");

      // Update local state
      setClientes((prev) =>
        prev.map((c) => (c.id_cliente === id ? { ...c, categoria: category } : c))
      );
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la categoría del cliente.");
    }
  };

  // Client-side filtering based on search term
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
          <ClientesTable items={filteredClientes} onUpdateCategory={handleUpdateCategory} />
        )}
      </main>
    </div>
  );
}
