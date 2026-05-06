"use client";

import { CaretDown, CaretUp } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getCarrito,
  removeItem,
  updateQuantity,
  getSubtotal,
  type CarritoItem,
} from "@/lib/cart/storage";

interface RelatedService {
  id_servicio: number;
  nombre_servicio: string;
}

interface Props {
  relatedServices: RelatedService[];
}

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function getSelecciones(configuracion: Record<string, unknown>) {
  const raw = configuracion?.selecciones;
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((s) => ({
    opcionNombre: (s?.opcionNombre as string) ?? `Opción ${s?.opcionId ?? ""}`,
    valorNombre: (s?.valorNombre as string) ?? String(s?.valorId ?? ""),
  }));
}

function ChevronLeft() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
      <path
        d="M10 2L2 10L10 18"
        stroke="#1e1e1e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
      <path
        d="M2 2L10 10L2 18"
        stroke="#1e1e1e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CAROUSEL_VISIBLE = 5;

export function CarritoView({ relatedServices }: Props) {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [openSpecs, setOpenSpecs] = useState<Set<string>>(new Set());
  const [carouselStart, setCarouselStart] = useState(0);

  useEffect(() => {
    const init = () => {
      const carrito = getCarrito();
      setItems(carrito.items);
      setOpenSpecs(new Set(carrito.items.map((i) => i.id)));
      setMounted(true);
    };
    init();
  }, []);

  function handleEliminar(itemId: string) {
    const updated = removeItem(itemId);
    setItems(updated.items);
    window.dispatchEvent(new CustomEvent("carrito:updated"));
  }

  function handleCantidad(itemId: string, value: number) {
    const updated = updateQuantity(itemId, value);
    setItems(updated.items);
    window.dispatchEvent(new CustomEvent("carrito:updated"));
  }

  function toggleSpecs(itemId: string) {
    setOpenSpecs((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-[24px] py-[80px]">
        <p className="text-[#1e1e1e] text-[20px] font-semibold">Tu carrito está vacío</p>
        <Link
          href="/servicios"
          className="bg-[#8b434a] text-white rounded-[10px] px-[32px] h-[52px] flex items-center font-semibold text-[16px] hover:bg-[#7a3a41] transition-colors"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal(items);
  const visibleServices = relatedServices.slice(carouselStart, carouselStart + CAROUSEL_VISIBLE);

  return (
    <div>
      {/* Announcement banner */}
      <div className="bg-black h-[67px] flex items-center justify-center px-[42px]">
        <p className="text-[#fffcfc] text-[16.742px] font-medium text-center">
          Noticias importantes de ofertas, por ejemplo: 30% de descuento en carteles 3D | Termina el
          10 de abril | <span className="underline cursor-pointer">Comprar ahora</span>
        </p>
      </div>

      <div className="max-w-[1440px] mx-auto px-[42px] py-[40px]">
        <h1 className="font-bold text-[36px] text-[#1e1e1e] mb-[32px]">Mi carrito</h1>

        <div className="flex gap-[40px] items-start">
          {/* ── Left: Cart items ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="h-px bg-[#c2c0c0]" />

            {items.map((item) => {
              const selecciones = getSelecciones(item.configuracion);
              const specsOpen = openSpecs.has(item.id);

              return (
                <div key={item.id}>
                  <div className="py-[24px] flex gap-[24px]">
                    {/* Preview + edit links */}
                    <div className="flex flex-col gap-[8px] shrink-0">
                      <div className="flex items-center gap-[8px]">
                        <button
                          className="bg-[#ebebeb] rounded-[8px] shadow-[0px_3px_8px_0px_rgba(0,0,0,0.25)] w-[50px] h-[50px] flex items-center justify-center"
                          aria-label="Imagen anterior"
                        >
                          <ChevronLeft />
                        </button>
                        <div className="bg-white rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] w-[187px] h-[102px] flex items-center justify-center">
                          <p className="text-[14px] text-[#999] text-center leading-snug">
                            Preview del
                            <br />
                            producto
                          </p>
                        </div>
                        <button
                          className="bg-[#fffcfc] rounded-[8px] shadow-[0px_3px_8px_0px_rgba(0,0,0,0.25)] w-[50px] h-[50px] flex items-center justify-center"
                          aria-label="Imagen siguiente"
                        >
                          <ChevronRight />
                        </button>
                      </div>

                      <Link
                        href={`/servicios/${item.servicioId}`}
                        className="text-[18px] font-medium text-[#1e1e1e] underline"
                      >
                        Editar opciones
                      </Link>
                      <button className="text-[18px] font-medium text-[#1e1e1e] underline text-left">
                        Editar diseño
                      </button>
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-[12px]">
                      <p className="font-bold text-[18px] text-[#1e1e1e]">{item.nombreServicio}</p>

                      <div className="flex items-center gap-[16px]">
                        <div className="flex items-center border border-[#8e908f] rounded-[10px] h-[49px] w-[167px] px-[12px] gap-[4px]">
                          <span className="text-[18px] text-[#1e1e1e] whitespace-nowrap">
                            Cantidad:
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={9999}
                            value={item.cantidad}
                            onChange={(e) => handleCantidad(item.id, Number(e.target.value))}
                            className="w-[36px] text-[18px] text-[#1e1e1e] bg-transparent border-none outline-none text-right"
                          />
                          <CaretDown size={16} className="text-[#1e1e1e] shrink-0" />
                        </div>

                        <button
                          onClick={() => handleEliminar(item.id)}
                          className="text-[18px] font-medium text-[#1e1e1e] underline"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="h-px bg-[#c2c0c0]" />

                      {/* Especificaciones */}
                      <button
                        onClick={() => toggleSpecs(item.id)}
                        className="flex items-center justify-between w-full"
                      >
                        <span className="font-bold text-[18px] text-[#1e1e1e]">
                          Especificaciones
                        </span>
                        {specsOpen ? (
                          <CaretUp size={20} className="text-[#1e1e1e]" />
                        ) : (
                          <CaretDown size={20} className="text-[#1e1e1e]" />
                        )}
                      </button>

                      {specsOpen && selecciones.length > 0 && (
                        <div className="flex flex-col gap-[4px]">
                          {selecciones.map((s, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-[18px] text-[#1e1e1e]"
                            >
                              <span>{s.opcionNombre}</span>
                              <span>{s.valorNombre}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="h-px bg-[#c2c0c0]" />

                      <p className="text-[18px] text-[#1e1e1e]">
                        Total del artículo:{" "}
                        <span className="font-semibold">
                          {formatPeso(item.precioCalculado * item.cantidad)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#c2c0c0]" />
                </div>
              );
            })}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="border border-[#8e908f] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] w-[523px] shrink-0 p-[32px] flex flex-col gap-[16px]">
            <h2 className="font-bold text-[28px] text-[#1e1e1e]">Resumen del pedido</h2>

            <div className="flex flex-col gap-[6px]">
              <div className="flex justify-between text-[18px] text-[#1e1e1e]">
                <span className="font-bold">Subtotal</span>
                <span className="font-bold">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[18px] text-[#1e1e1e]">
                <span>Envío (calculado al finalizar su compra)</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-[18px] text-[#1e1e1e]">
                <span>Impuesto (calculado al finalizar su compra)</span>
                <span>-</span>
              </div>
            </div>

            <div className="h-px bg-[#c2c0c0]" />

            <div className="flex justify-between text-[20px] font-bold text-[#1e1e1e]">
              <span>Total a deber</span>
              <span>{formatPeso(subtotal)}</span>
            </div>

            <button className="bg-[#8b434a] h-[61px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] text-[#fffcfc] font-bold text-[16.742px] hover:bg-[#7a3a41] transition-colors w-full">
              Ir a pantalla de compra
            </button>
          </div>
        </div>

        {/* ── Más productos parecidos ── */}
        {relatedServices.length > 0 && (
          <div className="mt-[48px]">
            <h2 className="font-bold text-[28px] text-[#1e1e1e] mb-[24px]">
              Más productos parecidos
            </h2>

            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => setCarouselStart((p) => Math.max(0, p - 1))}
                disabled={carouselStart === 0}
                className="bg-[#ebebeb] rounded-[8px] shadow-[0px_3px_8px_0px_rgba(0,0,0,0.25)] w-[50px] h-[50px] flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft />
              </button>

              <div className="flex gap-[16px] flex-1">
                {visibleServices.map((s) => (
                  <Link
                    key={s.id_servicio}
                    href={`/servicios/${s.id_servicio}`}
                    className="bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex-1 h-[200px] flex items-end p-[12px] hover:scale-[1.02] transition-transform"
                  >
                    <p className="font-bold text-[16.742px] text-[#1e1e1e]">{s.nombre_servicio}</p>
                  </Link>
                ))}
                {visibleServices.length < CAROUSEL_VISIBLE &&
                  Array.from({ length: CAROUSEL_VISIBLE - visibleServices.length }).map((_, i) => (
                    <div key={`pad-${i}`} className="flex-1 h-[200px]" />
                  ))}
              </div>

              <button
                onClick={() =>
                  setCarouselStart((p) =>
                    Math.min(relatedServices.length - CAROUSEL_VISIBLE, p + 1)
                  )
                }
                disabled={carouselStart + CAROUSEL_VISIBLE >= relatedServices.length}
                className="bg-[#fffcfc] rounded-[8px] shadow-[0px_3px_8px_0px_rgba(0,0,0,0.25)] w-[50px] h-[50px] flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                aria-label="Siguiente"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
