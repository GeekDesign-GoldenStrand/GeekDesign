import type { MaterialCardProps } from "@/types";

export type MaterialApiRow = {
  id_material: number;
  id_material_padre: number | null;
  es_grupo: boolean;
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

export function mapMaterialRow(item: MaterialApiRow): MaterialCardProps {
  const tipo: MaterialCardProps["tipo"] = item.id_material_padre
    ? "sub"
    : item.es_grupo
      ? "grupo"
      : "individual";

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
    subMateriales: item.subMateriales?.map(mapMaterialRow),
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
