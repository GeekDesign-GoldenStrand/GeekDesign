"use client";

import { useEffect, useState } from "react";

import { MaterialImageInput } from "@/components/ui/materiales/molecules/MaterialImageInput";
import {
  CreateGrupoMaterialSchema,
  CreateMaterialSchema,
  CreateSubMaterialSchema,
  UNIDADES_MEDIDA,
} from "@/lib/schemas/materiales";
import {
  mapMaterialRow,
  parseOptionalNumber,
  normalizeNumericInput,
  type MaterialApiRow,
} from "@/lib/utils/materiales";
import type { MaterialCardProps } from "@/types";

type Tipo = "individual" | "grupo" | "sub";

interface GrupoOption {
  id_material: number;
  nombre_material: string;
}

interface RegistrarMaterialFormProps {
  onCreated: (row: MaterialCardProps) => void;
  onClose: () => void;
  initialTipo?: Tipo;
  initialPadreId?: number;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const SELECT_FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] bg-white transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[14px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

export function RegistrarMaterialForm({
  onCreated,
  onClose,
  initialTipo = "individual",
  initialPadreId,
}: RegistrarMaterialFormProps) {
  const [tipo, setTipo] = useState<Tipo>(initialTipo);
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);

  const [form, setForm] = useState({
    nombre_material: "",
    descripcion_material: "",
    unidad_medida: "",
    ancho: "",
    alto: "",
    grosor: "",
    color: "",
    imagen_url: "",
    id_material_padre: initialPadreId ? String(initialPadreId) : "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch groups when tipo is "sub"
  useEffect(() => {
    if (tipo !== "sub") return;
    fetch("/api/materiales?mode=grupos")
      .then((r) => r.json())
      .then((payload) => {
        const data = (payload?.data ?? []) as Array<{
          id_material: number;
          nombre_material: string;
        }>;
        setGrupos(data);
      })
      .catch(() => {});
  }, [tipo]);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getFieldClass(key: keyof typeof form) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key]) {
      const value = form[key];
      if (["ancho", "alto", "grosor"].includes(key)) {
        const parsed = parseOptionalNumber(value);
        return parsed && parsed > 0 ? FIELD_SUCCESS : "";
      }
      return value.trim() ? FIELD_SUCCESS : "";
    }
    return "";
  }

  function validate() {
    if (tipo === "grupo") {
      const payload = {
        tipo: "grupo" as const,
        nombre_material: form.nombre_material.trim(),
        descripcion_material: form.descripcion_material.trim() || undefined,
        imagen_url: form.imagen_url.trim() || undefined,
      };
      const result = CreateGrupoMaterialSchema.safeParse(payload);
      if (result.success) {
        setErrors({});
        return payload;
      }
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return null;
    }

    if (tipo === "sub") {
      const payload = {
        tipo: "sub" as const,
        id_material_padre: Number(form.id_material_padre),
        nombre_material: form.nombre_material.trim(),
        descripcion_material: form.descripcion_material.trim(),
        unidad_medida: form.unidad_medida.trim(),
        ancho: parseOptionalNumber(form.ancho),
        alto: parseOptionalNumber(form.alto),
        grosor: parseOptionalNumber(form.grosor),
        color: form.color.trim(),
        imagen_url: form.imagen_url.trim(),
      };
      const result = CreateSubMaterialSchema.safeParse(payload);
      if (result.success) {
        setErrors({});
        return payload;
      }
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return null;
    }

    // individual
    const payload = {
      nombre_material: form.nombre_material.trim(),
      descripcion_material: form.descripcion_material.trim(),
      unidad_medida: form.unidad_medida.trim(),
      ancho: parseOptionalNumber(form.ancho),
      alto: parseOptionalNumber(form.alto),
      grosor: parseOptionalNumber(form.grosor),
      color: form.color.trim(),
      imagen_url: form.imagen_url.trim(),
    };
    const result = CreateMaterialSchema.safeParse(payload);
    if (result.success) {
      setErrors({});
      return payload;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!nextErrors[field]) nextErrors[field] = issue.message;
    }
    setErrors(nextErrors);
    return null;
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const validatedPayload = validate();
    if (!validatedPayload) return;

    setLoading(true);
    try {
      const res = await fetch("/api/materiales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validatedPayload, tipo }),
      });

      const responsePayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(responsePayload?.error ?? `Error ${res.status}`);
        return;
      }

      onCreated(mapMaterialRow(responsePayload.data as MaterialApiRow));
      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const needsDimensions = tipo === "individual" || tipo === "sub";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {serverError}
        </div>
      )}

      {/* Tipo selector — only shown when not locked by parent */}
      {!initialPadreId && (
        <div>
          <label className={LABEL}>Tipo de material *</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as Tipo);
              setErrors({});
            }}
            className={SELECT_FIELD}
          >
            <option value="individual">Material individual</option>
            <option value="grupo">Grupo de materiales</option>
            <option value="sub">Sub-material (variante)</option>
          </select>
        </div>
      )}

      {/* Parent group selector for sub-materials */}
      {tipo === "sub" && !initialPadreId && (
        <div>
          <label className={LABEL}>Grupo padre *</label>
          <select
            value={form.id_material_padre}
            onChange={(e) => setField("id_material_padre", e.target.value)}
            className={`${SELECT_FIELD} ${errors.id_material_padre ? FIELD_ERROR : ""}`}
          >
            <option value="">Seleccionar grupo</option>
            {grupos.map((g) => (
              <option key={g.id_material} value={g.id_material}>
                {g.nombre_material}
              </option>
            ))}
          </select>
          {errors.id_material_padre && <p className={ERROR_MSG}>{errors.id_material_padre}</p>}
        </div>
      )}

      {tipo === "sub" && initialPadreId && (
        <div>
          <label className={LABEL}>Grupo padre</label>
          <p className="text-[14px] text-[#1e1e1e] px-3 py-2 bg-[#f5f5f5] rounded-[6px]">
            {grupos.find((g) => g.id_material === initialPadreId)?.nombre_material ??
              `Grupo #${initialPadreId}`}
          </p>
        </div>
      )}

      <div>
        <label className={LABEL}>Nombre *</label>
        <input
          type="text"
          maxLength={100}
          placeholder={tipo === "grupo" ? "Ej. PIELES" : "Ej. Acrílico espejo"}
          value={form.nombre_material}
          onChange={(e) => setField("nombre_material", e.target.value)}
          className={`${FIELD} ${getFieldClass("nombre_material")}`}
        />
        {errors.nombre_material && <p className={ERROR_MSG}>{errors.nombre_material}</p>}
      </div>

      <div>
        <label className={LABEL}>Descripción {tipo !== "grupo" ? "*" : ""}</label>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Detalles del material"
          value={form.descripcion_material}
          onChange={(e) => setField("descripcion_material", e.target.value)}
          className={`${FIELD} ${getFieldClass("descripcion_material")} resize-none`}
        />
        {errors.descripcion_material && <p className={ERROR_MSG}>{errors.descripcion_material}</p>}
      </div>

      {needsDimensions && (
        <>
          <div>
            <label className={LABEL}>Unidad de medida *</label>
            <select
              value={form.unidad_medida}
              onChange={(e) => setField("unidad_medida", e.target.value)}
              className={`${SELECT_FIELD} ${getFieldClass("unidad_medida")}`}
            >
              <option value="">Seleccionar unidad</option>
              {UNIDADES_MEDIDA.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === "mm" && "Milímetros (mm)"}
                  {unit === "in" && "Pulgadas (in)"}
                  {unit === "cm" && "Centímetros (cm)"}
                  {unit === "mu" && "Micras (mu)"}
                  {unit === "pt" && "Puntos (pt)"}
                </option>
              ))}
            </select>
            {errors.unidad_medida && <p className={ERROR_MSG}>{errors.unidad_medida}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Ancho *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.ancho}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => setField("ancho", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("ancho")}`}
              />
              {errors.ancho && <p className={ERROR_MSG}>{errors.ancho}</p>}
            </div>
            <div>
              <label className={LABEL}>Alto *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.alto}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => setField("alto", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("alto")}`}
              />
              {errors.alto && <p className={ERROR_MSG}>{errors.alto}</p>}
            </div>
            <div>
              <label className={LABEL}>Grosor *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.grosor}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => setField("grosor", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("grosor")}`}
              />
              {errors.grosor && <p className={ERROR_MSG}>{errors.grosor}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL}>Color *</label>
            <input
              type="text"
              maxLength={50}
              placeholder="Ej. #d18c59 o Negro"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              className={`${FIELD} ${getFieldClass("color")}`}
            />
            {errors.color && <p className={ERROR_MSG}>{errors.color}</p>}
          </div>
        </>
      )}

      <div>
        <label className={LABEL}>Imagen {tipo !== "grupo" ? "*" : ""}</label>
        <MaterialImageInput
          onUploaded={(key) => setField("imagen_url", key ?? "")}
          onError={(message) => setErrors((prev) => ({ ...prev, imagen_url: message }))}
          hasError={Boolean(errors.imagen_url)}
        />
        {errors.imagen_url && <p className={ERROR_MSG}>{errors.imagen_url}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
