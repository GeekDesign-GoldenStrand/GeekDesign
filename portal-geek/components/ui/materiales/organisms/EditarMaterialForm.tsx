"use client";

import { useState } from "react";

import { ImageUploader } from "@/components/ui/molecules/ImageUploader";
import { CreateMaterialSchema, UNIDADES_MEDIDA } from "@/lib/schemas/materiales";
import {
  mapMaterialRow,
  parseOptionalNumber,
  normalizeNumericInput,
  type MaterialApiRow,
} from "@/lib/utils/materiales";
import type { MaterialCardProps } from "@/types";

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
const FIELD_SUCCESS = "border-[#006aff]";
const LABEL = "block text-[14px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

const REQUIRED_NUMERIC = ["ancho", "alto", "grosor"] as const;

// Confirmation modals invert the usual color semantics on purpose: the
// destructive action is the unstyled (white/bordered) button, the cancel is
// the bold red. This makes "Cancelar" the visually dominant default so users
// can't blow through irreversible deletions by reflex.
const CANCEL_BTN =
  "px-5 py-2 text-[14px] font-medium text-white bg-[#e42200] rounded-[7px] hover:bg-[#c71a00] transition-colors disabled:opacity-60";
const CONFIRM_BTN =
  "px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60";

export function EditarMaterialForm({
  material,
  onUpdated,
  onDeleted,
  onClose,
}: EditarMaterialFormProps) {
  const isGrupo = material.tipo === "grupo";
  const needsDimensions = !isGrupo;

  const [form, setForm] = useState({
    nombre_material: material.name,
    descripcion_material: material.description,
    unidad_medida: material.unit === "-" ? "" : material.unit,
    ancho: material.width === "-" ? "" : material.width,
    alto: material.height === "-" ? "" : material.height,
    grosor: material.thickness === "-" ? "" : material.thickness,
    color: material.color === "-" ? "" : material.color,
  });

  const [newImageKey, setNewImageKey] = useState<string | null>(null);
  const [imageCleared, setImageCleared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImpactConfirm, setShowImpactConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [impacto, setImpacto] = useState<{
    servicios: number;
    proveedores: number;
    instaladores: number;
  } | null>(null);
  const [impactoLoading, setImpactoLoading] = useState(false);
  const [impactoError, setImpactoError] = useState<string | null>(null);

  async function handleFirstConfirm() {
    setImpactoError(null);
    setImpacto(null);
    setImpactoLoading(true);
    setShowDeleteConfirm(false);
    setShowImpactConfirm(true);
    try {
      const res = await fetch(`/api/materiales/${material.id}/impacto`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImpactoError(payload?.error ?? `Error ${res.status}`);
        return;
      }
      setImpacto(payload?.data ?? { servicios: 0, proveedores: 0, instaladores: 0 });
    } catch {
      setImpactoError("Error de red al calcular el impacto.");
    } finally {
      setImpactoLoading(false);
    }
  }

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
    if (isGrupo) {
      const payload: Record<string, unknown> = {
        nombre_material: form.nombre_material.trim(),
        descripcion_material: form.descripcion_material.trim() || undefined,
      };
      if (newImageKey) payload.imagen_url = newImageKey;
      else if (imageCleared) payload.imagen_url = "";

      const nameError = !payload.nombre_material ? "El nombre es requerido." : "";
      if (nameError) {
        setErrors({ nombre_material: nameError });
        return null;
      }
      setErrors({});
      return payload;
    }

    // individual / sub — require numeric fields
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
      descripcion_material: form.descripcion_material.trim() || undefined,
      unidad_medida: form.unidad_medida.trim(),
      ancho: parseOptionalNumber(form.ancho),
      alto: parseOptionalNumber(form.alto),
      grosor: parseOptionalNumber(form.grosor),
      color: form.color.trim(),
      imagen_url: newImageKey ?? (imageCleared ? "" : "placeholder-for-validation"),
    };

    const schemaToUse =
      newImageKey || imageCleared
        ? CreateMaterialSchema
        : CreateMaterialSchema.omit({ imagen_url: true });
    const result = schemaToUse.safeParse(payload);
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

    // For individual/sub: strip the placeholder imagen_url unless a new image was uploaded
    let bodyPayload: Record<string, unknown>;
    if (isGrupo) {
      bodyPayload = validatedPayload;
    } else {
      const { imagen_url: _omit, ...rest } = validatedPayload as Record<string, unknown>;
      void _omit;
      bodyPayload = newImageKey
        ? { ...rest, imagen_url: newImageKey }
        : imageCleared
          ? { ...rest, imagen_url: "" }
          : rest;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/materiales/${material.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
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
      const res = await fetch(`/api/materiales/${material.id}`, { method: "DELETE" });

      if (!res.ok) {
        const responsePayload = await res.json().catch(() => ({}));
        setServerError(responsePayload?.error ?? `Error ${res.status}`);
        setShowImpactConfirm(false);
        setShowFinalConfirm(false);
        setDeleting(false);
        return;
      }

      onDeleted(material.id);
      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
      setShowImpactConfirm(false);
      setShowFinalConfirm(false);
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
              <label className={LABEL}>
                Grosor{form.unidad_medida ? ` (${form.unidad_medida})` : ""} *
              </label>
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
        <label className={LABEL}>Imagen</label>
        <ImageUploader
          mode="single"
          category="materiales"
          initialPreviewUrl={material.imageUrl}
          onUploaded={(key) => {
            setNewImageKey(key);
            setImageCleared(key === null && Boolean(material.imageUrl));
            setErrors((prev) => ({ ...prev, imagen_url: "" }));
          }}
          onError={(message) => setErrors((prev) => ({ ...prev, imagen_url: message }))}
          hasError={Boolean(errors.imagen_url)}
        />
        {errors.imagen_url && <p className={ERROR_MSG}>{errors.imagen_url}</p>}
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
            className="px-5 py-2 text-[14px] font-medium text-white bg-[#e42200] rounded-[7px] hover:bg-[#c71a00] transition-colors disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-lg p-6 w-full max-w-md">
            <h3 className="text-[18px] font-medium text-[#1e1e1e] mb-4">
              {isGrupo ? "¿Eliminar grupo?" : "¿Eliminar material?"}
            </h3>
            <p className="text-[14px] text-[#575757] mb-6">
              {isGrupo ? (
                <>
                  ¿Estás seguro que quieres eliminar el grupo &quot;{material.name}&quot;?{" "}
                  <strong className="text-[#1e1e1e]">
                    Esto también eliminará todos sus sub-materiales.
                  </strong>
                </>
              ) : (
                `¿Estás seguro que quieres eliminar el material "${material.name}"?`
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={CANCEL_BTN}
              >
                Cancelar
              </button>
              <button type="button" onClick={handleFirstConfirm} className={CONFIRM_BTN}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImpactConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-lg p-6 w-full max-w-md">
            <h3 className="text-[18px] font-medium text-[#e42200] mb-4">Acción irreversible</h3>

            {impactoLoading && (
              <p className="text-[14px] text-[#575757] mb-6">Calculando impacto...</p>
            )}

            {impactoError && (
              <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2 mb-4">
                {impactoError}
              </div>
            )}

            {!impactoLoading && !impactoError && impacto && (
              <>
                <p className="text-[14px] text-[#575757] mb-3">
                  <strong className="text-[#e42200]">Esta acción no se puede deshacer.</strong>{" "}
                  Afectará a:
                </p>
                <ul className="text-[14px] text-[#1e1e1e] mb-6 list-disc pl-5 space-y-1">
                  <li>
                    <strong className="text-[#e42200]">{impacto.servicios}</strong>{" "}
                    <strong>{impacto.servicios === 1 ? "servicio" : "servicios"}</strong>
                  </li>
                  <li>
                    <strong className="text-[#e42200]">{impacto.proveedores}</strong>{" "}
                    <strong>{impacto.proveedores === 1 ? "proveedor" : "proveedores"}</strong>
                  </li>
                  <li>
                    <strong className="text-[#e42200]">{impacto.instaladores}</strong>{" "}
                    <strong>{impacto.instaladores === 1 ? "instalador" : "instaladores"}</strong>
                  </li>
                </ul>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImpactConfirm(false)}
                className={CANCEL_BTN}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImpactConfirm(false);
                  setShowFinalConfirm(true);
                }}
                disabled={deleting || impactoLoading || Boolean(impactoError)}
                className={CONFIRM_BTN}
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-lg p-6 w-full max-w-md">
            <h3 className="text-[18px] font-medium text-[#e42200] mb-4">Última confirmación</h3>
            <p className="text-[14px] text-[#575757] mb-6">
              <strong className="text-[#1e1e1e]">
                Revisa tus proveedores, instaladores y servicios. Asegúrate de que tengan al menos
                un material registrado.
              </strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinalConfirm(false)}
                className={CANCEL_BTN}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={CONFIRM_BTN}
              >
                {deleting ? "Eliminando..." : "Entendido, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
