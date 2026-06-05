"use client";

import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/atoms/Button";
import { isValidPhoneNumber, PhoneInputMX } from "@/components/ui/atoms/PhoneInputMX";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { CharCounter } from "@/components/ui/terceros/atoms/CharCounter";
import type { CreateInstaladorInput } from "@/lib/schemas/instaladores";
import { UBICACION_REGEX } from "@/lib/schemas/proveedores";
import { isValidMoney, isValidMoneyInput } from "@/lib/utils/money";
import type { TerceroCardProps, TerceroStatus } from "@/types";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

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

const proveedorSchema = z.object({
  nombre_proveedor: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes."),
  apodo: z
    .string()
    .refine((v) => !v || v.length <= 30, "Máximo 30 caracteres.")
    .refine(
      (v) => !v || NOMBRE_REGEX.test(v),
      "Solo letras, números, puntos, guiones y apóstrofes."
    ),
  correo: z
    .string()
    .min(1, "El correo es requerido.")
    .refine((v) => EMAIL_REGEX.test(v), "Correo electrónico inválido."),
  telefono: z
    .string()
    .min(1, "El teléfono es requerido.")
    .refine((v) => isValidPhoneNumber(v), "Número de teléfono inválido."),
  ubicacion: z
    .string()
    .max(100, "Máximo 100 caracteres.")
    .refine(
      (v) => !v || UBICACION_REGEX.test(v.trim()),
      "Solo se permiten caracteres en inglés y español."
    ),
  color: z
    .string()
    .min(1, "Selecciona un color identificador.")
    .regex(HEX_COLOR_REGEX, "El color debe ser un HEX válido."),
});

const instaladorSchema = z.object({
  nombre_instalador: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes."),
  apodo: z
    .string()
    .refine((v) => !v || v.length <= 30, "Máximo 30 caracteres.")
    .refine(
      (v) => !v || NOMBRE_REGEX.test(v),
      "Solo letras, números, puntos, guiones y apóstrofes."
    ),
  correo: z
    .string()
    .min(1, "El correo es requerido.")
    .refine((v) => EMAIL_REGEX.test(v), "Correo electrónico inválido."),
  telefono: z
    .string()
    .min(1, "El teléfono es requerido.")
    .refine((v) => isValidPhoneNumber(v), "Número de teléfono inválido."),
  notas: z.string().max(500, "Máximo 500 caracteres."),
  ubicacion: z
    .string()
    .max(100, "Máximo 100 caracteres.")
    .refine(
      (v) => !v || UBICACION_REGEX.test(v.trim()),
      "Solo se permiten caracteres en inglés y español."
    ),
  costo_instalacion: z
    .string()
    .min(1, "La tarifa base es requerida.")
    .refine(isValidMoney, "Debe ser un número mayor o igual a 0."),
  color: z
    .string()
    .min(1, "Selecciona un color identificador.")
    .regex(HEX_COLOR_REGEX, "El color debe ser un HEX válido."),
});

type TerceroType = "Proveedor" | "Instalador";

interface RegistrarTerceroFormProps {
  onCreated: (row: TerceroCardProps) => void;
  onClose: () => void;
  initialType?: TerceroType;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";

const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

export function RegistrarTerceroForm({
  onCreated,
  onClose,
  initialType = "Proveedor",
}: RegistrarTerceroFormProps) {
  const [terceroType, setTerceroType] = useState<TerceroType>(initialType);

  const [form, setForm] = useState({
    nombre_proveedor: "",
    apodo: "",
    tipo_proveedor_seleccion: "Material" as "Material" | "Servicio" | "Ambos",
    tipo_instalador: "Instalador" as CreateInstaladorInput["tipo"],
    telefono: "",
    correo: "",
    ubicacion: "",
    notas: "",
    descripcion_proveedor: "",
    estatus: "Activo",
    costo_instalacion: "",
    color: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getFieldClass(key: string) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key]) {
      const val = form[key as keyof typeof form];
      if (key === "correo" && typeof val === "string")
        return val && EMAIL_REGEX.test(val) ? FIELD_SUCCESS : "";
      if (key === "telefono" && typeof val === "string")
        return val && isValidPhoneNumber(val) ? FIELD_SUCCESS : "";
      if (typeof val === "string" && val.trim()) return FIELD_SUCCESS;
      if (typeof val === "number" && val > 0) return FIELD_SUCCESS;
    }
    return "";
  }

