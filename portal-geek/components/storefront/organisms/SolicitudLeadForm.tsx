"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { noEmoji, textOnly } from "@/lib/schemas/text-validation";
import { EMAIL_ERROR_MESSAGE, isValidEmail } from "@/lib/utils/email";

export type LeadTipo = "idea_nula" | "idea_vaga" | "personalizada";

// A tipo-specific field. The set of fields is what differentiates the three
// solicitud forms (ST-10/11/12) — they escalate in specificity. On submit the
// filled fields are composed into a single labeled descripcion_solicitud
// (Option A stores one TEXT column), using `resumen` as the key.
export interface LeadField {
  name: string;
  kind: "text" | "textarea" | "select" | "number";
  label: string;
  /** Short key used in the composed descripcion (defaults to label). */
  resumen?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // select
  min?: number; // number
  max?: number; // number
  maxLength?: number; // text / textarea
}

interface Props {
  /** Discriminator persisted as Cotizaciones.tipo_solicitud. */
  tipo: LeadTipo;
  /** Page heading, e.g. "No sé lo que quiero". */
  titulo: string;
  /** Short copy under the heading explaining what happens next. */
  intro: string;
  /** Tipo-specific fields composed into descripcion_solicitud. */
  fields: LeadField[];
  /** Optional catalog service this personalización started from (ST-12). */
  idServicio?: number;
}

const PHONE_MAX_DIGITS = 15;
const DESCRIPCION_MAX = 2000;
const PRESUPUESTO_MAX = 99999999.99;

