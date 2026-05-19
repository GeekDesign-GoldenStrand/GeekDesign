"use client";

import { useEffect, useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import { formatDate } from "@/lib/utils/date";

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

interface Props {
  // Always a valid id: the parent renders this modal with key={pedidoId}
  // only while a detail is open, so each order gets a fresh mount.
  pedidoId: number;
  onClose: () => void;
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

export default function PedidoDetailModal({ pedidoId, onClose }: Props) {
  const [data, setData] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ModalShell title={`Detalle del pedido #${pedidoId}`} onClose={onClose}>
      {loading && <p className="text-[14px] text-[#8e908f] py-6 text-center">Cargando…</p>}

      {error && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {error}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6">
          {/* General */}
          <section>
            <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">General</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estatus" value={data.pedido.estatus.descripcion} />
              <Field
                label="Estado factura"
                value={data.pedido.estado_factura?.descripcion ?? "Sin facturar"}
              />
              <Field label="Fecha de creación" value={formatDate(data.pedido.fecha_creacion)} />
              <Field
                label="Fecha estimada"
                value={data.pedido.fecha_estimada ? formatDate(data.pedido.fecha_estimada) : "—"}
              />
              <Field
                label="Fecha de finalización"
                value={data.pedido.fecha_fin ? formatDate(data.pedido.fecha_fin) : "—"}
              />
              <Field label="Sucursal" value={data.pedido.sucursal?.nombre_sucursal ?? "—"} />
              <Field label="Requiere factura" value={data.pedido.factura ? "Sí" : "No"} />
              <Field
                label="Número de factura"
                value={data.pedido.numero_factura ?? (data.pedido.facturado ? "—" : "No facturado")}
              />
            </div>
            {data.pedido.notas && (
              <div className="mt-3">
                <Field label="Notas" value={data.pedido.notas} />
              </div>
            )}
          </section>

          {/* Cliente */}
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

          {/* Detalle del pedido */}
          <section>
            <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">
              Productos ({data.detalle.length})
            </h3>
            <div className="space-y-3">
              {data.detalle.map((d) => (
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
                    <span className="font-semibold text-[#1e1e1e]">{money(p.monto_pago)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial de estados */}
          <section>
            <h3 className="text-[15px] font-semibold text-[#1e1e1e] mb-3">Historial de estados</h3>
            {data.historial.length === 0 ? (
              <p className="text-[13px] text-[#8e908f]">Sin cambios de estado registrados.</p>
            ) : (
              <ol className="space-y-2">
                {data.historial.map((h, i) => (
                  <li key={i} className="text-[13px] text-[#575757]">
                    <span className="text-[#8e908f]">{formatDate(h.fecha_cambio)}</span> —{" "}
                    {h.estatus_anterior ? `${h.estatus_anterior} → ` : ""}
                    <span className="font-semibold text-[#1e1e1e]">{h.estatus_nuevo}</span>{" "}
                    <span className="text-[#8e908f]">por {h.cambiado_por}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </ModalShell>
  );
}
