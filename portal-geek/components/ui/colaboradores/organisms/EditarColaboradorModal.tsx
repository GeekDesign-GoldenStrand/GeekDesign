"use client";

import { useState } from "react";

import type { ColaboradorApiRow } from "./RegistrarColaboradorForm";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}
interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface EditarColaboradorModalProps {
  isOpen: boolean;
  apiRow: ColaboradorApiRow | null;
  loadingData: boolean;
  fetchError: string | null;
  editLoading: boolean;
  editError: string | null;
  roles: Rol[];
  sucursales: Sucursal[];
  onClose: () => void;
  onSubmit: (payload: {
    nombre_completo: string;
    correo_electronico: string;
    edad: number;
    sexo: string;
    telefono: string;
    id_rol: number;
    id_sucursal: number;
  }) => void;
}

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const SELECT_FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] bg-white transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ\s'\-]+$/;

interface FormState {
  nombre_completo: string;
  correo_electronico: string;
  edad: string;
  sexo: string;
  telefono: string;
  id_rol: string;
  id_sucursal: string;
}

function fromApiRow(apiRow: ColaboradorApiRow): FormState {
  return {
    nombre_completo: apiRow.nombre_completo,
    correo_electronico: apiRow.correo_electronico,
    edad: String(apiRow.colaborador?.edad ?? ""),
    sexo: apiRow.colaborador?.sexo ?? "",
    telefono: apiRow.colaborador?.telefono ?? "",
    id_rol: String(apiRow.id_rol),
    id_sucursal: String(apiRow.colaborador?.sucursal?.id_sucursal ?? ""),
  };
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.nombre_completo.trim()) errors.nombre_completo = "El nombre es requerido.";
  else if (!NOMBRE_REGEX.test(form.nombre_completo))
    errors.nombre_completo = "Solo letras, espacios, guiones y apóstrofes.";
  if (!form.correo_electronico.trim()) errors.correo_electronico = "El correo es requerido.";
  else if (!EMAIL_REGEX.test(form.correo_electronico))
    errors.correo_electronico = "Correo electrónico inválido.";
  const edad = Number(form.edad);
  if (!form.edad) errors.edad = "La edad es requerida.";
  else if (isNaN(edad) || edad < 15 || edad > 100)
    errors.edad = "La edad debe ser entre 15 y 100 años.";
  if (!form.sexo) errors.sexo = "El sexo es requerido.";
  if (!form.telefono.trim()) errors.telefono = "El teléfono es requerido.";
  if (!form.id_rol) errors.id_rol = "Selecciona un rol.";
  if (!form.id_sucursal) errors.id_sucursal = "Selecciona una sucursal.";
  return errors;
}

