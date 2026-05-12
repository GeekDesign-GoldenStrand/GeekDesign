"use client";

import type { Clientes } from "@prisma/client";
import { useEffect, useState, useCallback } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { ClientesTable, type ClientCategory } from "@/components/ui/clientes";

export function ClientesView() {
  // State for data management, loading, errors, and search
  const [clientes, setClientes] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Data loading from the API
  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/clientes?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load clients");
      const json = await res.json();
      setClientes(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la lista de clientes. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AdminHeader title="Clientes" />

      <main className="p-8">
        <AdminToolbar search={search} onSearchChange={setSearch} />

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md font-ibm-plex">
            {error}
          </div>
        ) : (
          <ClientesTable
            items={clientes}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onUpdateCategory={handleUpdateCategory}
          />
        )}
      </main>
    </div>
  );
}
