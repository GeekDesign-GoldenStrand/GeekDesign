"use client";

import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { isValidPhoneNumber, PhoneInputMX } from "@/components/ui/atoms/PhoneInputMX";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { UpdateInstaladorInput } from "@/lib/schemas/instaladores";
import { UBICACION_REGEX } from "@/lib/schemas/proveedores";
import { toE164 } from "@/lib/utils/format";
import { isValidMoney, isValidMoneyInput } from "@/lib/utils/money";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;
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

function validateFields(form: InstaladorFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.nombre_instalador.trim()) errs.nombre_instalador = "El nombre es requerido.";
  else if (form.nombre_instalador.length > 30) errs.nombre_instalador = "Máximo 30 caracteres.";
  else if (!NOMBRE_REGEX.test(form.nombre_instalador))
    errs.nombre_instalador = "Solo letras, números, puntos, guiones y apóstrofes.";
  if (form.apodo && form.apodo.length > 30) errs.apodo = "Máximo 30 caracteres.";
  else if (form.apodo && !NOMBRE_REGEX.test(form.apodo))
    errs.apodo = "Solo letras, números, puntos, guiones y apóstrofes.";
  if (!form.correo.trim()) errs.correo = "El correo es requerido.";
  else if (!EMAIL_REGEX.test(form.correo)) errs.correo = "Correo electrónico inválido.";
  if (!form.telefono) errs.telefono = "El teléfono es requerido.";
  else if (!isValidPhoneNumber(form.telefono)) errs.telefono = "Número de teléfono inválido.";
  if (!["Instalador", "Contratista"].includes(form.tipo)) errs.tipo = "Seleccione un tipo válido.";
  if (form.ubicacion) {
    if (form.ubicacion.length > 100) errs.ubicacion = "Máximo 100 caracteres.";
    else if (!UBICACION_REGEX.test(form.ubicacion.trim()))
      errs.ubicacion = "Solo se permiten caracteres en inglés y español.";
  }
  if (form.notas && form.notas.length > 500) errs.notas = "Máximo 500 caracteres.";
  if (!form.costo_instalacion.trim()) errs.costo_instalacion = "La tarifa base es requerida.";
  else if (!isValidMoney(form.costo_instalacion))
    errs.costo_instalacion = "Debe ser un número mayor o igual a 0.";
  if (!form.color) errs.color = "Selecciona un color identificador.";
  return errs;
}

function parseServerFieldErrors(serverError: string | null): Record<string, string> {
  if (!serverError) return {};
  const fields: (keyof InstaladorFormData)[] = [
    "nombre_instalador",
    "apodo",
    "tipo",
    "correo",
    "telefono",
    "ubicacion",
    "notas",
    "estatus",
    "costo_instalacion",
    "color",
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

export type InstaladorFormData = {
  nombre_instalador: string;
  apodo: string;
  tipo: "Instalador" | "Contratista";
  correo: string;
  telefono: string;
  ubicacion: string;
  notas: string;
  estatus: string;
  costo_instalacion: string;
  color: string;
};

interface EditarInstaladorModalProps {
  isOpen: boolean;
  initialData: InstaladorFormData;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (data: UpdateInstaladorInput) => void;
}

export function EditarInstaladorModal({
  isOpen,
  initialData,
  loading,
  serverError,
  onClose,
  onSubmit,
}: EditarInstaladorModalProps) {
  const [form, setForm] = useState<InstaladorFormData>(() => ({
    ...initialData,
    telefono: toE164(initialData.telefono),
  }));
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
      if (key === "telefono") return val && isValidPhoneNumber(val) ? FIELD_SUCCESS : "";
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
      nombre_instalador: form.nombre_instalador,
      apodo: form.apodo || undefined,
      tipo: form.tipo,
      correo: form.correo,
      telefono: form.telefono,
      ubicacion: form.ubicacion || undefined,
      notas: form.notas || undefined,
      estatus: form.estatus as UpdateInstaladorInput["estatus"],
      costo_instalacion: parseFloat(form.costo_instalacion),
      color: form.color,
    });
  }

  return (
    <ModalShell title="Editar Instalador" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
            {serverError}
          </div>
        )}

        <div>
          <label className={LABEL}>
            Nombre del instalador <span className="text-[#e42200]">*</span>
          </label>
          <input
            type="text"
            maxLength={30}
            value={form.nombre_instalador}
            onChange={(e) => setField("nombre_instalador", e.target.value)}
            className={`${FIELD} ${getFieldClass("nombre_instalador")}`}
          />
          {allErrors.nombre_instalador && (
            <p className={ERROR_MSG}>{allErrors.nombre_instalador}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Apodo</label>
            <input
              type="text"
              maxLength={30}
              placeholder="Apodo o alias"
              value={form.apodo}
              onChange={(e) => setField("apodo", e.target.value)}
              className={`${FIELD} ${getFieldClass("apodo")}`}
            />
            {allErrors.apodo && <p className={ERROR_MSG}>{allErrors.apodo}</p>}
          </div>

          <div>
            <label className={LABEL}>
              Tipo <span className="text-[#e42200]">*</span>
            </label>
            <Select
              value={form.tipo}
              onChange={(v) => setField("tipo", v)}
              size="sm"
              error={allErrors.tipo || undefined}
            >
              <SelectOption value="Instalador">Instalador</SelectOption>
              <SelectOption value="Contratista">Contratista</SelectOption>
            </Select>
          </div>
        </div>

        <div>
          <label className={LABEL}>
            Tarifa base <span className="text-[#e42200]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8e908f] pointer-events-none">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.costo_instalacion}
              onChange={(e) => {
                const raw = e.target.value;
                if (isValidMoneyInput(raw)) setField("costo_instalacion", raw);
              }}
              className={`${FIELD} ${getFieldClass("costo_instalacion")} pl-7`}
            />
          </div>
          {allErrors.costo_instalacion && (
            <p className={ERROR_MSG}>{allErrors.costo_instalacion}</p>
          )}
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
            <PhoneInputMX
              value={form.telefono}
              onChange={(e164) => setField("telefono", e164)}
              hasError={!!allErrors.telefono}
            />
            {allErrors.telefono && <p className={ERROR_MSG}>{allErrors.telefono}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <Select value={form.estatus} onChange={(v) => setField("estatus", v)} size="sm">
              <SelectOption value="Activo">Activo</SelectOption>
              <SelectOption value="Inactivo">Inactivo</SelectOption>
              <SelectOption value="Baneado">Baneado</SelectOption>
            </Select>
          </div>
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
          <label className={LABEL}>Notas</label>
          <textarea
            rows={3}
            placeholder="Detalles adicionales del instalador..."
            value={form.notas}
            onChange={(e) => setField("notas", e.target.value)}
            className={`${FIELD} ${getFieldClass("notas")} resize-none`}
          />
          {allErrors.notas && <p className={ERROR_MSG}>{allErrors.notas}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
