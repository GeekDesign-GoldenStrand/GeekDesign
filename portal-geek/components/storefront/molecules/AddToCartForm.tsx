"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  addItem,
  calcularPrecioUnitario,
  getCarrito,
  resetItem,
  updateItem,
  type MatrizEntry,
} from "@/lib/cart/storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Valor {
  id_valor: number;
  valor: string;
  es_default: boolean;
  matriz: MatrizEntry[];
}

interface Opcion {
  id_opcion: number;
  nombre_opcion: string;
  valores: Valor[];
}

interface Props {
  servicioId: number;
  nombreServicio: string;
  opciones: Opcion[];
  editItemId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function buildConfiguracion(
  selecciones: { opcionId: number; valorId: number }[],
  opciones: Opcion[]
): Record<string, unknown> {
  return {
    selecciones: selecciones.map((s) => {
      const opcion = opciones.find((o) => o.id_opcion === s.opcionId);
      const valor = opcion?.valores.find((v) => v.id_valor === s.valorId);
      return {
        opcionId: s.opcionId,
        opcionNombre: opcion?.nombre_opcion ?? "",
        valorId: s.valorId,
        valorNombre: valor?.valor ?? "",
      };
    }),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddToCartForm({ servicioId, nombreServicio, opciones, editItemId }: Props) {
  const router = useRouter();
  const isEditMode = Boolean(editItemId);

  const defaultSelecciones = opciones.map((o) => ({
    opcionId: o.id_opcion,
    valorId: (o.valores.find((v) => v.es_default) ?? o.valores[0])?.id_valor ?? 0,
  }));

  const [selecciones, setSelecciones] = useState(defaultSelecciones);
  const [cantidad, setCantidad] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditMode);

  useEffect(() => {
    function apply() {
      if (!editItemId) {
        setHydrated(true);
        return;
      }
      const item = getCarrito().items.find((i) => i.id === editItemId);
      if (item && item.servicioId === servicioId) {
        const raw = item.configuracion["selecciones"];
        const savedMap = new Map<number, number>();
        if (Array.isArray(raw)) {
          (raw as { opcionId: number; valorId: number }[]).forEach((s) =>
            savedMap.set(s.opcionId, s.valorId)
          );
        }
        // Merge: use saved valorId when the opcionId still exists, otherwise keep default
        setSelecciones(
          defaultSelecciones.map((d) => ({
            opcionId: d.opcionId,
            valorId: savedMap.get(d.opcionId) ?? d.valorId,
          }))
        );
        setCantidad(item.cantidad);
      }
      setHydrated(true);
    }
    apply();
    // servicioId and defaultSelecciones are derived from static SSR props and never change after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editItemId]);

  // TODO ADMIN-04/05: replace with debounced POST /api/servicios/[id]/calcular-precio
  const precioUnitario = calcularPrecioUnitario(selecciones, opciones, cantidad);

  function setValor(opcionId: number, valorId: number) {
    setSelecciones((prev) => prev.map((s) => (s.opcionId === opcionId ? { ...s, valorId } : s)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const configuracion = buildConfiguracion(selecciones, opciones);

    if (editItemId) {
      updateItem(editItemId, { configuracion, cantidad, precioCalculado: precioUnitario });
      window.dispatchEvent(new CustomEvent("carrito:updated"));
      setFeedback("Cambios guardados");
      setTimeout(() => router.push("/carrito"), 1500);
      return;
    }

    addItem({
      servicioId,
      nombreServicio,
      configuracion,
      cantidad,
      precioCalculado: precioUnitario,
    });
    window.dispatchEvent(new CustomEvent("carrito:updated"));
    setFeedback(`${nombreServicio} agregado al carrito`);
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleConfirmReset() {
    if (!editItemId) return;
    const defaultConfig = buildConfiguracion(defaultSelecciones, opciones);
    const defaultPrecio = calcularPrecioUnitario(defaultSelecciones, opciones, 1);
    resetItem(editItemId, defaultConfig, defaultPrecio);
    window.dispatchEvent(new CustomEvent("carrito:updated"));
    router.push("/carrito");
  }

  if (!hydrated) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] mt-[24px]">
      {opciones.map((opcion) => (
        <div key={opcion.id_opcion} className="flex flex-col gap-[6px]">
          <label
            htmlFor={`opcion-${opcion.id_opcion}`}
            className="text-[14px] font-semibold text-[#1e1e1e]"
          >
            {opcion.nombre_opcion}
          </label>
          <select
            id={`opcion-${opcion.id_opcion}`}
            value={selecciones.find((s) => s.opcionId === opcion.id_opcion)?.valorId ?? ""}
            onChange={(e) => setValor(opcion.id_opcion, Number(e.target.value))}
            className="h-[44px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a]"
          >
            {opcion.valores.map((v) => (
              <option key={v.id_valor} value={v.id_valor}>
                {v.valor}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex flex-col gap-[6px]">
        <label htmlFor="cantidad" className="text-[14px] font-semibold text-[#1e1e1e]">
          Cantidad
        </label>
        <input
          id="cantidad"
          type="number"
          min={1}
          max={9999}
          value={cantidad}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCantidad(Number.isFinite(val) ? Math.max(1, Math.floor(val)) : 1);
          }}
          className="h-[44px] w-[120px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[14px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a]"
        />
      </div>

      {precioUnitario > 0 && (
        <p className="text-[15px] font-semibold text-[#8b434a]">
          {formatPeso(precioUnitario * cantidad)}
          <span className="text-[13px] font-normal text-[#666] ml-[6px]">
            ({formatPeso(precioUnitario)} c/u)
          </span>
        </p>
      )}

      {feedback && <p className="text-[14px] font-medium text-[#2e7d32]">{feedback}</p>}

      <button
        type="submit"
        className="shrink-0 bg-[#8b434a] rounded-[10px] h-[63px] w-full flex items-center justify-center gap-[10px] text-white font-semibold text-[20px] tracking-[1px] hover:bg-[#7a3a41] active:scale-[0.99] transition-all duration-150"
      >
        <ShoppingCart size={24} weight="bold" />
        {isEditMode ? "Confirmar cambios" : "Añadir al carrito"}
      </button>

      {isEditMode && !confirmingReset && (
        <button
          type="button"
          onClick={() => router.push("/carrito")}
          className="h-[52px] w-full rounded-[10px] border border-[#c2c0c0] bg-white text-[#1e1e1e] font-semibold text-[16px] hover:bg-[#f5f5f5] active:scale-[0.99] transition-all duration-150"
        >
          Cancelar
        </button>
      )}

      {isEditMode &&
        (confirmingReset ? (
          <div className="flex items-center gap-[8px]">
            <span className="text-[13px] text-[#666] flex-1">
              ¿Reiniciar todas las especificaciones?
            </span>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="bg-[#8b434a] text-white text-[13px] font-semibold px-[16px] h-[36px] rounded-[8px] hover:bg-[#7a3a41] transition-colors shrink-0"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="bg-[#ebebeb] text-[#1e1e1e] text-[13px] font-semibold px-[16px] h-[36px] rounded-[8px] hover:bg-[#d9d9d9] transition-colors shrink-0"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="text-[14px] font-medium text-[#666] underline hover:text-[#1e1e1e] transition-colors text-center"
          >
            Eliminar todo
          </button>
        ))}
    </form>
  );
}
