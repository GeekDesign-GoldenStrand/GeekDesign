"use client";

import { useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { UpdateProveedorInput } from "@/lib/schemas/proveedores";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.\-' ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhone(digits: string): string {
  const metro = /^(55|33|81)/.test(digits);
  if (metro) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function validateFields(form: ProveedorFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.nombre_proveedor.trim()) errs.nombre_proveedor = "El nombre es requerido.";
  else if (form.nombre_proveedor.length > 30) errs.nombre_proveedor = "Máximo 30 caracteres.";
  else if (!NOMBRE_REGEX.test(form.nombre_proveedor))
    errs.nombre_proveedor = "Solo letras, números, puntos, guiones y apóstrofes.";
  if (!form.correo.trim()) errs.correo = "El correo es requerido.";
  else if (!EMAIL_REGEX.test(form.correo)) errs.correo = "Correo electrónico inválido.";
  if (form.telefono && !/^\d{10}$/.test(form.telefono))
    errs.telefono = "Debe tener exactamente 10 dígitos.";
  if (form.ubicacion && !/^[^,]+,[^,]+$/.test(form.ubicacion.trim()))
    errs.ubicacion = "Formato requerido: Municipio, Estado";
  return errs;
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

  if (!isOpen) return null;

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function getFieldClass(key: string) {
    if (errors[key]) return FIELD_ERROR;
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
          {errors.nombre_proveedor && <p className={ERROR_MSG}>{errors.nombre_proveedor}</p>}
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
            {errors.correo && <p className={ERROR_MSG}>{errors.correo}</p>}
          </div>
          <div>
            <label className={LABEL}>Teléfono</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="442 123 4567"
              value={formatPhone(form.telefono)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setField("telefono", digits);
              }}
              className={`${FIELD} ${getFieldClass("telefono")}`}
            />
            {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
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
          {errors.ubicacion && <p className={ERROR_MSG}>{errors.ubicacion}</p>}
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
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
