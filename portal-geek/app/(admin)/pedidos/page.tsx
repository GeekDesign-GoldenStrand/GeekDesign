"use client";

import { Plus, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  cliente: {
    id_cliente: number;
    nombre_cliente: string;
    empresa?: string | null;
    correo_electronico: string;
    numero_telefono: string;
    categoria?: string | null;
  };
  estatus: {
    id_estatus: number;
    descripcion: string;
  };
  factura: boolean;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilter, setShowFilter] = useState(false);

  // Filtros
  const [onlyActive, setOnlyActive] = useState(false);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [estatuses, setEstatuses] = useState<string[]>([]);
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);

  const pageSize = 10;
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        onlyActive: onlyActive ? "true" : "false",
      });

      if (search) params.append("search", search);
      serviceIds.forEach((id) => params.append("serviceId", id.toString()));
      estatuses.forEach((e) => params.append("estatus", e));
      if (empresa) params.append("empresa", empresa);
      if (cliente) params.append("cliente", cliente);

      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const json = await res.json();
      setPedidos(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("No se pudieron cargar los pedidos.");
    }
  }, [page, onlyActive, serviceIds, estatuses, empresa, cliente, search]);

  async function handleDelete(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Error al eliminar el pedido");
        return;
      }
      fetchPedidos(); // refresca lista
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/pedidos/${id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: newStatus }),
      });
      if (res.ok) {
        fetchPedidos(); // refresca lista
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Error al actualizar el estatus del pedido");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  useEffect(() => {
    const load = async () => {
      await fetchPedidos();
    };
    load();
  }, [fetchPedidos]);

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

  return (
    <>
      <AdminHeader title="Pedidos" />

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {/* Grid de pedidos*/}
      <section className="space-y-3 pt-5 pb-8 max-w-[1350px] mx-auto">
        {/* Toolbar superior */}
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

              {/* Dropdown */}
              {showFilter && (
                <div ref={filterRef} className="absolute right-0 mt-2 z-50">
                  <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
                    {/* Modal de filtros */}
                    <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">Filtros</h2>

                    {/* Activos */}
                    <label className="flex items-center gap-2 mb-3 text-[13px] text-[#1e1e1e]">
                      <input
                        type="checkbox"
                        checked={onlyActive}
                        onChange={(e) => setOnlyActive(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#ff7f7f]"
                      />
                      Mostrar solo activos
                    </label>

                    {/* Servicio */}
                    <section className="mb-3">
                      <p className="font-semibold text-[14px] text-[#1e1e1e] mb-1">Servicio:</p>
                      {[
                        { id: 1, nombre: "Corte Láser" },
                        { id: 2, nombre: "Grabado Láser" },
                      ].map((srv) => (
                        <label
                          key={srv.id}
                          className="flex items-center gap-2 text-[13px] text-[#1e1e1e]"
                        >
                          <input
                            type="checkbox"
                            checked={serviceIds.includes(srv.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setServiceIds([...serviceIds, srv.id]);
                              } else {
                                setServiceIds(serviceIds.filter((id) => id !== srv.id));
                              }
                            }}
                            className="h-3.5 w-3.5 accent-[#ff7f7f]"
                          />
                          {srv.nombre}
                        </label>
                      ))}
                    </section>

                    {/* Estatus */}
                    <section className="mb-3">
                      <p className="font-semibold text-[14px] text-[#1e1e1e] mb-1">Estatus:</p>
                      {["Cotizacion", "Pagado", "En_cola", "Aprobacion_diseno"].map((status) => (
                        <label
                          key={status}
                          className="flex items-center gap-2 text-[13px] text-[#1e1e1e]"
                        >
                          <input
                            type="checkbox"
                            checked={estatuses.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEstatuses([...estatuses, status]);
                              } else {
                                setEstatuses(estatuses.filter((s) => s !== status));
                              }
                            }}
                            className="h-3.5 w-3.5 accent-[#ff7f7f]"
                          />
                          {status}
                        </label>
                      ))}
                    </section>

                    {/* Cliente */}
                    <label className="block mb-3 text-[13px] text-[#1e1e1e]">
                      Cliente:
                      <input
                        type="text"
                        value={cliente ?? ""}
                        onChange={(e) => setCliente(e.target.value || null)}
                        className="w-full border border-[#b9b8b8] rounded-[6px] p-2 text-black"
                      />
                    </label>

                    {/* Empresa */}
                    <label className="block mb-3 text-[13px] text-[#1e1e1e]">
                      Empresa:
                      <input
                        type="text"
                        value={empresa ?? ""}
                        onChange={(e) => setEmpresa(e.target.value || null)}
                        className="w-full border border-[#b9b8b8] rounded-[6px] p-2 text-black"
                      />
                    </label>

                    {/* Botones */}
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setOnlyActive(false);
                          setServiceIds([]);
                          setEstatuses([]);
                          setEmpresa(null);
                          setCliente(null);
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
        {pedidos.length > 0 && (
          <div
            className="grid items-center px-4 py-2 rounded-[6px] bg-[#c6c6c6] text-[#1e1e1e] text-[16px] font-bold"
            style={{
              gridTemplateColumns: "1.1fr 1.2fr 0.8fr 1fr 0.9fr 1fr 0.5fr",
            }}
          >
            <span className="flex items-center justify-center text-center">Fecha Creación</span>
            <span className="flex items-center justify-center text-center">Fecha Estimada</span>
            <span className="flex items-center justify-center text-center">Empresa</span>
            <span className="flex items-center justify-center text-center">Cliente</span>
            <span className="flex items-center justify-center text-center">Estatus</span>
            <span className="flex items-center justify-center text-center">Factura</span>
            <span className="flex items-center justify-center text-center">Acciones</span>
            <span />
          </div>
        )}

        {/* Empty state */}
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-[#8e908f] text-[16px]">No se encontraron pedidos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pedidos.map((p) => (
              <article
                key={p.id_pedido}
                className="grid items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0px_2px_7px_rgba(0,0,0,0.14)]"
                style={{
                  gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 1fr 1fr auto",
                }}
              >
                {/* Fecha creación */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {new Date(p.fecha_creacion).toLocaleDateString("es-MX")}
                </p>

                {/* Fecha estimada */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {p.fecha_estimada ? new Date(p.fecha_estimada).toLocaleDateString("es-MX") : "—"}
                </p>

                {/* Empresa */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {p.cliente?.empresa ?? "—"}
                </p>

                {/* Cliente */}
                <p className="text-[14px] text-[#1e1e1e] text-center">
                  {p.cliente?.nombre_cliente}
                </p>

                {/* Estatus */}
                <div className="flex justify-center">
                  <select
                    value={p.estatus?.descripcion ?? ""}
                    onChange={(e) => handleStatusChange(p.id_pedido, e.target.value)}
                    className="border border-[#b9b8b8] rounded-[6px] px-2 py-1 text-[13px] text-[#1e1e1e] bg-white"
                  >
                    <option value="Cotizacion">Cotización</option>
                    <option value="Pagado">Pagado</option>
                    <option value="En_cola">En cola</option>
                    <option value="Aprobacion_diseno">Aprobación diseño</option>
                    <option value="En_produccion">En producción</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Facturado">Facturado</option>
                  </select>
                </div>

                {/* Factura */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full border text-black border-[#b9b8b8] text-[13px]">
                    {p.factura ? "Aprobada" : "No aprobada"}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`/admin/pedidos/${p.id_pedido}`}
                    className="text-[#006aff] text-[14px] hover:underline"
                  >
                    Editar
                  </a>
                  <button
                    onClick={() => handleDelete(p.id_pedido)}
                    className="text-[#e42200] text-[14px] hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

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

      {/* BOTÓN Filtrar */}
      <div className="relative">
        {/* BOTÓN */}
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="flex items-center gap-2 bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[14px] font-medium rounded-[7px] px-4 h-[2.5rem] hover:bg-[#ffe0dc]"
        >
          <Funnel size={18} /> Filtrar
        </button>
      </div>
    </>
  );
}
