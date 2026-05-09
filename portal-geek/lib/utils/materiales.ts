import type { MaterialCardProps } from "@/types";

export type MaterialApiRow = {
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

export function normalizeDecimal(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export function mapMaterialRow(item: MaterialApiRow): MaterialCardProps {
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