// Sub-component receives guaranteed non-null apiRow and initialises state directly.
function EditForm({
  apiRow,
  editLoading,
  editError,
  roles,
  sucursales,
  onClose,
  onSubmit,
}: {
  apiRow: ColaboradorApiRow;
  editLoading: boolean;
  editError: string | null;
  roles: Rol[];
  sucursales: Sucursal[];
  onClose: () => void;
  onSubmit: EditarColaboradorModalProps["onSubmit"];
}) {
  const [form, setForm] = useState<FormState>(() => fromApiRow(apiRow));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getFieldClass(key: keyof FormState) {
    if (errors[key]) return FIELD_ERROR;
    if (touched[key] && form[key].trim()) return FIELD_SUCCESS;
    return "";
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));
      return;
    }
    onSubmit({
      nombre_completo: form.nombre_completo.trim(),
      correo_electronico: form.correo_electronico.trim(),
      edad: Number(form.edad),
      sexo: form.sexo,
      telefono: form.telefono.trim(),
      id_rol: Number(form.id_rol),
      id_sucursal: Number(form.id_sucursal),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {editError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {editError}
        </div>
      )}

      <div>
        <label className={LABEL}>
          Nombre <span className="text-[#e42200]">*</span>
        </label>
        <input
          type="text"
          maxLength={100}
          placeholder="Nombre completo"
          value={form.nombre_completo}
          onChange={(e) =>
            setField("nombre_completo", e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, ""))
          }
          className={`${FIELD} ${getFieldClass("nombre_completo")}`}
        />
        {errors.nombre_completo && <p className={ERROR_MSG}>{errors.nombre_completo}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Correo <span className="text-[#e42200]">*</span>
          </label>
          <input
            type="email"
            maxLength={150}
            placeholder="correo@ejemplo.com"
            value={form.correo_electronico}
            onChange={(e) => setField("correo_electronico", e.target.value)}
            className={`${FIELD} ${getFieldClass("correo_electronico")}`}
          />
          {errors.correo_electronico && <p className={ERROR_MSG}>{errors.correo_electronico}</p>}
        </div>
        <div>
          <label className={LABEL}>
            Teléfono <span className="text-[#e42200]">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="XXX XXXX XXX"
            value={form.telefono}
            onChange={(e) => setField("telefono", e.target.value.replace(/\D/g, ""))}
            className={`${FIELD} ${getFieldClass("telefono")}`}
          />
          {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Edad <span className="text-[#e42200]">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="Edad"
            value={form.edad}
            onChange={(e) => setField("edad", e.target.value.replace(/\D/g, ""))}
            className={`${FIELD} ${getFieldClass("edad")}`}
          />
          {errors.edad && <p className={ERROR_MSG}>{errors.edad}</p>}
        </div>
        <div>
          <label className={LABEL}>
            Sexo <span className="text-[#e42200]">*</span>
          </label>
          <select
            value={form.sexo}
            onChange={(e) => setField("sexo", e.target.value)}
            className={`${SELECT_FIELD} ${errors.sexo ? FIELD_ERROR : touched.sexo && form.sexo ? FIELD_SUCCESS : ""}`}
          >
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="NA">Prefiero no decir</option>
          </select>
          {errors.sexo && <p className={ERROR_MSG}>{errors.sexo}</p>}
        </div>
      </div>

      <div>
        <label className={LABEL}>
          Rol <span className="text-[#e42200]">*</span>
        </label>
        <select
          value={form.id_rol}
          onChange={(e) => setField("id_rol", e.target.value)}
          className={`${SELECT_FIELD} ${errors.id_rol ? FIELD_ERROR : touched.id_rol && form.id_rol ? FIELD_SUCCESS : ""}`}
        >
          <option value="">Seleccionar rol</option>
          {roles.map((r) => (
            <option key={r.id_rol} value={r.id_rol}>
              {r.nombre_rol}
            </option>
          ))}
        </select>
        {errors.id_rol && <p className={ERROR_MSG}>{errors.id_rol}</p>}
      </div>

      <div>
        <label className={LABEL}>
          Sucursal <span className="text-[#e42200]">*</span>
        </label>
        <select
          value={form.id_sucursal}
          onChange={(e) => setField("id_sucursal", e.target.value)}
          className={`${SELECT_FIELD} ${errors.id_sucursal ? FIELD_ERROR : touched.id_sucursal && form.id_sucursal ? FIELD_SUCCESS : ""}`}
        >
          <option value="">Seleccionar sucursal</option>
          {sucursales.map((s) => (
            <option key={s.id_sucursal} value={s.id_sucursal}>
              {s.nombre_sucursal}
            </option>
          ))}
        </select>
        {errors.id_sucursal && <p className={ERROR_MSG}>{errors.id_sucursal}</p>}
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
          disabled={editLoading}
          className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
        >
          {editLoading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export function EditarColaboradorModal({
  isOpen,
  apiRow,
  loadingData,
  fetchError,
  editLoading,
  editError,
  roles,
  sucursales,
  onClose,
  onSubmit,
}: EditarColaboradorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Editar Colaborador</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8e908f] hover:text-[#e42200] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loadingData && (
            <p className="py-10 text-center text-[14px] text-[#8e908f]">Cargando datos...</p>
          )}
          {fetchError && !loadingData && (
            <p className="py-10 text-center text-[14px] text-[#e42200]">{fetchError}</p>
          )}
          {!loadingData && !fetchError && apiRow && (
            <EditForm
              key={apiRow.id_usuario}
              apiRow={apiRow}
              editLoading={editLoading}
              editError={editError}
              roles={roles}
              sucursales={sucursales}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
