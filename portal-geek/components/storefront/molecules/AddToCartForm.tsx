"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useState } from "react";

import { addItem, calcularPrecioUnitario, type MatrizEntry } from "@/lib/cart/storage";

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────

export function AddToCartForm({ servicioId, nombreServicio, opciones }: Props) {
  const defaultSelecciones = opciones.map((o) => ({
    opcionId: o.id_opcion,
    valorId: (o.valores.find((v) => v.es_default) ?? o.valores[0])?.id_valor ?? 0,
  }));

  const [selecciones, setSelecciones] = useState(defaultSelecciones);
  const [cantidad, setCantidad] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const precioUnitario = calcularPrecioUnitario(selecciones, opciones, cantidad);

  function setValor(opcionId: number, valorId: number) {
    setSelecciones((prev) => prev.map((s) => (s.opcionId === opcionId ? { ...s, valorId } : s)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const updated = addItem({
      servicioId,
      nombreServicio,
      configuracion: {
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
      },
      cantidad,
      precioCalculado: precioUnitario,
    });

    window.dispatchEvent(new CustomEvent("carrito:updated"));

    setFeedback(`${nombreServicio} agregado al carrito`);
    setTimeout(() => setFeedback(null), 3000);

    void updated; // updated.items available if needed
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] mt-[24px]">
      {opciones.map((opcion) => (
        <div key={opcion.id_opcion} className="flex flex-col gap-[6px]">
          <label className="text-[14px] font-semibold text-[#1e1e1e]">{opcion.nombre_opcion}</label>
          <select
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
        <label className="text-[14px] font-semibold text-[#1e1e1e]">Cantidad</label>
        <input
          type="number"
          min={1}
          max={9999}
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
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
        Añadir al carrito
      </button>
    </form>
  );
}
