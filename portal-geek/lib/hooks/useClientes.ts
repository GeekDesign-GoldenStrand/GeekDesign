"use client";

import { useEffect, useState } from "react";

export type ClienteOption = { id: number; nombre: string };

type ClienteApi = { id_cliente: number; nombre_cliente: string };

/**
 * Fetches the complete clientes catalog by walking every page of
 * /api/clientes, so filter dropdowns aren't silently capped at one page.
 *
 * Stops when the API returns a page shorter than `pageSize`, when it
 * reports `totalPages` has been reached, or after a generous hard ceiling
 * (defensive against an API that loses its end-of-list signal).
 */
export function useClientes(): ClienteOption[] {
  const [clientes, setClientes] = useState<ClienteOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    const pageSize = 100;
    const maxPages = 100; // 10k clients ceiling — well above realistic catalog size

    async function loadAll() {
      const all: ClienteOption[] = [];

      try {
        for (let page = 1; page <= maxPages; page++) {
          const res = await fetch(`/api/clientes?page=${page}&pageSize=${pageSize}`);
          if (!res.ok) break;

          const json = await res.json();
          const data = (json.data ?? []) as ClienteApi[];

          all.push(...data.map((c) => ({ id: c.id_cliente, nombre: c.nombre_cliente })));

          // End-of-list signals: short page OR API-reported page boundary.
          if (data.length < pageSize) break;
          if (typeof json.totalPages === "number" && page >= json.totalPages) break;
        }

        if (!cancelled) setClientes(all);
      } catch {
        if (!cancelled) console.error("Error loading clients");
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return clientes;
}
