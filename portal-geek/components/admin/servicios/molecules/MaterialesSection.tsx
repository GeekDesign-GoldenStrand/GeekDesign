"use client";

import { XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

import { Icon } from "@/components/admin/servicios/atoms/Icon";
import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { MaterialDraft, MaterialOption, ProveedorPrecioOption } from "@/types/servicios";

// ── Types ──────────────────────────────────────────────────────────────────

type MaterialesSectionProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  materiales: MaterialDraft[];
  opcionesMateriales: MaterialOption[];
  onAdd: (draft: MaterialDraft) => void;
  onRemove: (id_material: number) => void;
  onUpdateProveedor: (id_material: number, id_proveedor_precio: number | null) => void;
};

// ── Grid config ────────────────────────────────────────────────────────────

const COLUMNS = [
  { label: "Nombre", width: "1.3fr" },
  { label: "Descripción", width: "1.3fr" },
  { label: "Unidad de medida", width: "1.3fr" },
  { label: "Ancho", width: "0.8fr" },
  { label: "Alto", width: "0.8fr" },
  { label: "Grosor", width: "0.8fr" },
  { label: "Descripción del color", width: "1.2fr" },
  { label: "Proveedor del Material", width: "2fr" },
];

const GRID_COLS = `${COLUMNS.map((c) => c.width).join(" ")} auto`;

// ── Sub-components ─────────────────────────────────────────────────────────

function ColorBadge({ value }: { value: string | null }) {
  const text = value ?? "-";
  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex min-h-6 items-center justify-center rounded-full border border-[#b9b8b8] px-3 py-1 text-[14px] text-[#1e1e1e] text-center">
        {text}
      </span>
    </div>
  );
}

