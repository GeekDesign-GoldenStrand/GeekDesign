"use client";

import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { isValidPhoneNumber, PhoneInputMX } from "@/components/ui/atoms/PhoneInputMX";
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const edad = calcularEdad(form.fecha_nacimiento);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getFieldClass(key: keyof typeof form) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key] && form[key].trim()) return FIELD_SUCCESS;
    return "";
  }

  function validate() {
    const edadCalculada = calcularEdad(form.fecha_nacimiento);
    const fechaErrors: Record<string, string> = {};

    if (!form.fecha_nacimiento) {
      fechaErrors.fecha_nacimiento = "La fecha de nacimiento es requerida";
    } else if (!edadCalculada || edadCalculada < 16 || edadCalculada > 100) {
      fechaErrors.fecha_nacimiento = "La edad debe ser entre 16 y 100 años";
    }

    if (form.telefono && !isValidPhoneNumber(form.telefono)) {
      fechaErrors.telefono = "Número de teléfono inválido.";
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

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Nombre <span className="text-[#e42200]">*</span>
            </label>
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
            <label className={LABEL}>
              Rol <span className="text-[#e42200]">*</span>
            </label>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Correo electrónico <span className="text-[#e42200]">*</span>
            </label>
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
            <label className={LABEL}>
              Sucursal <span className="text-[#e42200]">*</span>
            </label>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Fecha de nacimiento <span className="text-[#e42200]">*</span>
            </label>
            <input
              type="date"
              max={TODAY}
              value={form.fecha_nacimiento}
              onChange={(e) => setField("fecha_nacimiento", e.target.value)}
              className={`${FIELD} ${
                errors.fecha_nacimiento
                  ? FIELD_ERROR
                  : touched.fecha_nacimiento && form.fecha_nacimiento
                    ? FIELD_SUCCESS
                    : ""
              }`}
            />
            {errors.fecha_nacimiento && <p className={ERROR_MSG}>{errors.fecha_nacimiento}</p>}
            {edad !== null && !errors.fecha_nacimiento && (
              <p className="text-[13px] text-[#575757] mt-1">Edad: {edad}</p>
            )}
          </div>

          <div>
            <label className={LABEL}>
              Sexo <span className="text-[#e42200]">*</span>
            </label>
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
