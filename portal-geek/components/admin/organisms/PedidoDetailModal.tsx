"use client";

import { CircleNotchIcon, FilePdfIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import { formatDate } from "@/lib/utils/date";
import type { UserRole } from "@/types";

// Mirrors PedidoDetalleResponse from lib/services/pedidos.ts.
// Decimal/Date values arrive serialized as strings over the network.
interface PedidoDetalle {
  pedido: {
    id_pedido: number;
    fecha_creacion: string;
    fecha_estimada?: string | null;
    fecha_fin?: string | null;
    factura: boolean;
    facturado: boolean;
    numero_factura?: string | null;
    notas?: string | null;
    estatus: { descripcion: string };
    estado_factura?: { descripcion: string } | null;
    sucursal?: { nombre_sucursal?: string | null } | null;
    cliente: {
      nombre_cliente: string;
      empresa?: string | null;
      correo_electronico: string;
      numero_telefono: string;
      rfc?: string | null;
    };
  };
  detalle: {
    id_detalle: number;
    id_servicio: number;
    cantidad: number;
    ancho_cm?: string | null;
    alto_cm?: string | null;
    grosor_cm?: string | null;
    color?: string | null;
    precio_unitario: string;
    subtotal: string;
    responsable_recoleccion: string;
    notas?: string | null;
    opciones_seleccionadas: unknown;
    servicio: { nombre_servicio: string };
    material: { nombre_material: string };
    archivo: { nombre_archivo: string; url_archivo: string; formato: string };
  }[];
  pagos: {
    id_pago: number;
    fecha: string;
    monto_pago: string;
    metodo_pago: string;
    estatus_pago: string;
    referencia_mercadopago?: string | null;
  }[];
  historial: {
    fecha_cambio: string;
    estatus_anterior: string | null;
    estatus_nuevo: string;
    cambiado_por: string;
  }[];
}

/** Shape of each entry in the ordenes_generadas array from the API. */
interface OrdenGenerada {
  nombre: string;
  tipo: "proveedor" | "instalador";
  total: number;
  pdf_base64: string;
}

interface Props {
  // Always a valid id: the parent renders this modal with key={pedidoId}
  // only while a detail is open, so each order gets a fresh mount.
  pedidoId: number;
  onClose: () => void;
  // When a service tab is active, only that service's line items are shown.
  selectedServiceId?: number | null;
  /** The authenticated user's role — controls whether the OC button is shown. */
  role?: UserRole;
}

function money(value: string | number | null | undefined) {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-0.5">
        {label}
      </p>
      <p className="text-[14px] text-[#1e1e1e]">{value ?? "—"}</p>
    </div>
  );
}

/** Decode a base-64 PDF string into a Blob and trigger a browser download. */
function downloadBase64Pdf(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  triggerDownload(blob, filename);
}

