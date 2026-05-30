"use client";

import {
  CheckCircle,
  XCircle,
  Info,
  WarningCircle,
  Clock,
  DownloadSimple,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { ConfirmDialog } from "@/components/ui/atoms/ConfirmDialog";
import { useToast } from "@/components/ui/atoms/Toast";

import { FolioSearch } from "./FolioSearch";

interface Item {
  id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  precio_anterior: number;
  estado: string;
  descripcion: string;
}

interface Quotation {
  id_cotizacion: number;
  folio: string | null;
  monto_total: number;
  fecha_creacion: string;
  notas: string | null;
  estatus: string;
  cliente: {
    nombre_cliente: string;
    empresa: string | null;
  };
  items: Item[];
  // ST-16: pedido production status, shown once the cotización is Aprobada.
  pedido?: {
    id_pedido: number;
    estatus: string;
    estado_factura: string | null;
  } | null;
}

// ST-16: map raw EstadoFacturaPedido.descripcion → user-friendly Spanish label.
// The DB uses snake_case-ish codes (e.g. "Aprobacion_diseno"); cliente sees the label.
const ESTADO_FACTURA_LABEL: Record<string, string> = {
  Cotizacion: "Cotización",
  Pagado: "Pagado",
  En_cola: "En cola de producción",
  Aprobacion_diseno: "Aprobación de diseño",
  En_produccion: "En producción",
  Entregado: "Entregado",
  Facturado: "Facturado",
};

// Order of factura states post-approval; used to compute the "next step" hint.
const FACTURA_FLOW: string[] = [
  "Aprobacion_diseno",
  "En_cola",
  "En_produccion",
  "Entregado",
  "Facturado",
];

function getEstadoFacturaLabel(raw: string | null | undefined): string {
  if (!raw) return "Sin estado";
  return ESTADO_FACTURA_LABEL[raw] ?? raw;
}

function getSiguientePasoFactura(actual: string | null | undefined): string | null {
  if (!actual) return null;
  const idx = FACTURA_FLOW.indexOf(actual);
  if (idx === -1 || idx === FACTURA_FLOW.length - 1) return null;
  return ESTADO_FACTURA_LABEL[FACTURA_FLOW[idx + 1]] ?? FACTURA_FLOW[idx + 1];
}

interface Props {
  quotation: Quotation;
}

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function QuotationDetailView({ quotation }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // KIKW12 review #1b: no client-side email/cookie reading. The HTTP-only
  // cotizacion_session cookie set by the magic-link consume handler is
  // automatically sent with these requests; the server verifies it matches
  // this cotización.

  const confirmApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotation.id_cotizacion}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("¡Cotización aprobada con éxito!", {
          description: "Tu pedido está en camino.",
        });
        router.push("/tienda");
      } else {
        const error = await res.json();
        toast.error(error.error || "Hubo un error al aprobar la cotización.");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      setShowApproveConfirm(false);
    }
  };

  const handleApprove = () => setShowApproveConfirm(true);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotation.id_cotizacion}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        toast.success("Cotización cancelada", {
          description: "Gracias por tu tiempo.",
        });
        router.push("/tienda");
      } else {
        const error = await res.json();
        toast.error(error.error || "Hubo un error al cancelar la cotización.");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  };

  const totalAnterior = quotation.items.reduce(
    (acc, item) => acc + (item.precio_anterior || item.precio_total),
    0
  );
  const totalNuevo =
    quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
      ? 0
      : quotation.items.reduce((acc, item) => {
          if (item.estado === "rechazado") return acc;
          return acc + item.precio_total;
        }, 0);

  const diferencia = totalNuevo - totalAnterior;
  const porcentajeDiferencia = totalAnterior > 0 ? (diferencia / totalAnterior) * 100 : 0;

  const isActionable = quotation.estatus === "Validada";

  const counts = {
    aprobados:
      quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
        ? 0
        : quotation.items.filter((i) => i.estado === "sin_cambios").length,
    modificados:
      quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
        ? 0
        : quotation.items.filter((i) => i.estado === "modificado").length,
    rechazados:
      quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
        ? quotation.items.length
        : quotation.items.filter((i) => i.estado === "rechazado").length,
  };

  // Banner configuration. buttonColor was removed — the Button atom now owns
  // active vs disabled styling via its `disabled` prop. The banner button is
  // disabled iff the status is Pendiente (see `disabled={...}` below).
  const bannerConfig = {
    Pendiente: {
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: <Clock size={28} weight="bold" />,
      title: "Tu cotización está en revisión",
      desc: "Estamos analizando tu solicitud para verificar si requiere algún cambio técnico o comercial antes de su aprobación final.",
      nextStep: "Espera nuestra validación. Te avisaremos pronto.",
      buttonText: "Revisión en curso",
    },
    Validada:
      counts.modificados > 0
        ? {
            bgColor: "bg-[#FFF9F0]",
            iconColor: "text-[#F16C20]",
            icon: <WarningCircle size={28} weight="bold" />,
            title: "Tu cotización fue modificada",
            desc: "Algunos servicios cambiaron de precio. Revisa los cambios antes de confirmar.",
            nextStep: "Revisa los cambios y confirma para comenzar.",
            buttonText: "Revisar y confirmar cambios",
          }
        : {
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            icon: <CheckCircle size={28} weight="bold" />,
            title: "Tu cotización está lista",
            desc: "Todos los servicios han sido validados y están listos para ser procesados.",
            nextStep: "Confirma tu pedido para iniciar con el proyecto.",
            buttonText: "Aceptar cotización y continuar",
          },
    Rechazada: {
      bgColor: "bg-wine-soft",
      iconColor: "text-wine",
      icon: <XCircle size={28} weight="bold" />,
      title: "Tu cotización no pudo ser procesada",
      desc: "Lo sentimos, algunos servicios no están disponibles por el momento.",
      nextStep: "Solicita una aclaración para buscar una alternativa.",
      buttonText: "Finalizar y seguir comprando",
    },
    Cancelada: {
      bgColor: "bg-gray-50",
      iconColor: "text-gray-500",
      icon: <XCircle size={28} weight="bold" />,
      title: "Cotización cancelada",
      desc: "Esta cotización ha sido cancelada por el cliente.",
      nextStep: "Puedes solicitar una nueva cotización si lo deseas.",
      buttonText: "Volver al inicio",
    },
    Aprobada: {
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      icon: <CheckCircle size={28} weight="bold" />,
      title: "Tu cotización fue aprobada",
      desc: "¡Felicidades! Tu pedido ya está en proceso de producción.",
      nextStep: "Puedes consultar el estatus en Mis Pedidos.",
      buttonText: "Ver mi pedido",
    },
  }[quotation.estatus] || {
    bgColor: "bg-gray-50",
    iconColor: "text-gray-600",
    icon: <Info size={28} weight="bold" />,
    title: `Estado: ${quotation.estatus}`,
    desc: "Consulta los detalles a continuación.",
    nextStep: "No hay acciones pendientes.",
    buttonText: "Sin acción disponible",
  };

  const creationDate = new Date(quotation.fecha_creacion);
  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });

  const steps = [
    { label: "Solicitud enviada", date: formatDate(creationDate), completed: true },
    {
      label: quotation.estatus === "Pendiente" ? "Revisión en curso" : "Validación Geek",
      date:
        quotation.estatus === "Pendiente"
          ? "Hoy"
          : formatDate(new Date(creationDate.getTime() + 86400000)),
      completed: quotation.estatus !== "Pendiente",
      current: quotation.estatus === "Pendiente",
    },
    {
      label:
        quotation.estatus === "Rechazada"
          ? "No disponible"
          : counts.modificados > 0
            ? "En revisión"
            : "Lista para aceptar",
      date:
        quotation.estatus === "Validada" ||
        quotation.estatus === "Rechazada" ||
        quotation.estatus === "Cancelada"
          ? "Hoy"
          : "Pendiente",
      completed: quotation.estatus === "Aprobada",
      current:
        quotation.estatus === "Validada" ||
        quotation.estatus === "Rechazada" ||
        quotation.estatus === "Cancelada",
    },
    {
      label:
        quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
          ? "Finalizado"
          : "Confirmada",
      date: quotation.estatus === "Aprobada" ? "Hoy" : "Pendiente",
      completed: quotation.estatus === "Aprobada",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-[1240px] mx-auto py-10 px-4 space-y-12"
    >
      {/* Folio and Date */}
      <div>
        <h2 className="text-[24px] font-bold text-[#1e1e1e]">
          Cotización #{quotation.folio || quotation.id_cotizacion}
        </h2>
        <p className="text-[#8e908f] text-[16px] font-medium">
          Solicitada el{" "}
          {new Date(quotation.fecha_creacion).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          -{" "}
          {new Date(quotation.fecha_creacion).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-[16px] border border-line-soft shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 p-6 md:p-10 flex items-center gap-8">
          <div
            className={`w-14 h-14 rounded-full ${bannerConfig.bgColor} flex items-center justify-center shrink-0 ${bannerConfig.iconColor}`}
          >
            {bannerConfig.icon}
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-[#1e1e1e] mb-1">{bannerConfig.title}</h2>
            <p className="text-[17px] text-[#575757] font-medium">{bannerConfig.desc}</p>
          </div>
        </div>
        <div className="bg-[#f9f9f9] p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-line-soft md:min-w-[340px]">
          <p className="text-[12px] font-bold text-[#1e1e1e] mb-2 uppercase tracking-[1.2px]">
            Paso siguiente:
          </p>
          <p className="text-[15px] text-[#575757] font-medium mb-6">{bannerConfig.nextStep}</p>
          {quotation.estatus !== "Aprobada" && (
            <Button
              variant="primary"
              section="storefront"
              size="md"
              onClick={
                quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
                  ? () => router.push("/tienda")
                  : handleApprove
              }
              disabled={
                (!isActionable &&
                  quotation.estatus !== "Rechazada" &&
                  quotation.estatus !== "Cancelada") ||
                loading
              }
              loading={loading}
            >
              {bannerConfig.buttonText}
            </Button>
          )}
          {/* ST-19: download approved cotización as PDF. */}
          {quotation.estatus === "Aprobada" && quotation.folio && (
            <Button asChild variant="primary" section="storefront" size="md">
              <a
                href={`/api/storefront/cotizaciones/${encodeURIComponent(quotation.folio)}/pdf`}
                download={`${quotation.folio}.pdf`}
              >
                <DownloadSimple size={20} weight="bold" />
                Descargar PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ST-16: Pedido production status (only visible once Aprobada) */}
      {quotation.estatus === "Aprobada" && quotation.pedido && (
        <div className="bg-white rounded-[16px] border border-line-soft shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-wine-soft flex items-center justify-center text-wine shrink-0">
            <Clock size={28} weight="bold" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[1.2px] mb-1">
              Tu pedido
            </p>
            <h3 className="text-[20px] font-bold text-[#1e1e1e]">
              {quotation.folio ?? `#${quotation.pedido.id_pedido}`} —{" "}
              <span className="text-wine">
                {getEstadoFacturaLabel(quotation.pedido.estado_factura)}
              </span>
            </h3>
            {getSiguientePasoFactura(quotation.pedido.estado_factura) && (
              <p className="text-[14px] text-[#575757] font-medium mt-1">
                Siguiente:{" "}
                <span className="font-bold text-[#1e1e1e]">
                  {getSiguientePasoFactura(quotation.pedido.estado_factura)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 max-w-4xl mx-auto">
        {steps.map((p, i) => (
          <div key={i} className="flex flex-col items-center text-center space-y-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold ${
                p.completed
                  ? "bg-wine text-white"
                  : p.current
                    ? "bg-white border-2 border-[#F16C20] text-[#F16C20]"
                    : "bg-white border border-line-soft text-[#B9B8B8]"
              }`}
            >
              {p.completed ? <CheckCircle size={20} weight="bold" /> : i + 1}
            </div>
            <div>
              <p
                className={`text-[13px] font-bold ${p.completed || p.current ? "text-[#1e1e1e]" : "text-[#B9B8B8]"}`}
              >
                {p.label}
              </p>
              <p className="text-[11px] font-medium text-[#B9B8B8] mt-0.5">{p.date}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[16px] border border-line-soft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#F0F0F0]">
              <h3 className="text-[18px] font-bold text-[#1e1e1e]">Servicios incluidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left hidden md:table">
                <thead className="bg-[#fcfcfc] border-b border-[#F0F0F0]">
                  {quotation.estatus === "Pendiente" ? (
                    <tr className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px]">
                      <th className="px-8 py-4">Servicio</th>
                      <th className="px-4 py-4 text-center">Precio Solicitado</th>
                    </tr>
                  ) : (
                    <tr className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px]">
                      <th className="px-8 py-4">Servicio</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-4 py-4 text-center">P. Unitario</th>
                      <th className="px-4 py-4 text-center">Cant.</th>
                      <th className="px-4 py-4 text-center">Antes</th>
                      <th className="px-4 py-4 text-center">Total</th>
                      <th className="px-4 py-4 text-center">Cambio</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {quotation.items.length > 0 ? (
                    quotation.items.map((item) => (
                      <Fragment key={item.id}>
                        <tr className="text-[14px] text-[#1e1e1e]">
                          <td className="px-8 py-6 align-top">
                            <p className="font-bold">{item.nombre}</p>
                            <p className="text-[12px] text-[#8e908f] font-medium mt-1">
                              {item.descripcion}
                            </p>
                          </td>

                          {quotation.estatus === "Pendiente" ? (
                            <>
                              <td className="px-4 py-6 text-center align-top font-bold">
                                {formatPeso(item.precio_total)}{" "}
                                <span className="text-[10px] font-medium">MXN</span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-6 align-top">
                                {item.estado === "sin_cambios" &&
                                  quotation.estatus !== "Rechazada" && (
                                    <div className="flex items-center gap-1.5 text-[#2A940D] font-bold text-[10px] uppercase tracking-[0.5px]">
                                      <CheckCircle size={14} weight="bold" />
                                      <span>Sin cambios</span>
                                    </div>
                                  )}
                                {item.estado === "modificado" &&
                                  quotation.estatus !== "Rechazada" && (
                                    <div className="flex items-center gap-1.5 text-[#F16C20] font-bold text-[10px] uppercase tracking-[0.5px]">
                                      <WarningCircle size={14} weight="bold" />
                                      <span>Modificado</span>
                                    </div>
                                  )}
                                {(item.estado === "rechazado" ||
                                  quotation.estatus === "Rechazada" ||
                                  quotation.estatus === "Cancelada") && (
                                  <div className="flex items-center gap-1.5 text-wine font-bold text-[10px] uppercase tracking-[0.5px]">
                                    <XCircle size={14} weight="bold" />
                                    <span>Rechazado</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-6 text-center align-top text-[#575757] font-medium">
                                {formatPeso(item.precio_unitario)}
                              </td>
                              <td className="px-4 py-6 text-center align-top font-bold">
                                {item.cantidad}
                              </td>
                              <td className="px-4 py-6 text-center align-top text-[#575757] font-medium">
                                {formatPeso(item.precio_anterior || item.precio_total)} <br />
                                <span className="text-[10px]">MXN</span>
                              </td>
                              <td className="px-4 py-6 text-center align-top font-bold">
                                {item.estado === "rechazado" ||
                                quotation.estatus === "Rechazada" ||
                                quotation.estatus === "Cancelada"
                                  ? "—"
                                  : formatPeso(item.precio_total)}{" "}
                                <br />
                                <span className="text-[10px] font-medium">
                                  {item.estado === "rechazado" ||
                                  quotation.estatus === "Rechazada" ||
                                  quotation.estatus === "Cancelada"
                                    ? ""
                                    : "MXN"}
                                </span>
                              </td>
                              <td className="px-4 py-6 text-center align-top">
                                {item.estado === "modificado" &&
                                quotation.estatus !== "Rechazada" ? (
                                  <span
                                    className={`font-bold text-[12px] ${item.precio_total > item.precio_anterior ? "text-[#F16C20]" : "text-[#2A940D]"}`}
                                  >
                                    {item.precio_total > item.precio_anterior ? "+" : ""}
                                    {(
                                      ((item.precio_total - item.precio_anterior) /
                                        item.precio_anterior) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-[#8e908f] font-medium">
                        No hay servicios registrados en esta cotización.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-[#F0F0F0]">
                {quotation.items.length > 0 ? (
                  quotation.items.map((item) => (
                    <div key={item.id} className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-[16px] text-[#1e1e1e]">{item.nombre}</p>
                          <p className="text-[13px] text-[#8e908f] font-medium mt-1">
                            {item.descripcion}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {item.estado === "sin_cambios" && quotation.estatus !== "Rechazada" && (
                            <div className="flex items-center gap-1.5 text-[#2A940D] font-bold text-[10px] uppercase tracking-[0.5px] bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle size={14} weight="bold" />
                              <span>Sin cambios</span>
                            </div>
                          )}
                          {item.estado === "modificado" && quotation.estatus !== "Rechazada" && (
                            <div className="flex items-center gap-1.5 text-[#F16C20] font-bold text-[10px] uppercase tracking-[0.5px] bg-[#FFF9F0] px-2 py-1 rounded-full">
                              <WarningCircle size={14} weight="bold" />
                              <span>Modificado</span>
                            </div>
                          )}
                          {(item.estado === "rechazado" ||
                            quotation.estatus === "Rechazada" ||
                            quotation.estatus === "Cancelada") && (
                            <div className="flex items-center gap-1.5 text-wine font-bold text-[10px] uppercase tracking-[0.5px] bg-wine-soft px-2 py-1 rounded-full">
                              <XCircle size={14} weight="bold" />
                              <span>Rechazado</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-[#F0F0F0]">
                        <div>
                          <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[0.5px] mb-1">
                            P. Unitario
                          </p>
                          <p className="text-[14px] font-bold text-[#1e1e1e]">
                            {formatPeso(item.precio_unitario)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[0.5px] mb-1">
                            Cantidad
                          </p>
                          <p className="text-[14px] font-bold text-[#1e1e1e]">{item.cantidad}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[0.5px] mb-1">
                            {quotation.estatus === "Pendiente"
                              ? "Total Solicitado"
                              : "Precio Anterior"}
                          </p>
                          <p
                            className={`text-[14px] font-medium ${quotation.estatus !== "Pendiente" && item.estado === "modificado" ? "text-[#8e908f] line-through" : "text-[#1e1e1e] font-bold"}`}
                          >
                            {formatPeso(item.precio_anterior || item.precio_total)}
                          </p>
                        </div>
                        <div className="text-right">
                          {quotation.estatus !== "Pendiente" && (
                            <>
                              <p className="text-[11px] font-bold text-[#8e908f] uppercase tracking-[0.5px] mb-1">
                                Nuevo Total
                              </p>
                              <p className="text-[16px] font-extrabold text-[#F16C20]">
                                {item.estado === "rechazado" ||
                                quotation.estatus === "Rechazada" ||
                                quotation.estatus === "Cancelada"
                                  ? "—"
                                  : formatPeso(item.precio_total)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {item.estado === "modificado" && quotation.estatus !== "Rechazada" && (
                        <div className="bg-[#FFF9F0] rounded-lg p-3 flex justify-between items-center">
                          <span className="text-[12px] font-bold text-[#F16C20]">
                            Cambio detectado
                          </span>
                          <span
                            className={`font-bold text-[14px] ${item.precio_total > item.precio_anterior ? "text-[#F16C20]" : "text-[#2A940D]"}`}
                          >
                            {item.precio_total > item.precio_anterior ? "+" : ""}
                            {(
                              ((item.precio_total - item.precio_anterior) / item.precio_anterior) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[#8e908f] font-medium">
                    No hay servicios registrados.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#F0F7FF] border border-[#D0E6FF] rounded-[16px] p-6 flex items-start gap-4">
            <Info size={24} className="text-[#0066CC] shrink-0 mt-0.5" />
            <p className="text-[14px] text-[#004C99] font-medium leading-relaxed">
              Al confirmar esta cotización, aceptas los cambios realizados en los servicios marcados
              como <span className="font-bold underline">modificados</span> y reconoces que los
              servicios <span className="font-bold underline text-wine">rechazados</span> no
              formarán parte del pedido final.
            </p>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1 sticky top-8">
          <div className="bg-white rounded-[24px] border border-line-soft p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <h3 className="text-[20px] font-bold text-[#1e1e1e] mb-8">Resumen de la cotización</h3>

            {quotation.estatus !== "Pendiente" && (
              <div className="space-y-5 mb-8">
                <div className="flex items-center justify-between text-[14px] font-medium">
                  <div className="flex items-center gap-3 text-[#2A940D]">
                    <CheckCircle size={20} weight="bold" />
                    <span>Servicios aprobados</span>
                  </div>
                  <span className="font-bold text-[#2A940D]">{counts.aprobados}</span>
                </div>
                <div className="flex items-center justify-between text-[14px] font-medium">
                  <div className="flex items-center gap-3 text-[#F16C20]">
                    <WarningCircle size={20} weight="bold" />
                    <span>Servicios modificados</span>
                  </div>
                  <span className="font-bold text-[#F16C20]">{counts.modificados}</span>
                </div>
                <div className="flex items-center justify-between text-[14px] font-medium">
                  <div className="flex items-center gap-3 text-wine">
                    <XCircle size={20} weight="bold" />
                    <span>Servicios rechazados</span>
                  </div>
                  <span className="font-bold text-wine">{counts.rechazados}</span>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-[#F0F0F0] space-y-6 mb-8">
              <div className="flex justify-between items-center text-[16px] font-medium">
                <span className="text-[#1e1e1e]">
                  {quotation.estatus === "Pendiente" ? "Total solicitado" : "Total anterior"}
                </span>
                <span
                  className={`${quotation.estatus !== "Pendiente" ? "text-[#575757] line-through" : "text-[24px] font-extrabold text-[#1e1e1e]"}`}
                >
                  {formatPeso(totalAnterior)} MXN
                </span>
              </div>
              {quotation.estatus !== "Pendiente" && (
                <div className="flex justify-between items-center">
                  <span className="text-[18px] font-bold text-[#1e1e1e]">Nuevo total</span>
                  <span className="text-[24px] font-extrabold text-[#F16C20]">
                    {formatPeso(totalNuevo)} MXN
                  </span>
                </div>
              )}
            </div>

            {(counts.modificados > 0 ||
              counts.rechazados > 0 ||
              quotation.estatus === "Rechazada" ||
              quotation.estatus === "Cancelada") && (
              <div
                className={`${diferencia < 0 ? "bg-wine-soft border-[#FFE8E8]" : "bg-[#FFF9F0] border-[#FFE9CC]"} border rounded-[12px] p-5 flex justify-between items-center mb-8`}
              >
                <span className="text-[14px] font-bold text-[#1e1e1e]">Diferencia</span>
                <span
                  className={`text-[14px] font-bold ${diferencia < 0 ? "text-wine" : "text-[#F16C20]"}`}
                >
                  {diferencia > 0 ? "+" : ""}
                  {formatPeso(diferencia)} MXN ({diferencia > 0 ? "+" : ""}
                  {porcentajeDiferencia.toFixed(1)}%)
                </span>
              </div>
            )}

            <div className="space-y-4">
              {quotation.estatus !== "Aprobada" && (
                <Button
                  variant="primary"
                  section="storefront"
                  size="lg"
                  className="w-full"
                  onClick={
                    quotation.estatus === "Rechazada" || quotation.estatus === "Cancelada"
                      ? () => router.push("/tienda")
                      : handleApprove
                  }
                  disabled={
                    (!isActionable &&
                      quotation.estatus !== "Rechazada" &&
                      quotation.estatus !== "Cancelada") ||
                    loading
                  }
                  loading={loading}
                >
                  {bannerConfig.buttonText}
                </Button>
              )}

              {/* ST-19: download approved cotización as PDF. */}
              {quotation.estatus === "Aprobada" && quotation.folio && (
                <Button asChild variant="primary" section="storefront" size="lg" className="w-full">
                  <a
                    href={`/api/storefront/cotizaciones/${encodeURIComponent(quotation.folio)}/pdf`}
                    download={`${quotation.folio}.pdf`}
                  >
                    <DownloadSimple size={20} weight="bold" />
                    Descargar PDF de mi cotización
                  </a>
                </Button>
              )}

              {isActionable && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle size={20} weight="bold" />
                  Cancelar cotización
                </Button>
              )}

              <Button asChild variant="secondary" size="lg" className="w-full">
                <a
                  href={`https://wa.me/524424468442?text=${encodeURIComponent(`Hola, tengo la cotización con el folio ${quotation.folio || quotation.id_cotizacion}, quisiera solicitar una aclaración.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar aclaración
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Search Section */}
      <div className="pt-8 border-t border-line-soft">
        <FolioSearch />
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full p-8 shadow-2xl scale-in-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6">
              <WarningCircle size={36} weight="bold" />
            </div>
            <h2 className="text-[26px] font-bold text-[#1e1e1e] mb-4">¿Cancelar cotización?</h2>
            <p className="text-[#575757] text-[17px] mb-8 leading-relaxed">
              Por favor, indícanos el motivo de la cancelación para ayudarnos a ofrecerte una mejor
              alternativa en el futuro.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej: El presupuesto es superior a lo esperado..."
              className="w-full h-[140px] border border-line-soft rounded-2xl p-5 mb-8 focus:ring-2 focus:ring-wine focus:border-transparent outline-none transition-all bg-white text-ink"
            />

            <div className="flex gap-4">
              <Button variant="destructive" size="lg" className="flex-1" onClick={handleCancel}>
                Confirmar cancelación
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showApproveConfirm}
        title="Confirmar aprobación"
        description="¿Estás seguro de que deseas aprobar esta cotización? Esto generará tu pedido oficialmente."
        confirmLabel="Aprobar cotización"
        loadingLabel="Aprobando…"
        variant="primary"
        section="storefront"
        loading={loading}
        onConfirm={confirmApprove}
        onClose={() => setShowApproveConfirm(false)}
      />
    </motion.div>
  );
}
