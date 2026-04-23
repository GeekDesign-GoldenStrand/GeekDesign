"use client";

import { useEffect, useMemo, useState } from "react";

import { MaterialesGrid, MaterialesHeader, MaterialesToolbar } from "@/components/ui/materiales";
import type { MaterialCardProps } from "@/types";

type DbMaterial = {
  id_material: number;
  nombre_material: string;
  descripcion_material: string | null;
  unidad_medida: string;
  ancho: string | number | null;
  alto: string | number | null;
  grosor: string | number | null;
  color: string | null;
  imagen_url: string | null;
};

function normalizeDecimal(value: string | number | null): string {
  // Prisma Decimal can arrive serialized as string; normalize for UI rendering.
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function mapMaterial(item: DbMaterial): MaterialCardProps {
  return {
    id: item.id_material,
    name: item.nombre_material,
    unit: item.unidad_medida,
    color: item.color ?? "-",
    width: normalizeDecimal(item.ancho),
    height: normalizeDecimal(item.alto),
    thickness: normalizeDecimal(item.grosor),
    description: item.descripcion_material ?? "",
    imageUrl: item.imagen_url ?? "",
  };
}

export default function MaterialesPage() {
  const [rows, setRows] = useState<MaterialCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/materiales?pageSize=100")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        const items = ((payload?.data ?? []) as DbMaterial[]).map(mapMaterial);
        setRows(items);
      })
      .catch(() => setError("No se pudieron cargar los materiales"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = unitFilter === "Todos" ? rows : rows.filter((row) => row.unit === unitFilter);

    if (!q) return base;

    return base.filter((row) => {
      return (
        row.name.toLowerCase().includes(q) ||
        row.unit.toLowerCase().includes(q) ||
        row.color.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
      );
    });
  }, [rows, search, unitFilter]);

  const units = useMemo(() => {
    const allUnits = rows.map((row) => row.unit);
    return ["Todos", ...Array.from(new Set(allUnits))];
  }, [rows]);

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-[#ececec]">
      <MaterialesHeader />
      <main className="p-8">
        <MaterialesToolbar
          search={search}
          onSearchChange={setSearch}
          onFilterClick={() => setShowFilters((s) => !s)}
        />

        {showFilters && (
          <section className="mb-5 rounded-[7px] border border-[#d7d7d7] bg-white p-4 flex items-end gap-3 flex-wrap">
            <label className="flex flex-col gap-1 text-[13px] font-medium text-[#575757]">
              Unidad
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="h-10 min-w-52 rounded-[6px] border border-[#b9b8b8] px-3 text-[14px] text-[#1e1e1e] outline-none"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => {
                setUnitFilter("Todos");
                setSearch("");
              }}
              className="h-10 px-4 rounded-[6px] border border-[#575757] text-[#575757] text-[14px] font-medium hover:bg-[#f5f5f5]"
            >
              Limpiar filtros
            </button>
          </section>
        )}

        {loading && <p className="text-[#8e908f] text-[16px]">Cargando...</p>}

        {error && !loading && <p className="text-[#e42200] text-[16px]">{error}</p>}

        {!loading && !error && <MaterialesGrid items={filtered} />}
      </main>
    </div>
  );
}