/** Create an object-URL from a Blob, click it, then revoke it. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PedidoDetailModal({ pedidoId, onClose, selectedServiceId, role }: Props) {
  const [data, setData] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Generar Orden de Compra Interna" state
  const [ocLoading, setOcLoading] = useState(false);
  const [ocError, setOcError] = useState<string | null>(null);
  /** Populated only when the API returns multiple terceros (JSON response). */
  const [ordenes, setOrdenes] = useState<OrdenGenerada[]>([]);

  // Only Dirección (including legacy Administrador alias) and Colaborador may generate OCs.
  const canGenerateOC = role === "Direccion" || role === "Administrador" || role === "Colaborador";

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/pedidos/${pedidoId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo cargar el pedido");
        return json.data as PedidoDetalle;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pedidoId]);

  async function handleGenerarOC() {
    setOcLoading(true);
    setOcError(null);
    setOrdenes([]);

    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/orden-compra-interna`, {
        method: "POST",
      });

      const contentType = res.headers.get("Content-Type") ?? "";

      if (!res.ok) {
        let apiError = "";
        try {
          const json = await res.json();
          apiError = json.error ?? "";
        } catch {
          // Ignore JSON parsing errors — we'll show a generic message below.
        }

        if (res.status === 400) {
          setOcError(
            apiError || "No se encontraron terceros vinculados a los servicios de este pedido"
          );
        } else if (res.status === 404) {
          setOcError("Pedido no encontrado");
        } else {
          setOcError(apiError || "Error al generar la orden de compra");
        }
        return;
      }

      if (contentType.includes("application/pdf")) {
        const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
        triggerDownload(blob, `OC-${pedidoId}.pdf`);
      } else if (contentType.includes("application/json")) {
        const json = await res.json();
        const generadas: OrdenGenerada[] = json.ordenes_generadas ?? [];
        if (generadas.length === 0) {
          setOcError("No se encontraron terceros vinculados a los servicios de este pedido");
        } else {
          setOrdenes(generadas);
        }
      } else {
        setOcError("Error al generar la orden de compra");
      }
    } catch {
      setOcError("Error al generar la orden de compra");
    } finally {
      setOcLoading(false);
    }
  }

  const ocButton = canGenerateOC ? (
    <button
      onClick={handleGenerarOC}
      disabled={ocLoading || loading}
      title="Generar Orden de Compra Interna"
      className="
        inline-flex items-center gap-1.5
        h-8 px-3
        rounded-[6px]
        border border-[#c6c6c6]
        bg-white
        text-[#575757] text-[12px] font-semibold
        hover:border-[#8e908f] hover:text-[#1e1e1e]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      {ocLoading ? (
        <CircleNotchIcon size={14} className="animate-spin" aria-hidden />
      ) : (
        <FilePdfIcon size={14} aria-hidden />
      )}
      {ocLoading ? "Generando…" : "Generar OC"}
    </button>
  ) : null;

  return (
    <ModalShell
      title={`Detalle del pedido #${pedidoId}`}
      onClose={onClose}
      headerActions={ocButton}
    >
      {loading && <p className="text-[14px] text-[#8e908f] py-6 text-center">Cargando…</p>}

      {error && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {error}
        </div>
      )}

      {data &&
        (() => {
          // When a service tab is active, show only that service's line items
          // and hide the order-level sections (the full order lives in the
          // "Todos" view). Otherwise show the complete order detail.
          const serviceView = selectedServiceId != null;

          const detalle = serviceView
            ? data.detalle.filter((d) => d.id_servicio === selectedServiceId)
            : data.detalle;

          return (
            <div className="flex flex-col gap-6">
              {/* General */}
              {!serviceView && (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">General</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Estatus" value={data.pedido.estatus.descripcion} />
                    <Field
                      label="Estado factura"
                      value={data.pedido.estado_factura?.descripcion ?? "Sin facturar"}
                    />
                    <Field
                      label="Fecha de creación"
                      value={formatDate(data.pedido.fecha_creacion)}
                    />
                    <Field
                      label="Fecha estimada"
                      value={
                        data.pedido.fecha_estimada ? formatDate(data.pedido.fecha_estimada) : "—"
                      }
                    />
                    <Field
                      label="Fecha de finalización"
                      value={data.pedido.fecha_fin ? formatDate(data.pedido.fecha_fin) : "—"}
                    />
                    <Field label="Sucursal" value={data.pedido.sucursal?.nombre_sucursal ?? "—"} />
                    <Field label="Requiere factura" value={data.pedido.factura ? "Sí" : "No"} />
                    <Field
                      label="Número de factura"
                      value={
                        data.pedido.numero_factura ?? (data.pedido.facturado ? "—" : "No facturado")
                      }
                    />
                  </div>
                  {data.pedido.notas && (
                    <div className="mt-3">
                      <Field label="Notas" value={data.pedido.notas} />
                    </div>
                  )}
                </section>
              )}

              {/* Cliente */}
              {!serviceView && (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombre" value={data.pedido.cliente.nombre_cliente} />
                    <Field label="Empresa" value={data.pedido.cliente.empresa ?? "—"} />
                    <Field label="Correo" value={data.pedido.cliente.correo_electronico} />
                    <Field label="Teléfono" value={data.pedido.cliente.numero_telefono} />
                    <Field label="RFC" value={data.pedido.cliente.rfc ?? "—"} />
                  </div>
                </section>
              )}

              {/* Detalle del pedido */}
              <section>
                <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">
                  Productos ({detalle.length})
                </h3>
                <div className="space-y-3">
                  {detalle.length === 0 && (
                    <p className="text-[13px] text-[#8e908f]">
                      {serviceView
                        ? "Este pedido no tiene productos para el servicio seleccionado."
                        : "Este pedido no tiene productos."}
                    </p>
                  )}
                  {detalle.map((d) => (
                    <div
                      key={d.id_detalle}
                      className="rounded-[8px] border border-[#f0f0f0] bg-[#fcfcfc] p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[14px] font-semibold text-[#1e1e1e]">
                          {d.servicio.nombre_servicio}
                        </p>
                        <p className="text-[14px] font-bold text-[#1e1e1e]">{money(d.subtotal)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Material" value={d.material.nombre_material} />
                        <Field label="Cantidad" value={d.cantidad} />
                        <Field
                          label="Medidas (cm)"
                          value={
                            d.ancho_cm || d.alto_cm || d.grosor_cm
                              ? `${d.ancho_cm ?? "—"} × ${d.alto_cm ?? "—"} × ${d.grosor_cm ?? "—"}`
                              : "—"
                          }
                        />
                        <Field label="Color" value={d.color ?? "—"} />
                        <Field label="Precio unitario" value={money(d.precio_unitario)} />
                        <Field label="Responsable recolección" value={d.responsable_recoleccion} />
                        <Field
                          label="Archivo de diseño"
                          value={
                            <a
                              href={d.archivo.url_archivo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#e42200] hover:underline break-all"
                            >
                              {d.archivo.nombre_archivo}
                            </a>
                          }
                        />
                      </div>
                      {d.notas && (
                        <div className="mt-2">
                          <Field label="Notas" value={d.notas} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Pagos */}
              {!serviceView && (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">
                    Pagos ({data.pagos.length})
                  </h3>
                  {data.pagos.length === 0 ? (
                    <p className="text-[13px] text-[#8e908f]">Sin pagos registrados.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.pagos.map((p) => (
                        <div
                          key={p.id_pago}
                          className="flex justify-between items-center text-[13px] border-b border-[#f0f0f0] pb-2"
                        >
                          <span className="text-[#575757]">
                            {formatDate(p.fecha)} · {p.metodo_pago} · {p.estatus_pago}
                          </span>
                          <span className="font-semibold text-[#1e1e1e]">
                            {money(p.monto_pago)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Historial de estados */}
              {!serviceView && (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">
                    Historial de estados
                  </h3>
                  {data.historial.length === 0 ? (
                    <p className="text-[13px] text-[#8e908f]">Sin cambios de estado registrados.</p>
                  ) : (
                    <ol className="space-y-2">
                      {data.historial.map((h, i) => (
                        <li key={i} className="text-[13px] text-[#575757]">
                          <span className="text-[#8e908f]">{formatDate(h.fecha_cambio)}</span> —{" "}
                          {h.estatus_anterior ? `${h.estatus_anterior} → ` : ""}
                          <span className="font-semibold text-[#1e1e1e]">
                            {h.estatus_nuevo}
                          </span>{" "}
                          <span className="text-[#8e908f]">por {h.cambiado_por}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

              {/* ── Órdenes de Compra Interna generadas (múltiples terceros) ── */}
              {canGenerateOC && (ocError || ordenes.length > 0) && (
                <section>
                  <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">
                    Órdenes de Compra Interna
                  </h3>

                  {/* Inline error */}
                  {ocError && (
                    <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
                      {ocError}
                    </div>
                  )}

                  {/* List of generated orders when there are multiple terceros */}
                  {ordenes.length > 0 && (
                    <div className="space-y-2">
                      {ordenes.map((orden, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-[8px] border border-[#f0f0f0] bg-[#fcfcfc] px-4 py-3"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#1e1e1e]">
                              {orden.nombre}
                            </p>
                            <p className="text-[12px] text-[#8e908f] capitalize">
                              {orden.tipo} · {money(orden.total)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              downloadBase64Pdf(
                                orden.pdf_base64,
                                `OC-${pedidoId}-${orden.nombre.replace(/\s+/g, "-")}.pdf`
                              )
                            }
                            title={`Descargar OC de ${orden.nombre}`}
                            className="
                              inline-flex items-center gap-1.5
                              h-8 px-3
                              rounded-[6px]
                              border border-[#c6c6c6]
                              bg-white
                              text-[#575757] text-[12px] font-semibold
                              hover:border-[#8e908f] hover:text-[#1e1e1e]
                              transition-colors
                            "
                          >
                            <DownloadSimpleIcon size={14} aria-hidden />
                            Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          );
        })()}
    </ModalShell>
  );
}
