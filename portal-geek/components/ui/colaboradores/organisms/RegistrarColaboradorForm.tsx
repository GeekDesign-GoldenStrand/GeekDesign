"use client";

import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { CreateColaboradorSchema } from "@/lib/schemas/colaboradores";

export interface ColaboradorApiRow {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string;
  id_rol: number;
  estatus: string;
  rol: { id_rol: number; nombre_rol: string };
  colaborador: {
    id_colaborador: number;
    edad: number;
    sexo: string;
    telefono: string;
    estatus_colaborador: string;
    fecha_modificacion: string;
    sucursal: { id_sucursal: number; nombre_sucursal: string } | null;
  } | null;
}

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface RegistrarColaboradorFormProps {
  roles: Rol[];
  sucursales: Sucursal[];
  onCreated: (row: ColaboradorApiRow) => void;
  onClose: () => void;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

const TODAY = new Date().toISOString().split("T")[0];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseFechaNacimiento(value: string): string | null {
  const trimmed = value.replace(/\s/g, "").trim();
  if (!trimmed) return null;

  const slashOrDashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  let day: number;
  let month: number;
  let year: number;

  if (slashOrDashMatch) {
    day = Number(slashOrDashMatch[1]);
    month = Number(slashOrDashMatch[2]);
    year = Number(slashOrDashMatch[3]);
  } else if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);

  const isValidDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isValidDate) return null;

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatFechaNacimiento(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const [year, month, day] = fechaNacimiento.split("-").map(Number);
  const hoy = new Date();
  const nac = new Date(year, month - 1, day);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function RegistrarColaboradorForm({
  roles,
  sucursales,
  onCreated,
  onClose,
}: RegistrarColaboradorFormProps) {
  const [form, setForm] = useState({
    nombre_completo: "",
    correo_electronico: "",
    fecha_nacimiento: "",
    sexo: "",
    telefono: "",
    id_rol: "",
    id_sucursal: "",
  });

  const [fechaNacimientoText, setFechaNacimientoText] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const fechaNacimientoIso = parseFechaNacimiento(fechaNacimientoText);
  const edad = fechaNacimientoIso ? calcularEdad(fechaNacimientoIso) : null;

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function setFechaNacimiento(value: string) {
    const normalized = normalizeFechaNacimientoInput(value);

    setFechaNacimientoText(normalized);
    setTouched((prev) => ({ ...prev, fecha_nacimiento: true }));
    setErrors((prev) => ({ ...prev, fecha_nacimiento: "" }));

    const parsed = parseFechaNacimiento(normalized);
    setForm((prev) => ({ ...prev, fecha_nacimiento: parsed ?? "" }));
  }

  function getFieldClass(key: keyof typeof form) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key] && form[key].trim()) return FIELD_SUCCESS;
    return "";
  }

  function normalizeFechaNacimientoInput(value: string): string {
    return value
      .replace(/\s/g, "")
      .replace(/[^\d/-]/g, "")
      .slice(0, 10);
  }

  function validate() {
    const fechaNacimientoIso = parseFechaNacimiento(fechaNacimientoText);
    const edadCalculada = fechaNacimientoIso ? calcularEdad(fechaNacimientoIso) : null;
    const fechaErrors: Record<string, string> = {};

    if (!fechaNacimientoText.trim()) {
      fechaErrors.fecha_nacimiento = "La fecha de nacimiento es requerida";
    } else if (!fechaNacimientoIso) {
      fechaErrors.fecha_nacimiento = "Usa el formato dd/mm/aaaa. Ejemplo: 02/06/1999";
    } else if (fechaNacimientoIso > TODAY) {
      fechaErrors.fecha_nacimiento = "La fecha de nacimiento no puede ser futura";
    } else if (!edadCalculada || edadCalculada < 16 || edadCalculada > 100) {
      fechaErrors.fecha_nacimiento = "La edad debe ser entre 16 y 100 años";
    }

    const payload = {
      nombre_completo: form.nombre_completo.trim(),
      correo_electronico: form.correo_electronico.trim(),
      contrasena_hash: crypto.randomUUID(),
      id_rol: Number(form.id_rol),
      id_sucursal: Number(form.id_sucursal),
      edad: edadCalculada ?? 0,
      sexo: form.sexo as "M" | "F" | "NA",
      telefono: form.telefono.trim(),
      estatus: "Activo" as const,
      estatus_colaborador: "Activo" as const,
    };

    const result = CreateColaboradorSchema.safeParse(payload);

    if (result.success && Object.keys(fechaErrors).length === 0) {
      setErrors({});
      return payload;
    }

    const MENSAJES: Record<string, string> = {
      nombre_completo: "El nombre es requerido.",
      correo_electronico: "Correo electrónico inválido.",
      id_rol: "Selecciona un rol.",
      id_sucursal: "Selecciona una sucursal.",
      edad: "La edad debe ser entre 16 y 100 años.",
      sexo: "El sexo es requerido.",
      telefono: "El teléfono es requerido.",
    };

    const nextErrors: Record<string, string> = { ...fechaErrors };
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!nextErrors[field]) nextErrors[field] = MENSAJES[field] ?? issue.message;
      }
    }
    setErrors(nextErrors);
    return null;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const payload = validate();
    if (!payload) return;

    setLoading(true);
    try {
      const res = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError((json as { error?: string })?.error ?? `Error ${res.status}`);
        return;
      }
      onCreated((json as { data: ColaboradorApiRow }).data);
      onClose();
    } catch {
      setServerError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {serverError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {serverError}
        </div>
      )}

      <div className="flex gap-6">
        {/* Columna izquierda */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <label className={LABEL}>Nombre *</label>
            <input
              type="text"
              maxLength={100}
              placeholder="Nombre completo"
              value={form.nombre_completo}
              onChange={(e) => setField("nombre_completo", e.target.value)}
              className={`${FIELD} ${getFieldClass("nombre_completo")}`}
            />
            {errors.nombre_completo && <p className={ERROR_MSG}>{errors.nombre_completo}</p>}
          </div>

          <div>
            <label className={LABEL}>Correo electrónico *</label>
            <input
              type="email"
              maxLength={150}
              placeholder="correo@gmail.com"
              value={form.correo_electronico}
              onChange={(e) => setField("correo_electronico", e.target.value)}
              className={`${FIELD} ${getFieldClass("correo_electronico")}`}
            />
            {errors.correo_electronico && <p className={ERROR_MSG}>{errors.correo_electronico}</p>}
          </div>

          <div>
            <label htmlFor="fecha_nacimiento" className={LABEL}>
              Fecha de nacimiento *
            </label>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              pattern="\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}"
              value={fechaNacimientoText}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              onBlur={() => {
                const parsed = parseFechaNacimiento(fechaNacimientoText);
                if (parsed) {
                  setFechaNacimientoText(formatFechaNacimiento(parsed));
                }
              }}
              aria-invalid={Boolean(errors.fecha_nacimiento)}
              aria-describedby={
                errors.fecha_nacimiento ? "fecha_nacimiento-error" : "fecha_nacimiento-help"
              }
              className={`${FIELD} ${
                errors.fecha_nacimiento
                  ? FIELD_ERROR
                  : touched.fecha_nacimiento && form.fecha_nacimiento
                    ? FIELD_SUCCESS
                    : ""
              }`}
            />

            <p id="fecha_nacimiento-help" className="text-[12px] text-[#8e908f] mt-1">
              Formato: dd/mm/aaaa. Ejemplo: 02/06/1999. No uses espacios.
            </p>

            {errors.fecha_nacimiento && (
              <p id="fecha_nacimiento-error" role="alert" className={ERROR_MSG}>
                {errors.fecha_nacimiento}
              </p>
            )}

            {edad !== null && !errors.fecha_nacimiento && (
              <p className="text-[13px] text-[#575757] mt-1">Edad: {edad}</p>
            )}
          </div>

          <div>
            <label className={LABEL}>Sexo *</label>
            <Select
              value={form.sexo}
              onChange={(v) => setField("sexo", v)}
              placeholder="Sexo"
              size="sm"
              error={errors.sexo || undefined}
            >
              <SelectOption value="M">Masculino</SelectOption>
              <SelectOption value="F">Femenino</SelectOption>
              <SelectOption value="NA">Prefiero no decir</SelectOption>
            </Select>
          </div>

          <div>
            <label className={LABEL}>Teléfono *</label>
            <div className="flex items-center gap-2">
              <span className="flex items-center h-[38px] px-3 border border-[#b9b8b8] rounded-[6px] text-[14px] text-[#575757] bg-[#f5f5f5] shrink-0 select-none">
                +52
              </span>
              <input
                type="tel"
                maxLength={20}
                placeholder="XXX XXXX XXX"
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                className={`${FIELD} ${getFieldClass("telefono")}`}
              />
            </div>
            {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <label className={LABEL}>Rol *</label>
            <Select
              value={form.id_rol}
              onChange={(v) => setField("id_rol", v)}
              placeholder="Seleccionar rol"
              size="sm"
              error={errors.id_rol || undefined}
            >
              {roles.map((r) => (
                <SelectOption key={r.id_rol} value={String(r.id_rol)}>
                  {r.nombre_rol}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div>
            <label className={LABEL}>Sucursal *</label>
            <Select
              value={form.id_sucursal}
              onChange={(v) => setField("id_sucursal", v)}
              placeholder="Seleccionar sucursal"
              size="sm"
              error={errors.id_sucursal || undefined}
            >
              {sucursales.map((s) => (
                <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
                  {s.nombre_sucursal}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-[#e8e8e8]">
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
