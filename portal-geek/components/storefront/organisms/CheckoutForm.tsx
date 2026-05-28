"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { clearCarrito, getCarrito, getSubtotal, type CarritoItem } from "@/lib/cart/storage";

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface Props {
  sucursales: Sucursal[];
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

export function CheckoutForm({ sucursales }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [correo, setCorreo] = useState("");
  // E.164 format (e.g. "+524421234567") from react-phone-number-input.
  // The library returns undefined while the user is typing an incomplete number.
  const [telefono, setTelefono] = useState<string | undefined>(undefined);

  const PHONE_MAX_DIGITS = 15;
  function handlePhoneChange(next: string | undefined) {
    if (!next) {
      setTelefono(undefined);
      return;
    }
    const digitCount = next.replace(/\D/g, "").length;
    if (digitCount > PHONE_MAX_DIGITS) return; // reject keystroke, value stays put
    setTelefono(next);
  }
  const [idSucursal, setIdSucursal] = useState<number | null>(sucursales[0]?.id_sucursal ?? null);
  const [notas, setNotas] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    if (items.length === 0) {
      setError("El carrito está vacío");
      return;
    }
    if (idSucursal === null) {
      setError("Selecciona una sucursal");
      return;
    }
    if (!telefono || !isValidPhoneNumber(telefono)) {
      setError("Ingresa un número de teléfono válido para el país seleccionado");
      return;
    }

    if (notas.trim()) {
      const regex = /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:!?¿¡'"\(\)\-\[\]\{\}/&%$€£¥*+=@_#\\|<>^~`´]*$/;
      if (!regex.test(notas)) {
        setError(
          "Las notas solo pueden contener letras en inglés o español, números y signos de puntuación comunes, y no se permiten emojis"
        );
        return;
      }
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
        setError(json.error ?? "Error al enviar la cotización");
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

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="nombre" className="text-[14px] font-semibold text-[#1e1e1e]">
            Nombre completo <span className="text-[#c14a4a]">*</span>
          </label>
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e]"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="empresa" className="text-[14px] font-semibold text-[#1e1e1e]">
            Empresa (opcional)
          </label>
          <input
            id="empresa"
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
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e]"
          />
          <p className="text-[12px] text-[#666]">
            Usarás este correo para revisar y aprobar tu cotización.
          </p>
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
            numberInputProps={{ maxLength: 16, inputMode: "tel" }}
            onChange={handlePhoneChange}
            className="flex items-center gap-2 h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:[font:inherit] [&_.PhoneInputInput]:[color:inherit] [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:h-full [&_.PhoneInputCountry]:mr-0"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="sucursal" className="text-[14px] font-semibold text-[#1e1e1e]">
            Sucursal de entrega <span className="text-[#c14a4a]">*</span>
          </label>
          <select
            id="sucursal"
            required
            value={idSucursal ?? ""}
            onChange={(e) => setIdSucursal(Number(e.target.value))}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e]"
          >
            {sucursales.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre_sucursal}
              </option>
            ))}
          </select>
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
            onChange={(e) => setFechaEstimada(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] cursor-pointer"
          />
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
            onChange={(e) => setNotas(e.target.value)}
            className="rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] py-[8px] text-[14px] text-[#1e1e1e]"
          />
        </div>
      </section>

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

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#8b434a] h-[61px] rounded-[10px] text-white font-bold text-[16.742px] hover:bg-[#7a3a41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Enviando…" : "Enviar para aprobación"}
      </button>
    </form>
  );
}