function _MaterialThumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative h-[3.75rem] w-[3.75rem] rounded-[4px] overflow-hidden bg-[#d9d9d9] shrink-0">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="3.75rem"
          unoptimized
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function MaterialesSection({
  enabled,
  onToggle,
  materiales,
  opcionesMateriales,
  onAdd,
  onRemove,
  onUpdateProveedor,
}: MaterialesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [proveedoresByMaterial, setProveedoresByMaterial] = useState<
    Record<number, ProveedorPrecioOption[]>
  >({});

  const selectedIds = new Set(materiales.map((m) => m.id_material));

  const filteredOpciones = opcionesMateriales.filter(
    (m) =>
      !selectedIds.has(m.id_material) &&
      (searchQuery === "" ||
        m.nombre_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.descripcion_material ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMaterialInfo = (id: number) => opcionesMateriales.find((m) => m.id_material === id);

  const fmt = (val: string | null) => (val ? String(Number(val)) : "-");

  const handleAdd = async (id_material: number) => {
    try {
      const res = await fetch(`/api/proveedor-precios?id_material=${id_material}`);
      const json = await res.json();
      const proveedores: ProveedorPrecioOption[] = json.data ?? [];
      setProveedoresByMaterial((prev) => ({ ...prev, [id_material]: proveedores }));
      onAdd({
        id_material,
        id_proveedor_precio: proveedores[0]?.id_proveedor_precio ?? null,
      });
    } catch {
      onAdd({ id_material, id_proveedor_precio: null });
    } finally {
      setAdding(false);
      setSearchQuery("");
    }
  };

  const closeSearch = () => {
    setAdding(false);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1e1e1e]">Materiales:</h3>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>

      {!enabled && (
        <p className="text-sm text-gray-400 italic">
          Activa para asociar materiales a este servicio.
        </p>
      )}

      {enabled && (
        <>
          {/* ── Search + Add ── */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setAdding(true)}
              className="h-11 flex-1 px-4 text-base rounded-md border border-gray-300 bg-white text-[#1e1e1e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
            />
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="h-11 px-5 bg-[#e42200] text-white hover:bg-[#c41e00] rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              >
                + Agregar
              </button>
            ) : (
              <button
                type="button"
                onClick={closeSearch}
                className="h-11 px-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-full text-sm font-medium text-[#1e1e1e] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* ── Catalog dropdown ── */}
          {adding && (
            <div className="border border-gray-200 rounded-[7px] overflow-hidden shadow-sm">
              {filteredOpciones.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 italic">
                  {searchQuery
                    ? "Sin resultados para esa búsqueda."
                    : "Todos los materiales ya están agregados."}
                </p>
              ) : (
                <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                  {filteredOpciones.map((m) => (
                    <li key={m.id_material}>
                      <button
                        type="button"
                        onClick={() => handleAdd(m.id_material)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#fce4e4] transition-colors flex items-center gap-3"
                      >
                        <span className="text-[15px] font-semibold text-[#1e1e1e]">
                          {m.nombre_material}
                        </span>
                        {m.descripcion_material && (
                          <span className="text-[12px] text-[#575757]">
                            {m.descripcion_material}
                          </span>
                        )}
                        <span className="ml-auto text-[12px] text-blue-600 font-medium">
                          {m.unidad_medida}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Materials grid — same visual as MaterialesGrid ── */}
          {materiales.length > 0 && (
            <div className="space-y-2">
              {/* Header row */}
              <div
                className="hidden md:grid items-center gap-4 px-4 py-2 rounded-[6px] bg-[#c6c6c6] text-[#1e1e1e] text-[14px] font-bold"
                style={{ gridTemplateColumns: GRID_COLS }}
              >
                {COLUMNS.map((col) => (
                  <span key={col.label} className="text-center flex items-center justify-center">
                    {col.label}
                  </span>
                ))}
                <span />
              </div>

              {/* Material rows */}
              {materiales.map((draft) => {
                const info = getMaterialInfo(draft.id_material);
                const proveedores = proveedoresByMaterial[draft.id_material] ?? [];
                return (
                  <article
                    key={draft.id_material}
                    className="hidden md:grid items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0_2px_7px_rgba(0,0,0,0.14)]"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    {/* Nombre */}
                    <p className="text-[15px] text-[#1e1e1e] font-semibold text-center truncate">
                      {info?.nombre_material ?? `#${draft.id_material}`}
                    </p>

                    {/* Descripción */}
                    <p className="text-[12px] text-[#575757] text-center line-clamp-2">
                      {info?.descripcion_material || "-"}
                    </p>

                    {/* Unidad */}
                    <p className="text-[14px] text-[#1e1e1e] text-center">
                      {info?.unidad_medida ?? "-"}
                    </p>

                    {/* Ancho */}
                    <p className="text-[16px] text-[#1e1e1e] text-center">
                      {fmt(info?.ancho ?? null)}
                    </p>

                    {/* Alto */}
                    <p className="text-[16px] text-[#1e1e1e] text-center">
                      {fmt(info?.alto ?? null)}
                    </p>

                    {/* Grosor */}
                    <p className="text-[16px] text-[#1e1e1e] text-center">
                      {fmt(info?.grosor ?? null)}
                    </p>

                    {/* Color */}
                    <ColorBadge value={info?.color ?? null} />

                    {/* Proveedor dropdown */}
                    <div className="flex items-center justify-center">
                      {proveedores.length === 0 && (
                        <span className="text-[12px] text-gray-400 italic">
                          Sin proveedor asignado
                        </span>
                      )}
                      {proveedores.length === 1 && (
                        <span className="text-[13px] text-[#1e1e1e] text-center">
                          {proveedores[0].proveedor.nombre_proveedor} — $
                          {Number(proveedores[0].precio).toFixed(2)}
                        </span>
                      )}
                      {proveedores.length > 1 && (
                        <select
                          value={draft.id_proveedor_precio ?? ""}
                          onChange={(e) =>
                            onUpdateProveedor(
                              draft.id_material,
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="h-9 px-2 text-sm rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] w-full"
                        >
                          <option value="">Sin proveedor</option>
                          {proveedores.map((p) => (
                            <option key={p.id_proveedor_precio} value={p.id_proveedor_precio}>
                              {p.proveedor.nombre_proveedor} — ${Number(p.precio).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onRemove(draft.id_material)}
                        aria-label={`Quitar ${info?.nombre_material ?? "material"}`}
                        className="hover:opacity-70 transition-opacity text-[#1e1e1e] p-1"
                      >
                        <Icon LibIcon={XIcon} size={18} weight="bold" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {materiales.length === 0 && !adding && (
            <p className="text-sm text-gray-400 italic">
              Ningún material agregado aún. Usa el buscador para agregar.
            </p>
          )}
        </>
      )}
    </div>
  );
}
