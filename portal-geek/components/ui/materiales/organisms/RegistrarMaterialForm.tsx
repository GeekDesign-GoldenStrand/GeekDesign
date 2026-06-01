"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { ImageUploader } from "@/components/ui/molecules/ImageUploader";
import {
  CreateCategoriaMaterialSchema,
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

type Tipo = "individual" | "grupo" | "sub" | "categoria";

interface MaterialOption {
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
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#006aff]";
const LABEL = "block text-[14px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

export function RegistrarMaterialForm({
  onCreated,
  onClose,
  initialTipo = "individual",
  initialPadreId,
}: RegistrarMaterialFormProps) {
  const [tipo, setTipo] = useState<Tipo>(initialTipo);
  const [grupos, setGrupos] = useState<MaterialOption[]>([]);
  const [categorias, setCategorias] = useState<MaterialOption[]>([]);

  const [form, setForm] = useState({
    nombre_material: "",
    descripcion_material: "",
    unidad_medida: "",
    ancho: "",
    alto: "",
    grosor: "",
    velocidad_avance: "",
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
        const data = (payload?.data ?? []) as MaterialOption[];
        setGrupos(data);
      })
      .catch(() => {});
  }, [tipo]);

  // Fetch categorías when tipo is "grupo" or "individual" (para selector opcional).
  useEffect(() => {
    if (tipo !== "grupo" && tipo !== "individual") return;
    fetch("/api/materiales?mode=categorias")
      .then((r) => r.json())
      .then((payload) => {
        const data = (payload?.data ?? []) as MaterialOption[];
        // "Sin categoría" === no parent (the value="" option below). Never list a
        // real row by that name so it can't collide with the null option.
        setCategorias(
          data.filter((c) => c.nombre_material.trim().toLowerCase() !== "sin categoría")
        );
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
      if (["ancho", "alto", "grosor", "velocidad_avance"].includes(key)) {
        const parsed = parseOptionalNumber(value);
        return parsed && parsed > 0 ? FIELD_SUCCESS : "";
      }
      return value.trim() ? FIELD_SUCCESS : "";
    }
    return "";
  }

  function validate() {
    if (tipo === "categoria") {
      const payload = {
        tipo: "categoria" as const,
        nombre_material: form.nombre_material.trim(),
        descripcion_material: form.descripcion_material.trim() || undefined,
        imagen_url: form.imagen_url.trim() || undefined,
      };
      const result = CreateCategoriaMaterialSchema.safeParse(payload);
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

    if (tipo === "grupo") {
      const padre = form.id_material_padre ? Number(form.id_material_padre) : null;
      const payload = {
        tipo: "grupo" as const,
        id_material_padre: padre,
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
        descripcion_material: form.descripcion_material.trim() || undefined,
        unidad_medida: form.unidad_medida.trim(),
        ancho: parseOptionalNumber(form.ancho),
        alto: parseOptionalNumber(form.alto),
        grosor: parseOptionalNumber(form.grosor),
        velocidad_avance: parseOptionalNumber(form.velocidad_avance),
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
    const padreIndividual = form.id_material_padre ? Number(form.id_material_padre) : null;
    const payload = {
      id_material_padre: padreIndividual,
      nombre_material: form.nombre_material.trim(),
      descripcion_material: form.descripcion_material.trim() || undefined,
      unidad_medida: form.unidad_medida.trim(),
      ancho: parseOptionalNumber(form.ancho),
      alto: parseOptionalNumber(form.alto),
      grosor: parseOptionalNumber(form.grosor),
      velocidad_avance: parseOptionalNumber(form.velocidad_avance),
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
          <Select
            value={tipo}
            onChange={(v) => {
              setTipo(v as Tipo);
              setErrors({});
            }}
            size="sm"
          >
            <SelectOption value="categoria">Categoría</SelectOption>
            <SelectOption value="grupo">Grupo</SelectOption>
            <SelectOption value="sub">Variante</SelectOption>
            <SelectOption value="individual">Material individual</SelectOption>
          </Select>
        </div>
      )}

      {/* Categoría picker — opcional para grupos e individuales */}
      {(tipo === "grupo" || tipo === "individual") && (
        <div>
          <label className={LABEL}>Categoría (opcional)</label>
          <Select
            value={form.id_material_padre}
            onChange={(v) => setField("id_material_padre", v)}
            placeholder="Sin categoría"
            size="sm"
          >
            <SelectOption value="">Sin categoría</SelectOption>
            {categorias.map((c) => (
              <SelectOption key={c.id_material} value={String(c.id_material)}>
                {c.nombre_material}
              </SelectOption>
            ))}
          </Select>
        </div>
      )}

      {/* Parent group selector for sub-materials */}
      {tipo === "sub" && !initialPadreId && (
        <div>
          <label className={LABEL}>Grupo padre *</label>
          <Select
            value={form.id_material_padre}
            onChange={(v) => setField("id_material_padre", v)}
            placeholder="Seleccionar grupo"
            size="sm"
            error={errors.id_material_padre || undefined}
          >
            {grupos.map((g) => (
              <SelectOption key={g.id_material} value={String(g.id_material)}>
                {g.nombre_material}
              </SelectOption>
            ))}
          </Select>
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
          placeholder={
            tipo === "categoria"
              ? "Ej. Maderas"
              : tipo === "grupo"
                ? "Ej. MDF"
                : tipo === "sub"
                  ? "Ej. MDF 3mm"
                  : "Ej. Acrílico espejo"
          }
          value={form.nombre_material}
          onChange={(e) => setField("nombre_material", e.target.value)}
          className={`${FIELD} ${getFieldClass("nombre_material")}`}
        />
        {errors.nombre_material && <p className={ERROR_MSG}>{errors.nombre_material}</p>}
      </div>

      <div>
        <label className={LABEL}>Descripción</label>
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
            <Select
              value={form.unidad_medida}
              onChange={(v) => setField("unidad_medida", v)}
              placeholder="Seleccionar unidad"
              size="sm"
              error={errors.unidad_medida || undefined}
            >
              {UNIDADES_MEDIDA.map((unit) => (
                <SelectOption key={unit} value={unit}>
                  {unit === "mm" && "Milímetros (mm)"}
                  {unit === "in" && "Pulgadas (in)"}
                  {unit === "cm" && "Centímetros (cm)"}
                  {unit === "mu" && "Micras (mu)"}
                  {unit === "pt" && "Puntos (pt)"}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>
                Ancho{form.unidad_medida ? ` (${form.unidad_medida})` : ""} *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.ancho}
                onChange={(e) => setField("ancho", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("ancho")}`}
              />
              {errors.ancho && <p className={ERROR_MSG}>{errors.ancho}</p>}
            </div>
            <div>
              <label className={LABEL}>
                Alto{form.unidad_medida ? ` (${form.unidad_medida})` : ""} *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.alto}
                onChange={(e) => setField("alto", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("alto")}`}
              />
              {errors.alto && <p className={ERROR_MSG}>{errors.alto}</p>}
            </div>
            <div>
              <label className={LABEL}>Grosor (mm) *</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.grosor}
                onChange={(e) => setField("grosor", normalizeNumericInput(e.target.value))}
                className={`${FIELD} ${getFieldClass("grosor")}`}
              />
              {errors.grosor && <p className={ERROR_MSG}>{errors.grosor}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL}>Velocidad de avance (mm/s) *</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.velocidad_avance}
              onChange={(e) => setField("velocidad_avance", normalizeNumericInput(e.target.value))}
              className={`${FIELD} ${getFieldClass("velocidad_avance")}`}
            />
            {errors.velocidad_avance && <p className={ERROR_MSG}>{errors.velocidad_avance}</p>}
          </div>

          <div>
            <label className={LABEL}>Descripción de color *</label>
            <input
              type="text"
              maxLength={50}
              placeholder="Ej. Rojo"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              className={`${FIELD} ${getFieldClass("color")}`}
            />
            {errors.color && <p className={ERROR_MSG}>{errors.color}</p>}
          </div>
        </>
      )}

      <div>
        <label className={LABEL}>
          Imagen {tipo !== "grupo" && tipo !== "categoria" ? "*" : ""}
        </label>
        <ImageUploader
          mode="single"
          category="materiales"
          onUploaded={(key) => setField("imagen_url", key ?? "")}
          onError={(message) => setErrors((prev) => ({ ...prev, imagen_url: message }))}
          hasError={Boolean(errors.imagen_url)}
        />
        {errors.imagen_url && <p className={ERROR_MSG}>{errors.imagen_url}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
