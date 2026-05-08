"use client";

import { useState } from "react";

import { CreateMaterialSchema, UNIDADES_MEDIDA } from "@/lib/schemas/materiales";
import type { MaterialCardProps } from "@/types";
import {
  mapMaterialRow,
  parseOptionalNumber,
  normalizeNumericInput,
  type MaterialApiRow,
} from "@/lib/utils/materiales";

interface EditarMaterialFormProps {
  material: MaterialCardProps;
  onUpdated: (row: MaterialCardProps) => void;
  onDeleted: (materialId: number) => void;
  onClose: () => void;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const SELECT_FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] bg-white transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[14px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

const REQUIRED_NUMERIC = ["ancho", "alto", "grosor"] as const;

export function EditarMaterialForm({
  material,
  onUpdated,
  onDeleted,
  onClose,
}: EditarMaterialFormProps) {
  const [form, setForm] = useState({
    nombre_material: material.name,
    descripcion_material: material.description,
    unidad_medida: material.unit,
    ancho: material.width === "-" ? "" : material.width,
    alto: material.height === "-" ? "" : material.height,
    grosor: material.thickness === "-" ? "" : material.thickness,
    color: material.color === "-" ? "" : material.color,
    imagen_url: material.imageUrl,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getFieldClass(key: keyof typeof form) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key]) {
      const value = form[key];
      if (key === "imagen_url") {
        if (!value.trim()) return "";
        return /^https:\/\//i.test(value.trim()) ? FIELD_SUCCESS : "";
      }
      if (["ancho", "alto", "grosor"].includes(key)) {
        const parsed = parseOptionalNumber(value);
        return parsed && parsed > 0 ? FIELD_SUCCESS : "";
      }
      if (key === "unidad_medida") {
        return value.trim() ? FIELD_SUCCESS : "";
      }
      return value.trim() ? FIELD_SUCCESS : "";
    }
    return "";
  }

  function validate() {
    // Guard empty numeric fields explicitly so undefined values are never
    // silently dropped by JSON.stringify before reaching the API.
    const numericErrors: Record<string, string> = {};
    for (const key of REQUIRED_NUMERIC) {
      if (!form[key].trim()) numericErrors[key] = "Campo requerido";
    }
    if (Object.keys(numericErrors).length > 0) {
      setErrors(numericErrors);
      return null;
    }

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
      const res = await fetch(`/api/materiales/${material.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedPayload),
      });

      const responsePayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(responsePayload?.error ?? `Error ${res.status}`);
        return;
      }

      onUpdated(mapMaterialRow(responsePayload.data as MaterialApiRow));
      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setServerError(null);
    setDeleting(true);

    try {
      const res = await fetch(`/api/materiales/${material.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const responsePayload = await res.json().catch(() => ({}));
        setServerError(responsePayload?.error ?? `Error ${res.status}`);
        setDeleting(false);
        return;
      }

      onDeleted(material.id);
      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {serverError}
        </div>
      )}

      <div>
        <label className={LABEL}>Nombre *</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. Acrílico espejo"
          value={form.nombre_material}
          onChange={(e) => setField("nombre_material", e.target.value)}
          className={`${FIELD} ${getFieldClass("nombre_material")}`}
        />
        {errors.nombre_material && <p className={ERROR_MSG}>{errors.nombre_material}</p>}
      </div>

      <div>
        <label className={LABEL}>Descripción *</label>
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

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className={LABEL}>Imagen URL *</label>
          <input
            type="url"
            maxLength={500}
            placeholder="https://..."
            value={form.imagen_url}
            onChange={(e) => setField("imagen_url", e.target.value)}
            className={`${FIELD} ${getFieldClass("imagen_url")}`}
          />
          {errors.imagen_url && <p className={ERROR_MSG}>{errors.imagen_url}</p>}
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-2">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-5 py-2 text-[14px] font-medium text-white bg-[#e42200] rounded-[7px] hover:bg-[#c71a00] transition-colors disabled:opacity-60"
          disabled={loading || deleting}
        >
          Eliminar
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
            disabled={loading || deleting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || deleting}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-lg p-6 w-full max-w-md">
            <h3 className="text-[18px] font-medium text-[#1e1e1e] mb-4">¿Eliminar material?</h3>
            <p className="text-[14px] text-[#575757] mb-6">
              Esta acción no se puede deshacer. El material &quot;{material.name}&quot; será
              eliminado permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-[14px] font-medium text-white bg-[#e42200] rounded-[7px] hover:bg-[#c71a00] transition-colors disabled:opacity-60"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
