"use client";

import { Plus, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

interface Cotizacion {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  fecha_estimada?: string | null;
  empresa?: string | null;
  cliente: string;
  estatus: string;
}

interface CotizacionResponse {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: string | number;
  empresa_cliente?: string | null;
  cliente?: { empresa?: string | null; nombre_cliente?: string };
  estatus?: { descripcion?: string };
  fecha_fin?: string | null;
  fecha_aprobacion?: string | null;
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const [filterCliente, setFilterCliente] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);

  const pageSize = 13;
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchCotizaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (search) params.set("search", search);
      if (filterCliente) params.set("cliente", filterCliente);
      if (filterEmpresa) params.set("empresa", filterEmpresa);
      filterEstatus.forEach((estatus) => params.append("estatus", estatus));

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

      const mapped: Cotizacion[] = (json.data ?? []).map((c: CotizacionResponse) => ({
        id_cotizacion: c.id_cotizacion,
        fecha_creacion: c.fecha_creacion,
        monto_total: Number(c.monto_total),
        empresa: c.empresa_cliente ?? c.cliente?.empresa ?? null,
        cliente: c.cliente?.nombre_cliente ?? "",
        estatus: c.estatus?.descripcion ?? "",
        fecha_estimada: c.fecha_fin ?? c.fecha_aprobacion ?? null,
      }));

      setCotizaciones(mapped);
      setTotal(json.total ?? 0);
    } catch {
      setError("No se pudieron cargar las cotizaciones.");
    }
  }, [page, search, filterCliente, filterEmpresa, filterEstatus]);

  useEffect(() => {
    const load = async () => {
      await fetchCotizaciones();
    };
    load();
  }, [fetchCotizaciones]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  async function handleDelete(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Error al eliminar la cotización");
        return;
      }
      fetchCotizaciones();
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/cotizaciones/${id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: newStatus }),
      });
      if (res.ok) {
        fetchCotizaciones();
      }
    } catch {
      setError("No se pudo actualizar el estatus.");
    }
  }

  return (
    <>
      <AdminHeader title="Cotizaciones" />

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <section className="space-y-3 pt-5 pb-8 max-w-[1350px] mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Buscador */}
          <div className="relative flex items-center border border-[#b9b8b8] rounded-sm h-[2.5rem] bg-white w-[28rem] max-w-full">
            {/* Input */}
            <input
              type="text"
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 pl-3 pr-10 text-[14px] text-[#1e1e1e] placeholder:text-[#8e908f] outline-none"
            />

            {/* Botón limpiar */}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-8 text-gray-400 hover:text-black"
              >
                ✕
              </button>
            )}

            {/* Icono lupa */}
            <div className="absolute right-2">
              <MagnifyingGlass size={18} className="text-gray-400" />
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-[#e8e8e8] border border-[#575757] text-[#575757] text-[14px] font-medium rounded-[7px] px-4 h-[2.5rem] hover:bg-[#d8d8d8]">
              <Plus size={18} /> Agregar
            </button>

            {/* Related Contender */}
            <div className="relative">
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className="flex items-center gap-2 bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[14px] font-medium rounded-[7px] px-4 h-[2.5rem] hover:bg-[#ffe0dc]"
              >
                <Funnel size={18} /> Filtrar
              </button>

              {showFilter && (
                <div ref={filterRef} className="absolute right-0 mt-2 z-50">
                  <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
                    <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">Filtros</h2>

                    {/* Cliente */}
                    <div className="mb-3">
                      <p className="text-[13px] font-semibold text-[#575757] mb-1">Cliente</p>
                      <input
                        type="text"
                        value={filterCliente}
                        onChange={(e) => setFilterCliente(e.target.value)}
                        className="w-full border border-[#b9b8b8] rounded-[6px] p-2 text-black"
                      />
                    </div>

                    {/* Empresa */}
                    <div className="mb-3">
                      <p className="text-[13px] font-semibold text-[#575757] mb-1">Empresa</p>
                      <input
                        type="text"
                        value={filterEmpresa}
                        onChange={(e) => setFilterEmpresa(e.target.value)}
                        className="w-full border border-[#b9b8b8] rounded-[6px] p-2 text-black"
                      />
                    </div>

                    {/* Estatus */}
                    <div className="mb-3">
                      <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>
                      <div className="space-y-2">
                        {["Validada", "Aprobada", "Rechazada", "En_revision"].map((status) => (
                          <label key={status} className="flex items-center gap-2 text-[13px]">
                            <input
                              type="checkbox"
                              checked={filterEstatus.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterEstatus([...filterEstatus, status]);
                                } else {
                                  setFilterEstatus(filterEstatus.filter((s) => s !== status));
                                }
                              }}
                              className="accent-[#ff7f7f]"
                            />
                            {status}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setFilterCliente("");
                          setFilterEmpresa("");
                          setFilterEstatus([]);
                        }}
                        className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                      >
                        Restablecer
                      </button>

                      <button
                        onClick={() => setShowFilter(false)}
                        className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        {cotizaciones.length > 0 && (
          <div
            className="grid items-center px-4 py-2 rounded-[6px] bg-[#c6c6c6] text-[#1e1e1e] text-[16px] font-bold"
            style={{
              gridTemplateColumns: "1fr 1.2fr 1fr 1fr 0.9fr 1fr 0.6fr",
            }}
          >
            <span className="flex justify-center">Fecha Creación</span>
            <span className="flex justify-center">Monto</span>
            <span className="flex justify-center">Entrega Estimada</span>
            <span className="flex justify-center">Empresa</span>
            <span className="flex justify-center">Cliente</span>
            <span className="flex justify-center">Estatus</span>
            <span className="flex justify-center">Acciones</span>
            <span />
          </div>
        )}

        {/* Empty */}
        {cotizaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-[#8e908f] text-[16px]">No se encontraron cotizaciones.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cotizaciones.map((c) => (
              <article
                key={c.id_cotizacion}
                className="grid items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0px_2px_7px_rgba(0,0,0,0.14)]"
                style={{
                  gridTemplateColumns: "1.2fr 1fr 1.2fr 1fr 1fr 1fr auto",
                }}
              >
                {/* Fecha */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {new Date(c.fecha_creacion).toLocaleDateString("es-MX")}
                </p>

                {/* Monto */}
                <p className="text-[14px] text-[#1e1e1e] text-center">${c.monto_total} MXN</p>

                {/* Fecha estimada */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {c.fecha_estimada ? new Date(c.fecha_estimada).toLocaleDateString("es-MX") : "—"}
                </p>

                {/* Empresa */}
                <p className="text-[14px] text-[#1e1e1e] text-center">{c.empresa ?? "—"}</p>

                {/* Cliente */}
                <p className="text-[14px] text-[#1e1e1e] text-center">{c.cliente}</p>

                {/* Estatus */}
                <div className="flex justify-center">
                  <select
                    value={c.estatus}
                    onChange={(e) => handleStatusChange(c.id_cotizacion, e.target.value)}
                    className="border border-[#b9b8b8] rounded-[6px] px-2 py-1 text-[13px] text-[#1e1e1e] bg-white"
                  >
                    <option value="En_revision">En revisión</option>
                    <option value="Validada">Validada</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`/admin/cotizaciones/${c.id_cotizacion}`}
                    className="text-[#006aff] text-[14px] hover:underline"
                  >
                    Editar
                  </a>
                  <button
                    onClick={() => handleDelete(c.id_cotizacion)}
                    className="text-[#e42200] text-[14px] hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[6px] hover:bg-[#f5f5f5] disabled:opacity-40"
          >
            ← Anterior
          </button>

          <span className="text-[14px] text-[#575757]">
            Página {page} de {Math.ceil(total / pageSize)}
          </span>

          <button
            disabled={page === Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[6px] hover:bg-[#f5f5f5] disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </section>
    </>
  );
}
