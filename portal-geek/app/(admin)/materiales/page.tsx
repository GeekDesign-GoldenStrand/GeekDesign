"use client";

import { useEffect, useState } from "react";

import type { Materiales } from "@prisma/client";

type MaterialsResponse = {
  data: Materiales[] | null;
  total: number;
  page: number;
  pageSize: number;
};

type MaterialRow = Materiales;

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.2 12.2L16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 3h11L9.4 8.1v3.7l-2.8 1.4V8.1L2.5 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path
        d="M13.9 3.6a1.4 1.4 0 0 1 2 0l-.8 2.2-1.6 1.6-1.6-1.6 2-2.2ZM11.8 6.1l1.6 1.6-6.5 6.5H5.3v-1.6l6.5-6.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.8 14.9h9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="10" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.8 22.2c1.5-3.4 4.2-5.2 7.2-5.2s5.7 1.8 7.2 5.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function MaterialColor({ color, name }: { color: string | null | undefined; name: string }) {
  const fallbackColor = "#d9d9d9";
  const swatchColor = color?.trim() || fallbackColor;

  return (
    <span
      className="inline-flex h-6 w-6 rounded-full border border-[#111]"
      style={{ backgroundColor: swatchColor }}
      aria-label={`Color ${name}`}
    />
  );
}

function mapMaterialSearchValue(item: MaterialRow) {
  return [
    item.nombre_material,
    item.descripcion_material ?? "",
    item.unidad_medida,
    formatValue(item.ancho),
    formatValue(item.alto),
    formatValue(item.grosor),
    item.color ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export default function MaterialesPage() {
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const response = await fetch("/api/materiales?page=1&pageSize=100");
        const json = (await response.json()) as MaterialsResponse;

        if (!response.ok) {
          throw new Error((json as { error?: string })?.error ?? "No se pudo cargar materiales");
        }

        setRows(json.data ?? []);
      } catch {
        setError("No se pudo cargar materiales");
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
  }, []);

  const filtered = rows.filter((item) => mapMaterialSearchValue(item).includes(search.toLowerCase()));

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-[#f5f5f5] text-[#111]">
      <header className="flex items-center justify-between border-b border-[#e7e7e7] bg-white px-6 py-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#111]">Materiales</h1>

        <button
          type="button"
          aria-label="Perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1c1c1c] text-[#1c1c1c] transition-colors hover:bg-[#f4f4f4]"
        >
          <ProfileIcon />
        </button>
      </header>

      <main className="px-6 py-4">
        <section className="rounded-[6px] bg-[#f7f7f7] p-0">
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="relative w-[150px] max-w-full">
              <span className="sr-only">Buscar material</span>
              <input
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-[2px] border border-[#d1d1d1] bg-white pl-2 pr-8 text-[12px] text-[#555] outline-none placeholder:text-[#9b9b9b] focus:border-[#b7b7b7]"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8f8f8f]">
                <SearchIcon />
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-[4px] border border-[#7f7f7f] bg-[#efefef] px-3 text-[14px] font-medium text-[#3a3a3a] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] transition-colors hover:bg-[#e6e6e6]"
              >
                <PlusIcon />
                Agregar
              </button>

              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-[4px] border border-[#ff6a4d] bg-white px-3 text-[14px] font-medium text-[#ff5c3a] shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] transition-colors hover:bg-[#fff4f1]"
              >
                <FilterIcon />
                Filtrar
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[5px]">
            <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.9fr_0.6fr_0.9fr_0.3fr] items-center rounded-[4px] bg-[#d9d9d9] px-4 py-2 text-[15px] font-semibold text-[#1c1c1c]">
              <div>Nombre</div>
              <div>Unidad de medida</div>
              <div>Ancho</div>
              <div>Alto</div>
              <div>Grosor</div>
              <div>Color</div>
              <div>Imagen</div>
              <div />
            </div>

            <div className="mt-3 space-y-4 pr-1 pb-2">
              {error ? (
                <div className="rounded-[4px] bg-white px-4 py-6 text-[14px] text-[#c2410c] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                  {error}
                </div>
              ) : loading ? (
                <div className="rounded-[4px] bg-white px-4 py-6 text-[14px] text-[#666] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                  Cargando...
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <article
                    key={item.id_material}
                    className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.9fr_0.6fr_0.9fr_0.3fr] items-center rounded-[4px] bg-white px-4 py-4 text-[14px] text-[#111] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                  >
                    <div>{item.nombre_material}</div>
                    <div>{item.unidad_medida}</div>
                    <div>{formatValue(item.ancho)}</div>
                    <div>{formatValue(item.alto)}</div>
                    <div>{formatValue(item.grosor)}</div>
                    <div>
                      <MaterialColor color={item.color} name={item.nombre_material} />
                    </div>
                    <div>
                      {item.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imagen_url}
                          alt={item.nombre_material}
                          className="h-16 w-16 rounded-[2px] object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-[2px] bg-[#d9d9d9]" aria-hidden="true" />
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Editar ${item.nombre_material}`}
                      className="flex items-center justify-end text-[#111] transition-opacity hover:opacity-70"
                    >
                      <EditIcon />
                    </button>
                  </article>
                ))
              ) : (
                <div className="rounded-[4px] bg-white px-4 py-6 text-[14px] text-[#666] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                  No hay materiales para mostrar.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
