"use client";

import { useState } from "react";
import { z } from "zod";

import type { CreateInstaladorInput } from "@/lib/schemas/instaladores";
import type { CreateProveedorInput } from "@/lib/schemas/proveedores";
import type { TerceroCardProps, TerceroStatus } from "@/types";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;
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
    .refine((v) => !v || /^\d{10}$/.test(v), "Debe tener exactamente 10 dígitos."),
  ubicacion: z
    .string()
    .refine((v) => !v || /^[^,]+,[^,]+$/.test(v.trim()), "Formato requerido: Municipio, Estado"),
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
    .refine((v) => !v || /^\d{10}$/.test(v), "Debe tener exactamente 10 dígitos."),
  notas: z.string().max(500, "Máximo 500 caracteres."),
  ubicacion: z
    .string()
    .refine((v) => !v || /^[^,]+,[^,]+$/.test(v.trim()), "Formato requerido: Municipio, Estado"),
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
    tipo_proveedor: "Proveedor de material" as CreateProveedorInput["tipo"],
    tipo_instalador: "Instalador" as CreateInstaladorInput["tipo"],
    telefono: "",
    correo: "",
    ubicacion: "",
    notas: "",
    descripcion_proveedor: "",
    estatus: "Activo",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function setField(key: string, value: string | number) {
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
        return val && /^\d{10}$/.test(val) ? FIELD_SUCCESS : "";
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
        const body = {
          nombre_proveedor: form.nombre_proveedor,
          apodo: form.apodo || undefined,
          tipo: form.tipo_proveedor,
          telefono: form.telefono || undefined,
          correo: form.correo || undefined,
          descripcion_proveedor: form.descripcion_proveedor || undefined,
          ubicacion: form.ubicacion || undefined,
          estatus: form.estatus,
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
        });
      } else {
        const body = {
          nombre_instalador: form.nombre_proveedor,
          apodo: form.apodo || undefined,
          tipo: form.tipo_instalador,
          telefono: form.telefono || undefined,
          correo: form.correo || undefined,
          notas: form.notas || undefined,
          ubicacion: form.ubicacion || undefined,
          estatus: form.estatus,
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
        });
      }

      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

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
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <div>
              <label className={LABEL}>
                Tipo <span className="text-[#e42200]">*</span>
              </label>
              <select
                value={form.tipo_proveedor}
                onChange={(e) => setField("tipo_proveedor", e.target.value)}
                className={`${FIELD} ${getFieldClass("tipo_proveedor")}`}
              >
                <option value="Proveedor de material">Proveedor de material</option>
                <option value="Proveedor de servicio">Proveedor de servicio</option>
              </select>
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
              <label className={LABEL}>Teléfono</label>
              <input
                type="tel"
                placeholder="442 123 4567"
                inputMode="numeric"
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
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <div>
              <label className={LABEL}>
                Tipo <span className="text-[#e42200]">*</span>
              </label>
              <select
                value={form.tipo_instalador}
                onChange={(e) => setField("tipo_instalador", e.target.value)}
                className={`${FIELD} ${getFieldClass("tipo_instalador")}`}
              >
                <option value="Instalador">Instalador</option>
                <option value="Contratista">Contratista</option>
              </select>
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
              <label className={LABEL}>Teléfono</label>
              <input
                type="tel"
                placeholder="442 123 4567"
                inputMode="numeric"
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
        </>
      )}

      <div className="flex justify-end gap-3 mt-4">
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
