"use client";

import { ArrowCircleDownIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Icon } from "@/components/admin/servicios/atoms/Icon";
import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { MaterialDraft, MaterialOption, ProveedorPrecioOption } from "@/types/servicios";

// ── Types ──────────────────────────────────────────────────────────────────

type GrupoConSubs = {
  id_material: number;
  nombre_material: string;
  subMateriales: Array<{
    id_material: number;
    nombre_material: string;
    id_material_padre: number;
  }>;
};

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

// ── Group variant picker panel ────────────────────────────────────────────

function VariantPicker({
  grupo,
  selectedIds,
  onConfirm,
  onClose,
}: {
  grupo: GrupoConSubs;
  selectedIds: Set<number>;
  onConfirm: (ids: number[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const available = grupo.subMateriales.filter((s) => !selectedIds.has(s.id_material));
    const allChecked = available.every((s) => checked.has(s.id_material));
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(available.map((s) => s.id_material)));
    }
  }

  const available = grupo.subMateriales.filter((s) => !selectedIds.has(s.id_material));
  const allAvailableChecked =
    available.length > 0 && available.every((s) => checked.has(s.id_material));

  return (
    <div className="border border-[#e42200] rounded-[7px] bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-[#fff5f5]">
        <span className="text-[14px] font-semibold text-[#1e1e1e]">
          {grupo.nombre_material} — elige variantes
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[#8e908f] hover:text-[#e42200] transition-colors"
        >
          <Icon LibIcon={XIcon} size={16} weight="bold" />
        </button>
      </div>

      {grupo.subMateriales.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400 italic">Este grupo no tiene variantes.</p>
      ) : (
        <>
          <div className="px-4 pt-2 pb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] text-[#e42200] hover:underline"
            >
              {allAvailableChecked ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>
          <ul className="max-h-44 overflow-y-auto divide-y divide-gray-50 px-2 pb-2">
            {grupo.subMateriales.map((sub) => {
              const alreadyAdded = selectedIds.has(sub.id_material);
              return (
                <li key={sub.id_material}>
                  <label
                    className={`flex items-center gap-3 px-2 py-2 rounded-[5px] cursor-pointer ${
                      alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-[#fce4e4]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={alreadyAdded}
                      checked={alreadyAdded || checked.has(sub.id_material)}
                      onChange={() => !alreadyAdded && toggle(sub.id_material)}
                      className="accent-[#e42200]"
                    />
                    <span className="text-[14px] text-[#1e1e1e]">{sub.nombre_material}</span>
                    {alreadyAdded && (
                      <span className="ml-auto text-[11px] text-gray-400 italic">ya agregado</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="px-4 pb-3 pt-1 flex justify-end">
            <button
              type="button"
              disabled={checked.size === 0}
              onClick={() => onConfirm([...checked])}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#e42200] rounded-[6px] hover:bg-[#c41e00] disabled:opacity-50 transition-colors"
            >
              Agregar{" "}
              {checked.size > 0
                ? `${checked.size} variante${checked.size !== 1 ? "s" : ""}`
                : "variantes"}
            </button>
          </div>
        </>
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
  const [grupos, setGrupos] = useState<GrupoConSubs[]>([]);
  const [groupPickerOpen, setGroupPickerOpen] = useState<number | null>(null);

  // Fetch groups once when the section is enabled
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/materiales?mode=grupos")
      .then((r) => r.json())
      .then((payload) => {
        const data = (payload?.data ?? []) as GrupoConSubs[];
        setGrupos(data);
      })
      .catch(() => {});
  }, [enabled]);

  const selectedIds = new Set(materiales.map((m) => m.id_material));

  // Individual leaf materials (no parent group) not yet added.
  // Sub-materials (id_material_padre !== null) are only accessible via the group picker.
  const filteredLeaves = opcionesMateriales.filter(
    (m) =>
      !m.es_grupo &&
      m.id_material_padre === null &&
      !selectedIds.has(m.id_material) &&
      (searchQuery === "" ||
        m.nombre_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.descripcion_material ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Groups that have at least one sub not yet added
  const filteredGrupos = grupos.filter(
    (g) =>
      g.subMateriales.some((s) => !selectedIds.has(s.id_material)) &&
      (searchQuery === "" ||
        g.nombre_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subMateriales.some((s) =>
          s.nombre_material.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  const getMaterialInfo = (id: number) => opcionesMateriales.find((m) => m.id_material === id);

  const fmt = (val: string | null) => (val ? String(Number(val)) : "-");

  const handleAddLeaf = async (id_material: number) => {
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

  const handleGroupConfirm = async (ids: number[]) => {
    for (const id of ids) {
      try {
        const res = await fetch(`/api/proveedor-precios?id_material=${id}`);
        const json = await res.json();
        const proveedores: ProveedorPrecioOption[] = json.data ?? [];
        setProveedoresByMaterial((prev) => ({ ...prev, [id]: proveedores }));
        onAdd({
          id_material: id,
          id_proveedor_precio: proveedores[0]?.id_proveedor_precio ?? null,
        });
      } catch {
        onAdd({ id_material: id, id_proveedor_precio: null });
      }
    }
    setGroupPickerOpen(null);
    setAdding(false);
    setSearchQuery("");
  };

  const closeSearch = () => {
    setAdding(false);
    setSearchQuery("");
    setGroupPickerOpen(null);
  };

  // Group selected materials by their parent group for display
  const groupedDisplay = (() => {
    const result: Array<
      | {
          type: "group-header";
          groupId: number;
          groupName: string;
          subs: MaterialDraft[];
        }
      | { type: "leaf"; draft: MaterialDraft }
    > = [];

    const seen = new Set<number>();

    for (const draft of materiales) {
      if (seen.has(draft.id_material)) continue;
      seen.add(draft.id_material);

      // Find if this is a sub-material (look up in opcionesMateriales which now has id_material_padre)
      const info = opcionesMateriales.find((m) => m.id_material === draft.id_material);
      const parentId = info?.id_material_padre ?? null;

      if (parentId !== null) {
        // Find if we already started a group-header for this parent
        const existing = result.find((r) => r.type === "group-header" && r.groupId === parentId) as
          | { type: "group-header"; groupId: number; groupName: string; subs: MaterialDraft[] }
          | undefined;

        if (existing) {
          existing.subs.push(draft);
        } else {
          const grupo = grupos.find((g) => g.id_material === parentId);
          result.push({
            type: "group-header",
            groupId: parentId,
            groupName: grupo?.nombre_material ?? `Grupo #${parentId}`,
            subs: [draft],
          });
        }
      } else {
        result.push({ type: "leaf", draft });
      }
    }

    return result;
  })();

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
              placeholder="Buscar material o grupo..."
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
          {adding && groupPickerOpen === null && (
            <div className="border border-gray-200 rounded-[7px] overflow-hidden shadow-sm">
              {filteredLeaves.length === 0 && filteredGrupos.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 italic">
                  {searchQuery
                    ? "Sin resultados para esa búsqueda."
                    : "Todos los materiales ya están agregados."}
                </p>
              ) : (
                <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {/* Groups */}
                  {filteredGrupos.map((g) => (
                    <li key={`grupo-${g.id_material}`}>
                      <button
                        type="button"
                        onClick={() => setGroupPickerOpen(g.id_material)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#fce4e4] transition-colors flex items-center gap-3"
                      >
                        <ArrowCircleDownIcon
                          size={16}
                          weight="bold"
                          className="text-[#575757] shrink-0"
                        />
                        <span className="text-[15px] font-semibold text-[#1e1e1e]">
                          {g.nombre_material}
                        </span>
                        <span className="text-[12px] text-gray-400">
                          {g.subMateriales.length} variante{g.subMateriales.length !== 1 ? "s" : ""}
                        </span>
                        <span className="ml-auto text-[12px] text-[#e42200] font-medium">
                          Elegir variantes →
                        </span>
                      </button>
                    </li>
                  ))}

                  {/* Leaf materials */}
                  {filteredLeaves.map((m) => (
                    <li key={m.id_material}>
                      <button
                        type="button"
                        onClick={() => handleAddLeaf(m.id_material)}
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
                          {m.unidad_medida ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Group variant picker ── */}
          {adding && groupPickerOpen !== null && (
            <VariantPicker
              grupo={grupos.find((g) => g.id_material === groupPickerOpen)!}
              selectedIds={selectedIds}
              onConfirm={handleGroupConfirm}
              onClose={() => setGroupPickerOpen(null)}
            />
          )}

          {/* ── Materials grid ── */}
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

              {/* Grouped rows */}
              {groupedDisplay.map((entry, idx) => {
                if (entry.type === "group-header") {
                  const addedCount = entry.subs.length;
                  return (
                    <div key={`gh-${entry.groupId}`} className="space-y-[2px]">
                      {/* Group sub-header */}
                      <div className="px-4 py-1.5 bg-[#f0f0f0] border-l-[3px] border-l-[#e42200] rounded-[6px] flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#1e1e1e]">
                          {entry.groupName}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e42200] text-white text-[11px] font-medium">
                          {addedCount} variante{addedCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {/* Sub-material rows */}
                      {entry.subs.map((draft) => (
                        <MaterialRow
                          key={draft.id_material}
                          draft={draft}
                          info={getMaterialInfo(draft.id_material)}
                          proveedores={proveedoresByMaterial[draft.id_material] ?? []}
                          onRemove={onRemove}
                          onUpdateProveedor={onUpdateProveedor}
                          fmt={fmt}
                        />
                      ))}
                    </div>
                  );
                }

                return (
                  <MaterialRow
                    key={`leaf-${entry.draft.id_material}-${idx}`}
                    draft={entry.draft}
                    info={getMaterialInfo(entry.draft.id_material)}
                    proveedores={proveedoresByMaterial[entry.draft.id_material] ?? []}
                    onRemove={onRemove}
                    onUpdateProveedor={onUpdateProveedor}
                    fmt={fmt}
                  />
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

// ── Material row sub-component ─────────────────────────────────────────────

function MaterialRow({
  draft,
  info,
  proveedores,
  onRemove,
  onUpdateProveedor,
  fmt,
}: {
  draft: MaterialDraft;
  info: MaterialOption | undefined;
  proveedores: ProveedorPrecioOption[];
  onRemove: (id: number) => void;
  onUpdateProveedor: (id: number, id_proveedor_precio: number | null) => void;
  fmt: (val: string | null) => string;
}) {
  return (
    <article
      className="hidden md:grid items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0_2px_7px_rgba(0,0,0,0.14)]"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <p className="text-[15px] text-[#1e1e1e] font-semibold text-center truncate">
        {info?.nombre_material ?? `#${draft.id_material}`}
      </p>
      <p className="text-[12px] text-[#575757] text-center line-clamp-2">
        {info?.descripcion_material || "-"}
      </p>
      <p className="text-[14px] text-[#1e1e1e] text-center">{info?.unidad_medida ?? "-"}</p>
      <p className="text-[16px] text-[#1e1e1e] text-center">{fmt(info?.ancho ?? null)}</p>
      <p className="text-[16px] text-[#1e1e1e] text-center">{fmt(info?.alto ?? null)}</p>
      <p className="text-[16px] text-[#1e1e1e] text-center">{fmt(info?.grosor ?? null)}</p>
      <ColorBadge value={info?.color ?? null} />

      <div className="flex items-center justify-center">
        {proveedores.length === 0 && (
          <span className="text-[12px] text-gray-400 italic">Sin proveedor asignado</span>
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
              onUpdateProveedor(draft.id_material, e.target.value ? Number(e.target.value) : null)
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
}
