import type { MaterialCardProps } from "@/types";

export type MaterialApiRow = {
  id_material: number;
  id_material_padre: number | null;
  es_grupo: boolean;
  es_categoria?: boolean;
  nombre_material: string;
  descripcion_material: string | null;
  unidad_medida: string | null;
  ancho: string | number | null;
  alto: string | number | null;
  grosor: string | number | null;
  color: string | null;
  imagen_url: string | null;
  subMateriales?: MaterialApiRow[];
};

export function normalizeDecimal(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

// `parentIsGroup` flag lets us discriminate a leaf inside a grupo (variante)
// from one inside a categoría (individual) — both have id_material_padre != null.
export function mapMaterialRow(item: MaterialApiRow, parentIsGroup = false): MaterialCardProps {
  let tipo: MaterialCardProps["tipo"];
  if (item.es_categoria) tipo = "categoria";
  else if (item.es_grupo) tipo = "grupo";
  else if (parentIsGroup) tipo = "sub";
  else tipo = "individual";

  return {
    id: item.id_material,
    name: item.nombre_material,
    unit: item.unidad_medida ?? "-",
    color: item.color ?? "-",
    width: normalizeDecimal(item.ancho),
    height: normalizeDecimal(item.alto),
    thickness: normalizeDecimal(item.grosor),
    description: item.descripcion_material ?? "",
    imageUrl: item.imagen_url ?? "",
    id_material_padre: item.id_material_padre,
    tipo,
    subMateriales: item.subMateriales?.map((s) => mapMaterialRow(s, !!item.es_grupo)),
  };
}

export function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function normalizeNumericInput(raw: string): string {
  if (!raw) return "";
  const sanitized = raw.replace(/[^\d.]/g, "");
  const [intPartRaw = "", ...rest] = sanitized.split(".");
  const intPart = intPartRaw.slice(0, 8);
  if (rest.length === 0) return intPart;
  const decimalPart = rest.join("").slice(0, 2);
  return `${intPart}.${decimalPart}`;
}
