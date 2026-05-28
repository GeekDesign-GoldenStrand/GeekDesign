"use client";

import { useState } from "react";

import { CharCounter } from "@/components/ui/terceros/atoms/CharCounter";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import {
  CreateProveedorSchema,
  UBICACION_REGEX,
  type UpdateProveedorInput,
} from "@/lib/schemas/proveedores";
import { formatPhoneNumber, normalizePhone } from "@/lib/utils/format";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.\-' ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLORS: { value: string; label: string }[] = [
  { value: "#EF4444", label: "Rojo" },
  { value: "#F97316", label: "Naranja" },
  { value: "#EAB308", label: "Amarillo" },
  { value: "#22C55E", label: "Verde" },
  { value: "#14B8A6", label: "Verde azulado" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#6366F1", label: "Índigo" },
  { value: "#8B5CF6", label: "Violeta" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#F43F5E", label: "Carmín" },
  { value: "#64748B", label: "Gris pizarra" },
  { value: "#78716C", label: "Marrón" },
];

function validateFields(form: ProveedorFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.nombre_proveedor.trim()) errs.nombre_proveedor = "El nombre es requerido.";
  else if (form.nombre_proveedor.length > 30) errs.nombre_proveedor = "Máximo 30 caracteres.";
  else if (!NOMBRE_REGEX.test(form.nombre_proveedor))
    errs.nombre_proveedor = "Solo letras, números, puntos, guiones y apóstrofes.";
  if (form.apodo) {
    if (form.apodo.length > 30) errs.apodo = "Máximo 30 caracteres.";
    else if (!NOMBRE_REGEX.test(form.apodo))
      errs.apodo = "Solo letras, números, puntos, guiones y apóstrofes.";
  }
  if (!["Proveedor de material", "Proveedor de servicio"].includes(form.tipo))
    errs.tipo = "Seleccione un tipo válido.";
  if (!form.correo.trim()) errs.correo = "El correo es requerido.";
  else if (!EMAIL_REGEX.test(form.correo)) errs.correo = "Correo electrónico inválido.";
  if (!form.telefono) errs.telefono = "El teléfono es requerido.";
  else if (!/^\d{10}$/.test(form.telefono)) errs.telefono = "Debe tener exactamente 10 dígitos.";
  if (form.ubicacion) {
    if (form.ubicacion.length > 100) errs.ubicacion = "Máximo 100 caracteres.";
    else if (!UBICACION_REGEX.test(form.ubicacion.trim()))
      errs.ubicacion = "Solo se permiten caracteres en inglés y español.";
  }
  if (form.descripcion_proveedor.length > 500)
    errs.descripcion_proveedor = "Máximo 500 caracteres.";
  if (!form.color) errs.color = "Selecciona un color identificador.";
  return errs;
}

function parseServerFieldErrors(serverError: string | null): Record<string, string> {
  if (!serverError) return {};
  // Derive the field list from the schema so new fields are picked up automatically.
  const fields = Object.keys(CreateProveedorSchema.shape);
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
  apodo: string;
  tipo: "Proveedor de material" | "Proveedor de servicio";
  correo: string;
  telefono: string;
  ubicacion: string;
  descripcion_proveedor: string;
  estatus: string;
  color: string;
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
      apodo: form.apodo || undefined,
      tipo: form.tipo,
      correo: form.correo || undefined,
      telefono: form.telefono || undefined,
      descripcion_proveedor: form.descripcion_proveedor || undefined,
      ubicacion: form.ubicacion || undefined,
      estatus: form.estatus as UpdateProveedorInput["estatus"],
      color: form.color,
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

        <div className="grid grid-cols-2 gap-4">
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
            {allErrors.nombre_proveedor && (
              <p className={ERROR_MSG}>{allErrors.nombre_proveedor}</p>
            )}
            <CharCounter value={form.nombre_proveedor} max={30} />
          </div>
          <div>
            <label className={LABEL}>Apodo</label>
            <input
              type="text"
              maxLength={30}
              value={form.apodo}
              onChange={(e) => setField("apodo", e.target.value)}
              className={`${FIELD} ${getFieldClass("apodo")}`}
            />
            {allErrors.apodo && <p className={ERROR_MSG}>{allErrors.apodo}</p>}
            <CharCounter value={form.apodo} max={30} />
          </div>
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
                setField("telefono", normalizePhone(e.target.value));
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
            maxLength={100}
            placeholder="Ej. Blvrd Mediterráneo 236 B, Villa Corregidora, 76900 El Pueblito, Qro."
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
          <label className={LABEL}>Color identificador</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setField("color", c.value)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  form.color === c.value
                    ? "border-[#1e1e1e] scale-110 shadow-md ring-2 ring-offset-1 ring-[#1e1e1e]/20"
                    : "border-transparent hover:scale-105 hover:border-[#b9b8b8]"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <button
              type="button"
              title="Sin color"
              onClick={() => setField("color", "")}
              className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-bold ${
                !form.color
                  ? "border-[#1e1e1e] bg-[#f5f5f5] text-[#1e1e1e] scale-110 shadow-md"
                  : "border-[#b9b8b8] bg-white text-[#8e908f] hover:scale-105"
              }`}
            >
              ∅
            </button>
          </div>
          {form.color ? (
            <p className="text-[12px] text-[#8e908f] mt-1">
              Color seleccionado: <span className="font-medium text-[#1e1e1e]">{form.color}</span>
            </p>
          ) : (
            allErrors.color && <p className={ERROR_MSG}>{allErrors.color}</p>
          )}
        </div>

        <div>
          <label className={LABEL}>Descripción</label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Detalles adicionales del proveedor..."
            value={form.descripcion_proveedor}
            onChange={(e) => setField("descripcion_proveedor", e.target.value)}
            className={`${FIELD} ${getFieldClass("descripcion_proveedor")} resize-none`}
          />
          {allErrors.descripcion_proveedor && (
            <p className={ERROR_MSG}>{allErrors.descripcion_proveedor}</p>
          )}
          <CharCounter value={form.descripcion_proveedor} max={500} />
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
