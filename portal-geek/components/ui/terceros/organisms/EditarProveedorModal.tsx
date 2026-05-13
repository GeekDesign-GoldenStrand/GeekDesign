"use client";

import { useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { UpdateProveedorInput } from "@/lib/schemas/proveedores";
import { formatPhoneNumber } from "@/lib/utils/format";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.\-' ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(form: ProveedorFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.nombre_proveedor.trim()) errs.nombre_proveedor = "El nombre es requerido.";
  else if (form.nombre_proveedor.length > 30) errs.nombre_proveedor = "Máximo 30 caracteres.";
  else if (!NOMBRE_REGEX.test(form.nombre_proveedor))
    errs.nombre_proveedor = "Solo letras, números, puntos, guiones y apóstrofes.";
  if (!["Proveedor de material", "Proveedor de servicio"].includes(form.tipo))
    errs.tipo = "Seleccione un tipo válido.";
  if (!form.correo.trim()) errs.correo = "El correo es requerido.";
  else if (!EMAIL_REGEX.test(form.correo)) errs.correo = "Correo electrónico inválido.";
  if (!form.telefono) errs.telefono = "El teléfono es requerido.";
  else if (!/^\d{10}$/.test(form.telefono)) errs.telefono = "Debe tener exactamente 10 dígitos.";
  if (form.ubicacion && form.ubicacion.length > 255) errs.ubicacion = "Máximo 255 caracteres.";
  return errs;
}

function parseServerFieldErrors(serverError: string | null): Record<string, string> {
  if (!serverError) return {};
  const fields: (keyof ProveedorFormData)[] = [
    "nombre_proveedor",
    "tipo",
    "correo",
    "telefono",
    "ubicacion",
    "descripcion_proveedor",
    "estatus",
  ];
  const parsed: Record<string, string> = {};
  for (const field of fields) {
    const match = serverError.match(new RegExp(`\\b${field}:\\s*([^,]+)`));
    if (match) parsed[field] = match[1].trim();
  }
  return parsed;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

export type ProveedorFormData = {
  nombre_proveedor: string;
  tipo: "Proveedor de material" | "Proveedor de servicio";
  correo: string;
  telefono: string;
  ubicacion: string;
  descripcion_proveedor: string;
  estatus: string;
};

interface EditarProveedorModalProps {
  isOpen: boolean;
  initialData: ProveedorFormData;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (data: UpdateProveedorInput) => void;
}

export function EditarProveedorModal({
  isOpen,
  initialData,
  loading,
  serverError,
  onClose,
  onSubmit,
}: EditarProveedorModalProps) {
  const [form, setForm] = useState<ProveedorFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Server field errors are overridden by local errors: touching a field clears
  // errors[key] to "", which takes precedence over the server error for that key.
  const allErrors = { ...parseServerFieldErrors(serverError), ...errors };

  if (!isOpen) return null;

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function getFieldClass(key: string) {
    if (allErrors[key]) return FIELD_ERROR;
    if (touched[key]) {
      const val = form[key as keyof typeof form];
      if (key === "correo") return EMAIL_REGEX.test(val) ? FIELD_SUCCESS : "";
      if (key === "telefono") return val && /^\d{10}$/.test(val) ? FIELD_SUCCESS : "";
      if (typeof val === "string" && val.trim()) return FIELD_SUCCESS;
    }
    return "";
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateFields(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit({
      nombre_proveedor: form.nombre_proveedor,
      tipo: form.tipo,
      correo: form.correo || undefined,
      telefono: form.telefono || undefined,
      descripcion_proveedor: form.descripcion_proveedor || undefined,
      ubicacion: form.ubicacion || undefined,
      estatus: form.estatus as UpdateProveedorInput["estatus"],
    });
  }

  return (
    <ModalShell title="Editar Proveedor" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
            {serverError}
          </div>
        )}

        <div>
          <label className={LABEL}>
            Nombre del proveedor <span className="text-[#e42200]">*</span>
          </label>
          <input
            type="text"
            maxLength={30}
            value={form.nombre_proveedor}
            onChange={(e) => setField("nombre_proveedor", e.target.value)}
            className={`${FIELD} ${getFieldClass("nombre_proveedor")}`}
          />
          {allErrors.nombre_proveedor && <p className={ERROR_MSG}>{allErrors.nombre_proveedor}</p>}
        </div>

        <div>
          <label className={LABEL}>
            Tipo <span className="text-[#e42200]">*</span>
          </label>
          <select
            value={form.tipo}
            onChange={(e) => setField("tipo", e.target.value)}
            className={`${FIELD} ${getFieldClass("tipo")}`}
          >
            <option value="Proveedor de material">Proveedor de material</option>
            <option value="Proveedor de servicio">Proveedor de servicio</option>
          </select>
          {allErrors.tipo && <p className={ERROR_MSG}>{allErrors.tipo}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Correo <span className="text-[#e42200]">*</span>
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChange={(e) => setField("correo", e.target.value)}
              className={`${FIELD} ${getFieldClass("correo")}`}
            />
            {allErrors.correo && <p className={ERROR_MSG}>{allErrors.correo}</p>}
          </div>
          <div>
            <label className={LABEL}>
              Teléfono <span className="text-[#e42200]">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="442 123 4567"
              value={formatPhoneNumber(form.telefono)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setField("telefono", digits);
              }}
              className={`${FIELD} ${getFieldClass("telefono")}`}
            />
            {allErrors.telefono && <p className={ERROR_MSG}>{allErrors.telefono}</p>}
          </div>
        </div>

        <div>
          <label className={LABEL}>Ubicación</label>
          <input
            type="text"
            placeholder="Querétaro, Querétaro"
            value={form.ubicacion}
            onChange={(e) => setField("ubicacion", e.target.value)}
            className={`${FIELD} ${getFieldClass("ubicacion")}`}
          />
          {allErrors.ubicacion && <p className={ERROR_MSG}>{allErrors.ubicacion}</p>}
        </div>

        <div>
          <label className={LABEL}>Estatus</label>
          <select
            value={form.estatus}
            onChange={(e) => setField("estatus", e.target.value)}
            className={`${FIELD} ${getFieldClass("estatus")}`}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Baneado">Baneado</option>
          </select>
        </div>

        <div>
          <label className={LABEL}>Descripción</label>
          <textarea
            rows={3}
            placeholder="Detalles adicionales del proveedor..."
            value={form.descripcion_proveedor}
            onChange={(e) => setField("descripcion_proveedor", e.target.value)}
            className={`${FIELD} ${getFieldClass("descripcion_proveedor")} resize-none`}
          />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
