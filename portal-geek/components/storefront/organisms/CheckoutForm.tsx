"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { clearCarrito, getCarrito, getSubtotal, type CarritoItem } from "@/lib/cart/storage";
import { EMAIL_ERROR_MESSAGE, isValidEmail } from "@/lib/utils/email";

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

export interface InitialContact {
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
}

interface Props {
  sucursales: Sucursal[];
  initialContact?: InitialContact | null;
}

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const getMinDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMaxDate = () => {
  const today = new Date();
  const year = today.getFullYear() + 2;
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// The storefront cotización endpoint validates with Zod and returns the raw
// issue (e.g. "items.1.notas: Too big: expected string to have <=500
// characters"). End users shouldn't see the field path or the English copy,
// so strip the path prefix and translate the common cases to Spanish.
function translateServerError(raw?: string): string {
  const fallback = "No se pudo enviar la cotización. Revisa los datos e inténtalo de nuevo.";
  if (!raw) return fallback;

  // The path lives before the first colon (e.g. "items.1.notas").
  const path = raw.split(":")[0] ?? "";
  const isNotas = /notas/i.test(path);
  // Drop the leading Zod path so only the message remains.
  const message = raw.replace(/^[a-zA-Z0-9_.]+:\s*/, "");

  const tooBig = message.match(/too big[^0-9]*(\d+)\s*characters?/i);
  if (tooBig) {
    const max = tooBig[1];
    return isNotas
      ? `Las notas de uno de los productos superan el máximo de ${max} caracteres. Acórtalas e inténtalo de nuevo.`
      : `Uno de los campos supera el máximo de ${max} caracteres.`;
  }

  const tooSmall = message.match(/too small[^0-9]*(\d+)\s*characters?/i);
  if (tooSmall) {
    return `Uno de los campos no alcanza el mínimo de ${tooSmall[1]} caracteres.`;
  }

  // Any remaining English/Zod-shaped text shouldn't leak to the user.
  if (/expected|invalid|required|string|number|too (big|small)/i.test(message)) {
    return fallback;
  }

  return message || fallback;
}

export function CheckoutForm({ sucursales, initialContact }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [nombre, setNombre] = useState(initialContact?.nombre ?? "");
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState(initialContact?.empresa ?? "");
  const [correo, setCorreo] = useState(initialContact?.correo ?? "");
  const [correoError, setCorreoError] = useState<string | null>(null);
  // E.164 format (e.g. "+524421234567") from react-phone-number-input.
  // The library returns undefined while the user is typing an incomplete number.
  // A recognized client's stored phone is already E.164, so we seed it directly.
  const [telefono, setTelefono] = useState<string | undefined>(
    initialContact?.telefono || undefined
  );
  const [telefonoError, setTelefonoError] = useState<string | null>(null);

  const PHONE_MAX_DIGITS = 15;
  function handlePhoneChange(next: string | undefined) {
    if (!next) {
      setTelefono(undefined);
      if (telefonoError) setTelefonoError(null);
      return;
    }
    const digitCount = next.replace(/\D/g, "").length;
    if (digitCount > PHONE_MAX_DIGITS) return; // reject keystroke, value stays put
    setTelefono(next);
    if (telefonoError) setTelefonoError(null);
  }
  const [idSucursal, setIdSucursal] = useState<number | null>(sucursales[0]?.id_sucursal ?? null);
  const [sucursalError, setSucursalError] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [notasError, setNotasError] = useState<string | null>(null);
  const [fechaEstimada, setFechaEstimada] = useState("");

  // Whether the form is showing prefilled data from a recognized client. Hidden
  // once they clear it (e.g. on a shared computer or "not me").
  const [recognized, setRecognized] = useState(Boolean(initialContact));

  async function handleForgetMe() {
    setRecognized(false);
    setNombre("");
    setEmpresa("");
    setCorreo("");
    setTelefono(undefined);
    try {
      await fetch("/api/storefront/cliente-recognido", { method: "DELETE" });
    } catch {
      // Best-effort: clearing the inputs already removed the visible PII; the
      // cookie will expire on its own if this network call fails.
    }
  }

  const [desearFacturar, setDesearFacturar] = useState(false);
  const [rfc, setRfc] = useState("");
  const [rfcError, setRfcError] = useState<string | null>(null);
  const [razonSocial, setRazonSocial] = useState("");
  const [razonSocialError, setRazonSocialError] = useState<string | null>(null);
  const [tipoPersona, setTipoPersona] = useState<"Fisica" | "Moral">("Fisica");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [regimenFiscalError, setRegimenFiscalError] = useState<string | null>(null);
  const [usoCfdi, setUsoCfdi] = useState("");
  const [usoCfdiError, setUsoCfdiError] = useState<string | null>(null);
  const [codigoPostal, setCodigoPostal] = useState("");
  const [codigoPostalError, setCodigoPostalError] = useState<string | null>(null);
  const [correoFacturacion, setCorreoFacturacion] = useState("");
  const [correoFacturacionError, setCorreoFacturacionError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaError, setFechaError] = useState<string | null>(null);

  // Allowed character set for notas (mirrors the server-side regex). Used by
  // the onBlur validator + the submit-time guard so the user gets the same
  // message regardless of when validation fires.
  const NOTAS_REGEX =
    /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:!?¿¡'"\(\)\-\[\]\{\}/&%$€£¥*+=@_#\\|<>^~`´]*$/;
  const NOTAS_INVALID_MSG =
    "Las notas solo pueden contener letras, números y signos de puntuación comunes (sin emojis)";

  // reAchi301 review: `submitting` is React state, so two fast clicks both
  // capture the stale `false` in their closures before the re-render disables
  // the button — that double-submits and creates two identical cotizaciones.
  // A ref flips synchronously, closing the race window.
  const submittingRef = useRef(false);

  useEffect(() => {
    const hydrate = () => {
      setItems(getCarrito().items);
      setMounted(true);
    };
    hydrate();
  }, []);

  function validateRfc(value: string, tipo: "Fisica" | "Moral"): string | null {
    const v = value.trim().toUpperCase();
    if (!v) return "El RFC es requerido";
    const regex =
      tipo === "Fisica" ? /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/ : /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
    if (!regex.test(v))
      return tipo === "Fisica"
        ? "RFC de persona física: 4 letras, 6 dígitos de fecha y 3 caracteres de homoclave (13 en total)"
        : "RFC de persona moral: 3 letras, 6 dígitos de fecha y 3 caracteres de homoclave (12 en total)";
    return null;
  }

  function isFechaEstimadaValida(fecha: string) {
    if (!fecha) return false;
    const min = getMinDate();
    const max = getMaxDate();
    return fecha >= min && fecha <= max;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    // Run every validator and surface errors INLINE per field. Submit only
    // proceeds when every field is clean — no scrolling to a banner just to
    // find which input is wrong.
    const nombreInvalid = nombre.trim().length === 0 ? "El nombre es requerido" : null;
    const correoInvalid = !isValidEmail(correo) ? EMAIL_ERROR_MESSAGE : null;
    const telefonoInvalid =
      !telefono || !isValidPhoneNumber(telefono)
        ? "Ingresa un número de teléfono válido para el país seleccionado"
        : null;
    const sucursalInvalid = idSucursal === null ? "Selecciona una sucursal" : null;
    const fechaInvalid = !isFechaEstimadaValida(fechaEstimada)
      ? "Selecciona una fecha válida de entrega"
      : null;
    const notasInvalid = notas.trim() && !NOTAS_REGEX.test(notas) ? NOTAS_INVALID_MSG : null;

    let rfcInvalid: string | null = null;
    let razonSocialInvalid: string | null = null;
    let regimenFiscalInvalid: string | null = null;
    let usoCfdiInvalid: string | null = null;
    let codigoPostalInvalid: string | null = null;
    let correoFacturacionInvalid: string | null = null;

    if (desearFacturar) {
      rfcInvalid = validateRfc(rfc, tipoPersona);
      razonSocialInvalid = razonSocial.trim().length === 0 ? "La razón social es requerida" : null;
      regimenFiscalInvalid =
        regimenFiscal.trim().length === 0 ? "El régimen fiscal es requerido" : null;
      usoCfdiInvalid = usoCfdi.trim().length === 0 ? "El uso de CFDI es requerido" : null;
      codigoPostalInvalid = !/^\d{5}$/.test(codigoPostal.trim())
        ? "El código postal debe tener 5 dígitos numéricos"
        : null;
      correoFacturacionInvalid =
        correoFacturacion.trim() && !isValidEmail(correoFacturacion) ? EMAIL_ERROR_MESSAGE : null;

      setRfcError(rfcInvalid);
      setRazonSocialError(razonSocialInvalid);
      setRegimenFiscalError(regimenFiscalInvalid);
      setUsoCfdiError(usoCfdiInvalid);
      setCodigoPostalError(codigoPostalInvalid);
      setCorreoFacturacionError(correoFacturacionInvalid);
    }

    setNombreError(nombreInvalid);
    setCorreoError(correoInvalid);
    setTelefonoError(telefonoInvalid);
    setSucursalError(sucursalInvalid);
    setFechaError(fechaInvalid);
    setNotasError(notasInvalid);

    if (
      nombreInvalid ||
      correoInvalid ||
      telefonoInvalid ||
      sucursalInvalid ||
      fechaInvalid ||
      notasInvalid ||
      rfcInvalid ||
      razonSocialInvalid ||
      regimenFiscalInvalid ||
      usoCfdiInvalid ||
      codigoPostalInvalid ||
      correoFacturacionInvalid
    ) {
      return;
    }

    if (items.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        cliente: {
          nombre_cliente: nombre.trim(),
          empresa: empresa.trim() || undefined,
          correo_electronico: correo.trim(),
          numero_telefono: telefono,
        },
        id_sucursal: idSucursal,
        factura: desearFacturar,
        datos_facturacion: desearFacturar
          ? {
              rfc: rfc.trim().toUpperCase(),
              razon_social: razonSocial.trim(),
              tipo_persona: tipoPersona,
              regimen_fiscal: regimenFiscal.trim(),
              uso_cfdi: usoCfdi.trim(),
              codigo_postal_fiscal: codigoPostal.trim(),
              correo_facturacion: correoFacturacion.trim() || undefined,
            }
          : undefined,
        notas: notas.trim() || undefined,
        fecha_estimada: fechaEstimada || undefined,
        items: items.map((i) => ({
          id_servicio: i.servicioId,
          id_material: i.id_material,
          cantidad: i.cantidad,
          // Copilot review #3: per-item design notes from the cart must reach
          // DetallePedido.notas — schema already supports it.
          notas: i.configuracion.notas,
          // Pass the GCS key and original filename so the server can create the ArchivosDisenio row.
          disenio_key: i.disenioKey,
          disenio_nombre: i.disenioNombre,
          variables: i.configuracion.variables.map((v) => ({
            nombre_variable: v.nombre_variable,
            valor: v.valor,
          })),
        })),
      };

      const res = await fetch("/api/storefront/cotizaciones", {
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

      clearCarrito();
      window.dispatchEvent(new CustomEvent("carrito:updated"));
      const folio = json.data.folio as string;
      router.push(
        `/tienda/cotizacion/confirmacion?folio=${encodeURIComponent(folio)}&email=${encodeURIComponent(correo.trim())}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-[10px] border border-[#c2c0c0] p-[32px]">
        <p className="text-[18px] text-[#1e1e1e]">
          Tu carrito está vacío. Agrega un servicio antes de solicitar una cotización.
        </p>
      </div>
    );
  }

  const subtotal = getSubtotal(items);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
      <section className="bg-white rounded-[10px] border border-[#c2c0c0] p-[24px] flex flex-col gap-[16px]">
        <h2 className="font-bold text-[20px] text-[#1e1e1e]">Tus datos</h2>

        {recognized && (
          <div className="flex items-center justify-between gap-[12px] rounded-[8px] bg-[#fff8f9] border border-[#e6d2d4] px-[14px] py-[10px]">
            <p className="text-[14px] text-[#1e1e1e]">
              Cotizando como <span className="font-semibold">{nombre || correo}</span>.
            </p>
            <button
              type="button"
              onClick={handleForgetMe}
              className="text-[14px] font-semibold text-[#8b434a] underline hover:text-[#7a3a41]"
            >
              ¿No eres tú?
            </button>
          </div>
        )}

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
            onBlur={() => {
              setNombreError(nombre.trim().length === 0 ? "El nombre es requerido" : null);
            }}
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
            aria-describedby={correoError ? "correo-error" : "correo-help"}
            className={`h-[44px] rounded-[8px] border bg-white px-[12px] text-[14px] text-[#1e1e1e] ${
              correoError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
            }`}
          />
          {correoError ? (
            <p id="correo-error" className="text-[12px] font-medium text-[#c14a4a]">
              {correoError}
            </p>
          ) : (
            <p id="correo-help" className="text-[12px] text-[#666]">
              Usarás este correo para revisar y aprobar tu cotización.
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
                if (!telefono) {
                  setTelefonoError("Ingresa tu número de teléfono");
                } else if (!isValidPhoneNumber(telefono)) {
                  setTelefonoError("Número de teléfono inválido para el país seleccionado");
                } else {
                  setTelefonoError(null);
                }
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

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="sucursal" className="text-[14px] font-semibold text-[#1e1e1e]">
            Sucursal de entrega <span className="text-[#c14a4a]">*</span>
          </label>
          <Select
            id="sucursal"
            placeholder="Selecciona una sucursal"
            value={idSucursal === null ? "" : String(idSucursal)}
            onChange={(v) => {
              setIdSucursal(v ? Number(v) : null);
              if (sucursalError) setSucursalError(null);
            }}
            error={sucursalError || undefined}
          >
            {sucursales.map((s) => (
              <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
                {s.nombre_sucursal}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="fechaEstimada" className="text-[14px] font-semibold text-[#1e1e1e]">
            Fecha deseada de entrega <span className="text-[#c14a4a]">*</span>
          </label>
          <input
            id="fechaEstimada"
            type="date"
            required
            value={fechaEstimada}
            onChange={(e) => {
              setFechaEstimada(e.target.value);
              if (!isFechaEstimadaValida(e.target.value)) {
                setFechaError("Selecciona una fecha válida de entrega");
              } else {
                setFechaError(null);
              }
            }}
            min={getMinDate()}
            max={getMaxDate()}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] cursor-pointer"
          />
          {fechaError && (
            <span className="text-[13px] text-[#c14a4a] font-medium">{fechaError}</span>
          )}
        </div>

        <div className="flex flex-col gap-[6px]">
          <div className="flex justify-between items-center">
            <label htmlFor="notas" className="text-[14px] font-semibold text-[#1e1e1e]">
              Notas adicionales (opcional)
            </label>
            <span className="text-[12px] text-[#666]">{notas.length}/500</span>
          </div>
          <textarea
            id="notas"
            rows={3}
            maxLength={500}
            value={notas}
            onChange={(e) => {
              setNotas(e.target.value);
              if (notasError) setNotasError(null);
            }}
            onBlur={() => {
              if (!notas.trim()) {
                setNotasError(null);
                return;
              }
              setNotasError(NOTAS_REGEX.test(notas) ? null : NOTAS_INVALID_MSG);
            }}
            aria-invalid={notasError !== null}
            aria-describedby={notasError ? "notas-error" : undefined}
            className={`rounded-[8px] border bg-white px-[12px] py-[8px] text-[14px] text-[#1e1e1e] ${
              notasError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
            }`}
          />
          {notasError && (
            <p id="notas-error" className="text-[12px] font-medium text-[#c14a4a]">
              {notasError}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={desearFacturar}
            onChange={(e) => setDesearFacturar(e.target.checked)}
            className="w-4.5 h-4.5 accent-[#8b434a] cursor-pointer"
          />
          <span className="text-[14px] font-semibold text-[#1e1e1e]">Deseo facturar</span>
        </label>
      </section>

      {desearFacturar && (
        <section className="bg-white rounded-[10px] border border-[#c2c0c0] p-6 flex flex-col gap-4">
          <h2 className="font-bold text-[20px] text-[#1e1e1e]">Datos de facturación</h2>
          <p className="text-[13px] text-[#666]">
            Estos datos se compartirán con el área de contabilidad para emitir tu factura.
          </p>

          {/* Tipo de persona */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-[#1e1e1e]">
              Tipo de persona <span className="text-[#c14a4a]">*</span>
            </span>
            <div className="flex gap-6">
              {(["Fisica", "Moral"] as const).map((tipo) => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="tipoPersona"
                    value={tipo}
                    checked={tipoPersona === tipo}
                    onChange={() => {
                      setTipoPersona(tipo);
                      if (rfcError) setRfcError(validateRfc(rfc, tipo));
                    }}
                    className="accent-[#8b434a]"
                  />
                  <span className="text-[14px] text-[#1e1e1e]">
                    {tipo === "Fisica" ? "Persona Física" : "Persona Moral"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* RFC */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rfc" className="text-[14px] font-semibold text-[#1e1e1e]">
              RFC <span className="text-[#c14a4a]">*</span>
            </label>
            <input
              id="rfc"
              maxLength={13}
              value={rfc}
              onChange={(e) => {
                const v = e.target.value.toUpperCase();
                setRfc(v);
                if (rfcError) setRfcError(validateRfc(v, tipoPersona));
              }}
              onBlur={() => setRfcError(validateRfc(rfc, tipoPersona))}
              aria-invalid={rfcError !== null}
              aria-describedby={rfcError ? "rfc-error" : undefined}
              placeholder={tipoPersona === "Fisica" ? "XAXX010101000" : "XAX010101000"}
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] uppercase tracking-wider ${
                rfcError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {rfcError && (
              <p id="rfc-error" className="text-[12px] font-medium text-[#c14a4a]">
                {rfcError}
              </p>
            )}
          </div>

          {/* Razón social */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="razonSocial" className="text-[14px] font-semibold text-[#1e1e1e]">
              Razón social <span className="text-[#c14a4a]">*</span>
            </label>
            <input
              id="razonSocial"
              maxLength={254}
              value={razonSocial}
              onChange={(e) => {
                setRazonSocial(e.target.value);
                if (razonSocialError) setRazonSocialError(null);
              }}
              onBlur={() =>
                setRazonSocialError(
                  razonSocial.trim().length === 0 ? "La razón social es requerida" : null
                )
              }
              aria-invalid={razonSocialError !== null}
              aria-describedby={razonSocialError ? "razonSocial-error" : "razonSocial-help"}
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] ${
                razonSocialError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {razonSocialError ? (
              <p id="razonSocial-error" className="text-[12px] font-medium text-[#c14a4a]">
                {razonSocialError}
              </p>
            ) : (
              <p id="razonSocial-help" className="text-[12px] text-[#666]">
                Tal como aparece registrado ante el SAT.
              </p>
            )}
          </div>

          {/* Régimen fiscal */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="regimenFiscal" className="text-[14px] font-semibold text-[#1e1e1e]">
              Régimen fiscal <span className="text-[#c14a4a]">*</span>
            </label>
            <input
              id="regimenFiscal"
              maxLength={100}
              value={regimenFiscal}
              onChange={(e) => {
                setRegimenFiscal(e.target.value);
                if (regimenFiscalError) setRegimenFiscalError(null);
              }}
              onBlur={() =>
                setRegimenFiscalError(
                  regimenFiscal.trim().length === 0 ? "El régimen fiscal es requerido" : null
                )
              }
              aria-invalid={regimenFiscalError !== null}
              aria-describedby={regimenFiscalError ? "regimenFiscal-error" : undefined}
              placeholder="Ej. 601 - General de Ley Personas Morales"
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] ${
                regimenFiscalError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {regimenFiscalError && (
              <p id="regimenFiscal-error" className="text-[12px] font-medium text-[#c14a4a]">
                {regimenFiscalError}
              </p>
            )}
          </div>

          {/* Uso de CFDI */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usoCfdi" className="text-[14px] font-semibold text-[#1e1e1e]">
              Uso de CFDI <span className="text-[#c14a4a]">*</span>
            </label>
            <input
              id="usoCfdi"
              maxLength={100}
              value={usoCfdi}
              onChange={(e) => {
                setUsoCfdi(e.target.value);
                if (usoCfdiError) setUsoCfdiError(null);
              }}
              onBlur={() =>
                setUsoCfdiError(usoCfdi.trim().length === 0 ? "El uso de CFDI es requerido" : null)
              }
              aria-invalid={usoCfdiError !== null}
              aria-describedby={usoCfdiError ? "usoCfdi-error" : undefined}
              placeholder="Ej. G03 - Gastos en general"
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] ${
                usoCfdiError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {usoCfdiError && (
              <p id="usoCfdi-error" className="text-[12px] font-medium text-[#c14a4a]">
                {usoCfdiError}
              </p>
            )}
          </div>

          {/* Código postal fiscal */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="codigoPostal" className="text-[14px] font-semibold text-[#1e1e1e]">
              Código postal fiscal <span className="text-[#c14a4a]">*</span>
            </label>
            <input
              id="codigoPostal"
              inputMode="numeric"
              maxLength={5}
              value={codigoPostal}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setCodigoPostal(v);
                if (codigoPostalError) setCodigoPostalError(null);
              }}
              onBlur={() =>
                setCodigoPostalError(
                  !/^\d{5}$/.test(codigoPostal.trim())
                    ? "El código postal debe tener 5 dígitos numéricos"
                    : null
                )
              }
              aria-invalid={codigoPostalError !== null}
              aria-describedby={codigoPostalError ? "codigoPostal-error" : "codigoPostal-help"}
              placeholder="76000"
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] ${
                codigoPostalError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {codigoPostalError ? (
              <p id="codigoPostal-error" className="text-[12px] font-medium text-[#c14a4a]">
                {codigoPostalError}
              </p>
            ) : (
              <p id="codigoPostal-help" className="text-[12px] text-[#666]">
                El registrado ante el SAT, no necesariamente el de tu domicilio.
              </p>
            )}
          </div>

          {/* Correo de facturación */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="correoFacturacion" className="text-[14px] font-semibold text-[#1e1e1e]">
              Correo de facturación (opcional)
            </label>
            <input
              id="correoFacturacion"
              type="email"
              maxLength={150}
              inputMode="email"
              spellCheck={false}
              value={correoFacturacion}
              onChange={(e) => {
                setCorreoFacturacion(e.target.value);
                if (correoFacturacionError) setCorreoFacturacionError(null);
              }}
              onBlur={() => {
                if (!correoFacturacion.trim()) {
                  setCorreoFacturacionError(null);
                  return;
                }
                setCorreoFacturacionError(
                  isValidEmail(correoFacturacion) ? null : EMAIL_ERROR_MESSAGE
                );
              }}
              aria-invalid={correoFacturacionError !== null}
              aria-describedby={
                correoFacturacionError ? "correoFacturacion-error" : "correoFacturacion-help"
              }
              className={`h-11 rounded-lg border bg-white px-3 text-[14px] text-[#1e1e1e] ${
                correoFacturacionError ? "border-[#c14a4a]" : "border-[#c2c0c0]"
              }`}
            />
            {correoFacturacionError ? (
              <p id="correoFacturacion-error" className="text-[12px] font-medium text-[#c14a4a]">
                {correoFacturacionError}
              </p>
            ) : (
              <p id="correoFacturacion-help" className="text-[12px] text-[#666]">
                Si la factura debe llegar a un correo distinto al de contacto.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="bg-white rounded-[10px] border border-[#c2c0c0] p-[24px] flex flex-col gap-[8px]">
        <h2 className="font-bold text-[20px] text-[#1e1e1e]">Resumen</h2>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-[15px] text-[#1e1e1e]">
            <span>
              {i.nombreServicio} ({i.nombreMaterial}) × {i.cantidad}
            </span>
            <span>{formatPeso(i.precioCalculado * i.cantidad)}</span>
          </div>
        ))}
        <div className="h-px bg-[#c2c0c0] my-[8px]" />
        <div className="flex justify-between text-[16px] font-bold text-[#1e1e1e]">
          <span>Total estimado</span>
          <span>{formatPeso(subtotal)}</span>
        </div>
        <p className="text-[12px] text-[#666]">
          El total final se confirma cuando Dirección valida la cotización.
        </p>
      </section>

      {error && <p className="text-[14px] font-medium text-[#c14a4a]">{error}</p>}

      <Button type="submit" variant="primary" size="lg" section="storefront" loading={submitting}>
        {submitting ? "Enviando…" : "Enviar para aprobación"}
      </Button>
    </form>
  );
}