const getMinDate = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const getMaxDate = () => {
  const t = new Date();
  return `${t.getFullYear() + 2}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

// Lead endpoint validates with Zod and returns the raw issue. Strip the field
// path and fall back to a friendly message so Zod/English copy never leaks.
function translateServerError(raw?: string): string {
  const fallback = "No se pudo enviar tu solicitud. Revisa los datos e inténtalo de nuevo.";
  if (!raw) return fallback;
  const message = raw.replace(/^[a-zA-Z0-9_.]+:\s*/, "");
  if (/expected|invalid|required|string|number|too (big|small)/i.test(message)) return fallback;
  return message || fallback;
}

function validateField(field: LeadField, value: string): string | null {
  const v = value.trim();
  if (field.required && v.length === 0) return "Este campo es requerido";
  if (v.length === 0) return null;
  if (field.kind === "text" || field.kind === "textarea") {
    if (!noEmoji(v)) return "No se permiten emojis";
    if (!textOnly(v)) return "Solo letras, números y signos comunes";
  }
  if (field.kind === "number") {
    const n = Number(v);
    if (!Number.isFinite(n)) return "Ingresa un número válido";
    if (field.min != null && n < field.min) return `El valor mínimo es ${field.min}`;
    if (field.max != null && n > field.max) return `El valor máximo es ${field.max}`;
  }
  return null;
}

// Returns the parsed budget (or undefined) and an error message (or null).
function parsePresupuesto(value: string): { value: number | undefined; error: string | null } {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { value: undefined, error: null };
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return { value: undefined, error: "Ingresa un monto válido" };
  if (num < 0) return { value: undefined, error: "El presupuesto no puede ser negativo" };
  if (num > PRESUPUESTO_MAX) return { value: undefined, error: "El presupuesto es demasiado alto" };
  return { value: num, error: null };
}

/**
 * ST-10/11/12 — shared guided-solicitud form, driven by a per-tipo `fields`
 * config so each story (idea nula / idea vaga / personalización) asks for an
 * escalating level of detail. Field-level validation mirrors CheckoutForm; the
 * filled fields are composed into descripcion_solicitud. On success it shows an
 * inline confirmation with the folio (no email is sent for leads — there is
 * nothing to approve yet; Dirección follows up).
 */
export function SolicitudLeadForm({ tipo, titulo, intro, fields, idServicio }: Props) {
  const [nombre, setNombre] = useState("");
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState("");
  const [correo, setCorreo] = useState("");
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [telefono, setTelefono] = useState<string | undefined>(undefined);
  const [telefonoError, setTelefonoError] = useState<string | null>(null);

  // Dynamic tipo-specific fields.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""]))
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const [presupuesto, setPresupuesto] = useState("");
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);
  const [fechaRequerida, setFechaRequerida] = useState("");
  const [fechaError, setFechaError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);

  // Flips synchronously to close the double-submit race (see CheckoutForm).
  const submittingRef = useRef(false);

  function setFieldValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handlePhoneChange(next: string | undefined) {
    if (!next) {
      setTelefono(undefined);
      if (telefonoError) setTelefonoError(null);
      return;
    }
    if (next.replace(/\D/g, "").length > PHONE_MAX_DIGITS) return;
    setTelefono(next);
    if (telefonoError) setTelefonoError(null);
  }

  function isFechaValida(fecha: string) {
    if (!fecha) return true; // optional
    return fecha >= getMinDate() && fecha <= getMaxDate();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    const nombreInvalid = nombre.trim().length === 0 ? "El nombre es requerido" : null;
    const correoInvalid = !isValidEmail(correo) ? EMAIL_ERROR_MESSAGE : null;
    const telefonoInvalid =
      !telefono || !isValidPhoneNumber(telefono)
        ? "Ingresa un número de teléfono válido para el país seleccionado"
        : null;

    const nextFieldErrors: Record<string, string | null> = {};
    for (const f of fields) nextFieldErrors[f.name] = validateField(f, values[f.name] ?? "");

    const { value: presupuestoValue, error: presupuestoInvalid } = parsePresupuesto(presupuesto);
    const fechaInvalid = !isFechaValida(fechaRequerida) ? "Selecciona una fecha válida" : null;

    setNombreError(nombreInvalid);
    setCorreoError(correoInvalid);
    setTelefonoError(telefonoInvalid);
    setFieldErrors(nextFieldErrors);
    setPresupuestoError(presupuestoInvalid);
    setFechaError(fechaInvalid);

    const anyFieldError = Object.values(nextFieldErrors).some(Boolean);
    if (
      nombreInvalid ||
      correoInvalid ||
      telefonoInvalid ||
      anyFieldError ||
      presupuestoInvalid ||
      fechaInvalid
    ) {
      return;
    }

    // Compose the filled fields into a single labeled descripcion (Option A).
    const descripcion = fields
      .map((f) => ({ f, v: (values[f.name] ?? "").trim() }))
      .filter((x) => x.v.length > 0)
      .map((x) => `${x.f.resumen ?? x.f.label}: ${x.v}`)
      .join("\n");

    if (descripcion.length === 0) {
      setError("Cuéntanos qué necesitas antes de enviar.");
      return;
    }
    if (descripcion.length > DESCRIPCION_MAX) {
      setError(`Tu solicitud es muy larga (máximo ${DESCRIPCION_MAX} caracteres). Acórtala.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        tipo_solicitud: tipo,
        cliente: {
          nombre_cliente: nombre.trim(),
          empresa: empresa.trim() || undefined,
          correo_electronico: correo.trim(),
          numero_telefono: telefono,
        },
        descripcion_solicitud: descripcion,
        presupuesto_aprox: presupuestoValue,
        fecha_requerida: fechaRequerida || undefined,
        id_servicio: idServicio,
      };

      const res = await fetch("/api/storefront/cotizaciones/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(translateServerError(json.error));
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      setFolio(json.data.folio as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (folio) {
    return (
      <section className="bg-[#fff8f9] min-h-[calc(100vh-106px)] flex items-center justify-center px-4 py-16">
        <div className="bg-white w-full max-w-[640px] rounded-[10px] border border-[#c2c0c0] px-6 md:px-12 py-12 text-center flex flex-col items-center gap-6">
          <h1 className="font-bold text-[28px] md:text-[36px] text-[#1e1e1e]">
            ¡Solicitud recibida!
          </h1>
          <p className="text-[15px] md:text-[17px] text-[#1e1e1e]">
            El equipo de Dirección revisará tu solicitud y te contactará por correo o teléfono para
            preparar tu cotización.
          </p>
          <div className="bg-[#fff8f9] border border-[#e6d2d4] rounded-[10px] px-6 py-4 inline-flex flex-col items-center gap-1">
            <p className="text-[12px] uppercase tracking-[1px] text-[#666]">Folio de referencia</p>
            <p className="font-bold text-[24px] text-[#8b434a]">{folio}</p>
          </div>
          <Button asChild variant="primary" section="storefront" size="lg">
            <Link href="/tienda">Volver a la tienda</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#fff8f9] min-h-[calc(100vh-106px)] px-4 py-12 md:py-16">
      <div className="max-w-[640px] mx-auto">
        <h1 className="font-bold text-[28px] md:text-[36px] text-[#1e1e1e] mb-2">{titulo}</h1>
        <p className="text-[15px] md:text-[17px] text-[#575757] mb-8">{intro}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="bg-white rounded-[10px] border border-[#c2c0c0] p-6 flex flex-col gap-4">
            <h2 className="font-bold text-[20px] text-[#1e1e1e]">Tus datos</h2>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="nombre" className="text-[14px] font-semibold text-[#1e1e1e]">
                Nombre completo <span className="text-[#c14a4a]">*</span>
              </label>
              <input
                id="nombre"
                required
                maxLength={100}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (nombreError) setNombreError(null);
                }}
                onBlur={() =>
                  setNombreError(nombre.trim().length === 0 ? "El nombre es requerido" : null)
                }
                aria-invalid={nombreError !== null}
                aria-describedby={nombreError ? "nombre-error" : undefined}
                className={`h-[44px] rounded-[8px] border bg-white px-[12px] text-[14px] text-[#1e1e1e] ${
                  nombreError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
                }`}
              />
              {nombreError && (
                <p id="nombre-error" className="text-[12px] font-medium text-[#c14a4a]">
                  {nombreError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="empresa" className="text-[14px] font-semibold text-[#1e1e1e]">
                Empresa (opcional)
              </label>
              <input
                id="empresa"
                maxLength={100}
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e]"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="correo" className="text-[14px] font-semibold text-[#1e1e1e]">
                Correo electrónico <span className="text-[#c14a4a]">*</span>
              </label>
              <input
                id="correo"
                type="email"
                required
                maxLength={150}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (correoError) setCorreoError(null);
                }}
                onBlur={() => {
                  if (correo.trim().length === 0) {
                    setCorreoError(null);
                    return;
                  }
                  setCorreoError(isValidEmail(correo) ? null : EMAIL_ERROR_MESSAGE);
                }}
                aria-invalid={correoError !== null}
                aria-describedby={correoError ? "correo-error" : undefined}
                className={`h-[44px] rounded-[8px] border bg-white px-[12px] text-[14px] text-[#1e1e1e] ${
                  correoError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
                }`}
              />
              {correoError && (
                <p id="correo-error" className="text-[12px] font-medium text-[#c14a4a]">
                  {correoError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="telefono" className="text-[14px] font-semibold text-[#1e1e1e]">
                Teléfono <span className="text-[#c14a4a]">*</span>
              </label>
              <PhoneInput
                id="telefono"
                international
                countryCallingCodeEditable={false}
                defaultCountry="MX"
                flags={flags}
                value={telefono}
                numberInputProps={{
                  maxLength: 16,
                  inputMode: "tel",
                  "aria-invalid": telefonoError !== null,
                  "aria-describedby": telefonoError ? "telefono-error" : undefined,
                  onBlur: () => {
                    if (!telefono) setTelefonoError("Ingresa tu número de teléfono");
                    else if (!isValidPhoneNumber(telefono))
                      setTelefonoError("Número de teléfono inválido para el país seleccionado");
                    else setTelefonoError(null);
                  },
                }}
                onChange={handlePhoneChange}
                className={`flex items-center gap-2 h-[44px] rounded-[8px] border bg-white px-[12px] text-[14px] text-[#1e1e1e] [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:[font:inherit] [&_.PhoneInputInput]:[color:inherit] [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:h-full [&_.PhoneInputCountry]:mr-0 ${
                  telefonoError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
                }`}
              />
              {telefonoError && (
                <p id="telefono-error" className="text-[12px] font-medium text-[#c14a4a]">
                  {telefonoError}
                </p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[10px] border border-[#c2c0c0] p-6 flex flex-col gap-4">
            <h2 className="font-bold text-[20px] text-[#1e1e1e]">Tu solicitud</h2>

            {fields.map((field) => {
              const id = `field-${field.name}`;
              const err = fieldErrors[field.name] ?? null;
              const value = values[field.name] ?? "";
              const borderCls = err ? "border-[#c14a4a]" : "border-[#c2c0c0]";

              return (
                <div key={field.name} className="flex flex-col gap-[6px]">
                  <div className="flex justify-between items-center">
                    <label htmlFor={id} className="text-[14px] font-semibold text-[#1e1e1e]">
                      {field.label}{" "}
                      {field.required ? (
                        <span className="text-[#c14a4a]">*</span>
                      ) : (
                        <span className="font-normal text-[#888]">(opcional)</span>
                      )}
                    </label>
                    {field.kind === "textarea" && field.maxLength && (
                      <span className="text-[12px] text-[#666]">
                        {value.length}/{field.maxLength}
                      </span>
                    )}
                  </div>

                  {field.kind === "select" ? (
                    <Select
                      id={id}
                      placeholder={field.placeholder ?? "Selecciona una opción"}
                      value={value}
                      onChange={(v) => setFieldValue(field.name, v)}
                      error={err || undefined}
                    >
                      {(field.options ?? []).map((opt) => (
                        <SelectOption key={opt} value={opt}>
                          {opt}
                        </SelectOption>
                      ))}
                    </Select>
                  ) : field.kind === "textarea" ? (
                    <textarea
                      id={id}
                      rows={4}
                      required={field.required}
                      maxLength={field.maxLength ?? 1000}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => setFieldValue(field.name, e.target.value)}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          [field.name]: validateField(field, value),
                        }))
                      }
                      aria-invalid={err !== null}
                      className={`rounded-[8px] border bg-white px-[12px] py-[8px] text-[14px] text-[#1e1e1e] ${borderCls}`}
                    />
                  ) : (
                    <input
                      id={id}
                      type={field.kind === "number" ? "number" : "text"}
                      required={field.required}
                      maxLength={field.kind === "text" ? (field.maxLength ?? 200) : undefined}
                      min={field.kind === "number" ? field.min : undefined}
                      max={field.kind === "number" ? field.max : undefined}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => setFieldValue(field.name, e.target.value)}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          [field.name]: validateField(field, value),
                        }))
                      }
                      aria-invalid={err !== null}
                      className={`h-[44px] rounded-[8px] border bg-white px-[12px] text-[14px] text-[#1e1e1e] ${borderCls}`}
                    />
                  )}

                  {err && <p className="text-[12px] font-medium text-[#c14a4a]">{err}</p>}
                </div>
              );
            })}

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="presupuesto" className="text-[14px] font-semibold text-[#1e1e1e]">
                Presupuesto aproximado (opcional)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-[#666]">
                  $
                </span>
                <input
                  id="presupuesto"
                  type="number"
                  min={0}
                  max={PRESUPUESTO_MAX}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={presupuesto}
                  onChange={(e) => {
                    setPresupuesto(e.target.value);
                    if (presupuestoError) setPresupuestoError(null);
                  }}
                  onBlur={() => setPresupuestoError(parsePresupuesto(presupuesto).error)}
                  aria-invalid={presupuestoError !== null}
                  aria-describedby={presupuestoError ? "presupuesto-error" : undefined}
                  className={`h-[44px] w-full rounded-[8px] border bg-white pl-[26px] pr-[12px] text-[14px] text-[#1e1e1e] ${
                    presupuestoError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
                  }`}
                />
              </div>
              {presupuestoError && (
                <p id="presupuesto-error" className="text-[12px] font-medium text-[#c14a4a]">
                  {presupuestoError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="fechaRequerida" className="text-[14px] font-semibold text-[#1e1e1e]">
                Fecha deseada (opcional)
              </label>
              <input
                id="fechaRequerida"
                type="date"
                value={fechaRequerida}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => {
                  setFechaRequerida(e.target.value);
                  setFechaError(
                    isFechaValida(e.target.value) ? null : "Selecciona una fecha válida"
                  );
                }}
                className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] cursor-pointer"
              />
              {fechaError && <p className="text-[12px] font-medium text-[#c14a4a]">{fechaError}</p>}
            </div>
          </section>

          {error && <p className="text-[14px] font-medium text-[#c14a4a]">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            section="storefront"
            loading={submitting}
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      </div>
    </section>
  );
}
