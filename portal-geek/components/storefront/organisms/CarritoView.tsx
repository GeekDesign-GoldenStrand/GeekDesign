"use client";

import { CaretDown, CaretUp } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import {
  getCarrito,
  removeItem,
  updateQuantity,
  getSubtotal,
  CANTIDAD_MAX,
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

function getEspecificaciones(item: CarritoItem) {
  const rows: Array<{ etiqueta: string; valor: string }> = [
    { etiqueta: "Material", valor: item.nombreMaterial },
  ];
  for (const v of item.configuracion.variables ?? []) {
    rows.push({
      etiqueta: v.etiqueta,
      valor: v.unidad ? `${v.valor} ${v.unidad}` : String(v.valor),
    });
  }
  return rows;
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
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>({});

  const handlePrevImage = (itemId: string, maxLen: number) => {
    setActiveIndexes((prev) => {
      const current = prev[itemId] ?? 0;
      const nextIdx = current === 0 ? maxLen - 1 : current - 1;
      return { ...prev, [itemId]: nextIdx };
    });
  };

  const handleNextImage = (itemId: string, maxLen: number) => {
    setActiveIndexes((prev) => {
      const current = prev[itemId] ?? 0;
      const nextIdx = current === maxLen - 1 ? 0 : current + 1;
      return { ...prev, [itemId]: nextIdx };
    });
  };

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
        <Button asChild variant="primary" section="storefront" size="md">
          <Link href="/tienda">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  const subtotal = getSubtotal(items);
  const visibleServices = relatedServices.slice(carouselStart, carouselStart + CAROUSEL_VISIBLE);

  return (
    <div>
      {/* Announcement banner */}
      <div className="bg-black min-h-[48px] flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-[42px] py-2">
        <p className="text-[#fffcfc] text-[16.742px] font-medium text-center">
          Noticias importantes de ofertas, por ejemplo: 30% de descuento en carteles 3D | Termina el
          10 de abril | <span className="underline cursor-pointer">Comprar ahora</span>
        </p>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-[42px] py-[24px] md:py-[40px]">
        <h1 className="font-bold text-[28px] md:text-[36px] text-[#1e1e1e] mb-[24px] md:mb-[32px]">
          Mi carrito
        </h1>

        <div className="flex flex-col lg:flex-row gap-[24px] lg:gap-[40px] items-stretch lg:items-start">
          {/* ── Left: Cart items ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="h-px bg-[#c2c0c0]" />

            {items.map((item) => {
              const especificaciones = getEspecificaciones(item);
              const specsOpen = openSpecs.has(item.id);
              const activeImgIdx = activeIndexes[item.id] ?? 0;
              const hasImages = !!(item.imagenUrls && item.imagenUrls.length > 0);
              const activeImageUrl = hasImages ? item.imagenUrls![activeImgIdx] : null;

              return (
                <div key={item.id}>
                  <div className="py-[24px] flex flex-col md:flex-row gap-[16px] md:gap-[24px]">
                    {/* Preview + edit links */}
                    <div className="flex flex-col items-center gap-[12px] shrink-0 w-[240px]">
                      <div className="relative group w-[180px] h-[180px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex items-center justify-center transition-all duration-300 hover:shadow-[0px_12px_32px_rgba(0,0,0,0.12)]">
                        {activeImageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeImageUrl}
                              alt={item.nombreServicio}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Overlay Left Arrow */}
                            {item.imagenUrls!.length > 1 && (
                              <button
                                onClick={() => handlePrevImage(item.id, item.imagenUrls!.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-[32px] h-[32px] bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90 hover:scale-105"
                                aria-label="Imagen anterior"
                              >
                                <ChevronLeft />
                              </button>
                            )}
                            {/* Overlay Right Arrow */}
                            {item.imagenUrls!.length > 1 && (
                              <button
                                onClick={() => handleNextImage(item.id, item.imagenUrls!.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-[32px] h-[32px] bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90 hover:scale-105"
                                aria-label="Imagen siguiente"
                              >
                                <ChevronRight />
                              </button>
                            )}
                            {/* Dots Indicator */}
                            {item.imagenUrls!.length > 1 && (
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-black/45 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                {item.imagenUrls!.map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                      idx === activeImgIdx ? "bg-white w-3" : "bg-white/50"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <span className="text-[11px] font-bold text-[#8b434a] bg-[#ffd9e2] px-2 py-0.5 rounded-full">
                              Sin imagen
                            </span>
                            <p className="text-[13px] text-[#999] leading-snug">
                              Vista previa
                              <br />
                              del servicio
                            </p>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/tienda/servicios/${item.servicioId}`}
                        className="text-[14px] font-semibold text-[#8b434a] hover:text-[#7a3a41] hover:underline transition-colors text-center"
                      >
                        Ver servicio
                      </Link>
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-[12px]">
                      <p className="font-bold text-[18px] text-[#1e1e1e]">{item.nombreServicio}</p>

                      <div className="flex items-center gap-[16px] flex-wrap">
                        <div className="flex items-center border border-[#8e908f] rounded-[10px] h-[49px] w-[167px] px-[12px] gap-[4px]">
                          <span className="text-[18px] text-[#1e1e1e] whitespace-nowrap">
                            Cantidad:
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="^[0-9]+$"
                            min={1}
                            max={CANTIDAD_MAX}
                            value={item.cantidad}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                // ignore empty input, keep current quantity
                                return;
                              }
                              if (!/^\d+$/.test(raw)) return;
                              const val = Number(raw);
                              const next = Math.floor(val);
                              if (next > CANTIDAD_MAX) return;
                              handleCantidad(item.id, next);
                            }}
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

                      {specsOpen && especificaciones.length > 0 && (
                        <div className="flex flex-col gap-[4px]">
                          {especificaciones.map((s, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-[18px] text-[#1e1e1e]"
                            >
                              <span>{s.etiqueta}</span>
                              <span>{s.valor}</span>
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
          <div className="border border-[#8e908f] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] w-full lg:w-[523px] lg:shrink-0 p-[20px] md:p-[32px] flex flex-col gap-[16px]">
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

            <Button
              asChild
              variant="primary"
              section="storefront"
              size="lg"
              className="w-full shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
            >
              <Link href="/tienda/cotizacion/checkout">Solicitar cotización</Link>
            </Button>
          </div>
        </div>

        {/* ── Más productos parecidos ── */}
        {relatedServices.length > 0 && (
          <div className="mt-[48px]">
            <h2 className="font-bold text-[22px] md:text-[28px] text-[#1e1e1e] mb-[16px] md:mb-[24px]">
              Más productos parecidos
            </h2>

            {/* Mobile: render the full related list with horizontal scroll
                (chevrons are inert on touch, and a sliced window would
                hide everything past page 1 — see PR #85 Copilot review). */}
            <div className="md:hidden flex gap-[16px] overflow-x-auto -mx-4 px-4 pb-2">
              {relatedServices.map((s) => (
                <Link
                  key={s.id_servicio}
                  href={`/tienda/servicios/${s.id_servicio}`}
                  className="bg-[#ffd9e2] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] shrink-0 w-[200px] h-[160px] flex items-end p-[12px] hover:scale-[1.02] transition-transform"
                >
                  <p className="font-bold text-[16.742px] text-[#1e1e1e]">{s.nombre_servicio}</p>
                </Link>
              ))}
            </div>

            {/* Desktop: paginated window with chevron controls. */}
            <div className="hidden md:flex items-center gap-[12px]">
              <button
                onClick={() => setCarouselStart((p) => Math.max(0, p - 1))}
                disabled={carouselStart === 0}
                className="bg-[#ebebeb] rounded-[8px] shadow-[0px_3px_8px_0px_rgba(0,0,0,0.25)] w-[50px] h-[50px] flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft />
              </button>

              <div className="flex gap-[16px] flex-1 min-w-0">
                {visibleServices.map((s) => (
                  <Link
                    key={s.id_servicio}
                    href={`/tienda/servicios/${s.id_servicio}`}
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