  function validate() {
    const next: Record<string, string> = {};

    if (terceroType === "Proveedor") {
      const result = proveedorSchema.safeParse({
        nombre_proveedor: form.nombre_proveedor,
        apodo: form.apodo,
        correo: form.correo,
        telefono: form.telefono,
        ubicacion: form.ubicacion,
        color: form.color,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!next[field]) next[field] = issue.message;
        }
      }
    } else {
      const result = instaladorSchema.safeParse({
        nombre_instalador: form.nombre_proveedor,
        apodo: form.apodo,
        correo: form.correo,
        telefono: form.telefono,
        notas: form.notas,
        ubicacion: form.ubicacion,
        costo_instalacion: form.costo_instalacion,
        color: form.color,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!next[field]) next[field] = issue.message;
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      if (terceroType === "Proveedor") {
        const selectedTypes =
          form.tipo_proveedor_seleccion === "Material"
            ? ["Proveedor de material"]
            : form.tipo_proveedor_seleccion === "Servicio"
              ? ["Proveedor de servicio"]
              : ["Proveedor de material", "Proveedor de servicio"];

        const body = {
          nombre_proveedor: form.nombre_proveedor,
          apodo: form.apodo || undefined,
          tipo: selectedTypes.join(", "),
          telefono: form.telefono,
          correo: form.correo,
          descripcion_proveedor: form.descripcion_proveedor || undefined,
          ubicacion: form.ubicacion || undefined,
          estatus: form.estatus,
          color: form.color,
        };

        const res = await fetch("/api/proveedores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setServerError(data?.error ?? `Error ${res.status}`);
          return;
        }

        const { data } = await res.json();
        window.alert("Proveedor registrado correctamente");

        onCreated({
          id: data.id_proveedor,
          companyName: data.nombre_proveedor,
          contactName: data.apodo || data.nombre_proveedor,
          location: data.ubicacion ?? "",
          role: "Proveedor",
          status: data.estatus as TerceroStatus,
          email: data.correo ?? "",
          phone: data.telefono ?? "",
          tipo: data.tipo,
        });
      } else {
        const body = {
          nombre_instalador: form.nombre_proveedor,
          apodo: form.apodo || undefined,
          tipo: form.tipo_instalador,
          telefono: form.telefono,
          correo: form.correo,
          notas: form.notas || undefined,
          ubicacion: form.ubicacion || undefined,
          costo_instalacion: parseFloat(form.costo_instalacion),
          color: form.color,
        };

        const res = await fetch("/api/instaladores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setServerError(data?.error ?? `Error ${res.status}`);
          return;
        }

        const { data } = await res.json();
        window.alert("Instalador registrado correctamente");

        onCreated({
          id: data.id_instalador,
          companyName: data.nombre_instalador,
          contactName: data.apodo ?? data.nombre_instalador,
          location: data.ubicacion ?? "",
          role: "Instalador",
          status: data.estatus as TerceroStatus,
          email: data.correo ?? "",
          phone: data.telefono ?? "",
          tipo: data.tipo,
        });
      }

      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const colorPicker = (
    <div>
      <label className={LABEL}>
        Color identificador <span className="text-[#e42200]">*</span>
      </label>
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
      </div>
      {form.color ? (
        <p className="text-[12px] text-[#8e908f] mt-1">
          Color seleccionado: <span className="font-medium text-[#1e1e1e]">{form.color}</span>
        </p>
      ) : (
        errors.color && <p className={ERROR_MSG}>{errors.color}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex bg-[#f1f3f5] p-1.5 rounded-full mb-4 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setTerceroType("Proveedor");
            setErrors({});
          }}
          className={`flex-1 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
            terceroType === "Proveedor"
              ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#006aff] scale-100"
              : "text-[#575757] hover:text-[#1e1e1e] hover:bg-[#e8ecef] scale-[0.98]"
          }`}
        >
          Proveedor
        </button>
        <button
          type="button"
          onClick={() => {
            setTerceroType("Instalador");
            setErrors({});
          }}
          className={`flex-1 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
            terceroType === "Instalador"
              ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#006aff] scale-100"
              : "text-[#575757] hover:text-[#1e1e1e] hover:bg-[#e8ecef] scale-[0.98]"
          }`}
        >
          Instalador
        </button>
      </div>

      {serverError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {serverError}
        </div>
      )}

      {terceroType === "Proveedor" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                Nombre del proveedor <span className="text-[#e42200]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Empresa SA"
                maxLength={30}
                value={form.nombre_proveedor}
                onChange={(e) => setField("nombre_proveedor", e.target.value)}
                className={`${FIELD} ${getFieldClass("nombre_proveedor")}`}
              />
              {errors.nombre_proveedor && <p className={ERROR_MSG}>{errors.nombre_proveedor}</p>}
              <CharCounter value={form.nombre_proveedor} max={30} />
            </div>
            <div>
              <label className={LABEL}>Apodo</label>
              <input
                type="text"
                placeholder="Ej. Mi apodo"
                maxLength={30}
                value={form.apodo}
                onChange={(e) => setField("apodo", e.target.value)}
                className={`${FIELD} ${getFieldClass("apodo")}`}
              />
              {errors.apodo && <p className={ERROR_MSG}>{errors.apodo}</p>}
              <CharCounter value={form.apodo} max={30} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <div>
              <label className={LABEL}>
                Tipo <span className="text-[#e42200]">*</span>
              </label>
              <Select
                value={form.tipo_proveedor_seleccion}
                onChange={(v) => setField("tipo_proveedor_seleccion", v)}
                size="sm"
                error={errors.tipo_proveedor_seleccion || undefined}
              >
                <SelectOption value="Material">Material</SelectOption>
                <SelectOption value="Servicio">Servicio</SelectOption>
                <SelectOption value="Ambos">Ambos</SelectOption>
              </Select>
            </div>
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
              <label className={LABEL}>
                Teléfono <span className="text-[#e42200]">*</span>
              </label>
              <PhoneInputMX
                value={form.telefono}
                onChange={(e164) => setField("telefono", e164)}
                hasError={!!errors.telefono}
              />
              {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
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
            {errors.ubicacion && <p className={ERROR_MSG}>{errors.ubicacion}</p>}
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
            <CharCounter value={form.descripcion_proveedor} max={500} />
          </div>

          {colorPicker}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                Nombre <span className="text-[#e42200]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                maxLength={30}
                value={form.nombre_proveedor}
                onChange={(e) => setField("nombre_proveedor", e.target.value)}
                className={`${FIELD} ${getFieldClass("nombre_proveedor")}`}
              />
              {errors.nombre_proveedor && <p className={ERROR_MSG}>{errors.nombre_proveedor}</p>}
              <CharCounter value={form.nombre_proveedor} max={30} />
            </div>
            <div>
              <label className={LABEL}>Apodo</label>
              <input
                type="text"
                placeholder="Ej. El Rápido"
                maxLength={30}
                value={form.apodo}
                onChange={(e) => setField("apodo", e.target.value)}
                className={`${FIELD} ${getFieldClass("apodo")}`}
              />
              {errors.apodo && <p className={ERROR_MSG}>{errors.apodo}</p>}
              <CharCounter value={form.apodo} max={30} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <div>
              <label className={LABEL}>
                Tipo <span className="text-[#e42200]">*</span>
              </label>
              <Select
                value={form.tipo_instalador}
                onChange={(v) => setField("tipo_instalador", v)}
                size="sm"
                error={errors.tipo_instalador || undefined}
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
                type="text"
                inputMode="decimal"
                pattern="^[0-9]*\.?[0-9]{0,2}$"
                min="0"
                placeholder="0.00"
                value={form.costo_instalacion}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (isValidMoneyInput(raw)) setField("costo_instalacion", raw);
                }}
                className={`${FIELD} ${getFieldClass("costo_instalacion")} pl-7`}
              />
            </div>
            {errors.costo_instalacion && <p className={ERROR_MSG}>{errors.costo_instalacion}</p>}
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
              <label className={LABEL}>
                Teléfono <span className="text-[#e42200]">*</span>
              </label>
              <PhoneInputMX
                value={form.telefono}
                onChange={(e164) => setField("telefono", e164)}
                hasError={!!errors.telefono}
              />
              {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
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
            {errors.ubicacion && <p className={ERROR_MSG}>{errors.ubicacion}</p>}
          </div>

          <div>
            <label className={LABEL}>Notas</label>
            <textarea
              rows={3}
              placeholder="Notas adicionales del instalador..."
              value={form.notas}
              onChange={(e) => setField("notas", e.target.value)}
              className={`${FIELD} ${getFieldClass("notas")} resize-none`}
            />
            {errors.notas && <p className={ERROR_MSG}>{errors.notas}</p>}
          </div>

          {colorPicker}
        </>
      )}

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
