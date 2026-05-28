"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { DesignFileLink } from "@/components/admin/molecules/DesignFileLink";
import { formatDate } from "@/lib/utils/date";

import DeliveryDateTrafficLight from "../atoms/DeliveryDateTrafficLight";

type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  folio: string | null;
  estatus: string;
  fecha_estimada: string | null;
  archivos: { id: number; nombre: string }[];
};

type Props = {
  cotizaciones: Cotizacion[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
};

function getStatusStyle(status: string) {
  switch (status) {
    case "Pendiente":
      return "bg-[#F7B9FF]/70 text-[#D83CFF]";
    case "Validada":
      return "bg-[#B9EAFF] text-[#0D7794]";
    case "Rechazada":
      return "bg-[#FFA5A5]/60 text-[#FF3030]";
    case "Aprobada":
      return "bg-[#CCFFA5]/60 text-[#26AF00]";
    case "Cancelada":
      return "bg-[#B1B1B1] text-black";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getAllowedQuotationStatuses(currentStatus: string): string[] {
  switch (currentStatus) {
    case "Pendiente":
      return ["Pendiente", "Validada", "Rechazada"];
    default:
      return [currentStatus];
  }
}

export function CotizacionesTable({ cotizaciones, onStatusChange }: Props) {
  const router = useRouter();

  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron cotizaciones.</div>
    );
  }

  const goToDetail = (id: number) => router.push(`/cotizaciones/${id}`);

  return (
    <div className="bg-transparent md:bg-white rounded">
      <div className="space-y-4 md:space-y-2">
        {/* Header - Desktop Only */}
        <div
          className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.6fr" }}
        >
          <span className="whitespace-nowrap">Fecha</span>
          <span className="whitespace-nowrap">Monto</span>
          <span className="whitespace-nowrap">Entrega</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">Cliente</span>
          <span className="whitespace-nowrap">Folio</span>
          <span className="whitespace-nowrap">Estatus</span>
          <span className="whitespace-nowrap disabled hidden">Acciones</span>
        </div>

        {/* Rows */}
        {cotizaciones.map((c) => (
          <div key={c.id_cotizacion}>
            {/* Desktop Row — entire row opens the cotización detail */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => goToDetail(c.id_cotizacion)}
              onKeyDown={(e) => {
                // Ignore keys bubbling from inner controls (status select, links).
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToDetail(c.id_cotizacion);
                }
              }}
              aria-label={`Ver detalle de la cotización ${c.folio ?? c.id_cotizacion}`}
              className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.6fr" }}
            >
              <span className="whitespace-nowrap">
                {c.fecha_creacion ? formatDate(c.fecha_creacion) : "—"}
              </span>
              <span className="whitespace-nowrap">
                ${c.monto_total.toLocaleString("es-MX")} MXN
              </span>
              <span className="whitespace-nowrap">
                {c.fecha_estimada ? formatDate(c.fecha_estimada) : "—"}
              </span>
              <span className="truncate px-2 min-w-0">{c.empresa || "—"}</span>
              <span className="truncate px-2 min-w-0">{c.cliente}</span>
              <span className="whitespace-nowrap">{c.folio ?? "—"}</span>
              <div className="flex justify-center">
                <div
                  className={`relative flex items-center rounded-full ${getStatusStyle(c.estatus)}`}
                >
                  <select
                    value={c.estatus}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onStatusChange(c.id_cotizacion, e.target.value)}
                    className="pl-4 pr-8 py-1 rounded-full text-sm font-medium outline-none cursor-pointer appearance-none bg-transparent whitespace-nowrap"
                  >
                    {getAllowedQuotationStatuses(c.estatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>
              <div
                className="flex justify-center items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <DesignFileLink
                  archivos={c.archivos}
                  className="text-[#8b434a] hover:text-[#7a3a41] transition-colors p-2 relative"
                />
              </div>
            </div>

            {/* Mobile Card — whole card opens the cotización detail */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => goToDetail(c.id_cotizacion)}
              onKeyDown={(e) => {
                // Ignore keys bubbling from inner controls (status select, links).
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToDetail(c.id_cotizacion);
                }
              }}
              aria-label={`Ver detalle de la cotización ${c.folio ?? c.id_cotizacion}`}
              className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-4 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                    Folio
                  </p>
                  <p className="text-[16px] font-bold text-[#1e1e1e]">
                    #{c.folio ?? c.id_cotizacion}
                  </p>
                </div>
                <div
                  className={`relative flex items-center rounded-full ${getStatusStyle(c.estatus)}`}
                >
                  <select
                    value={c.estatus}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onStatusChange(c.id_cotizacion, e.target.value)}
                    className="pl-3 pr-7 py-1 rounded-full text-[11px] font-bold outline-none appearance-none bg-transparent"
                  >
                    {getAllowedQuotationStatuses(c.estatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F5F5F5]">
                <div>
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                    Cliente
                  </p>
                  <p className="text-[13px] font-medium text-[#1e1e1e]">{c.cliente}</p>
                  <p className="text-[11px] text-[#8e908f]">{c.empresa || "Sin empresa"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                    Monto
                  </p>
                  <p className="text-[13px] font-bold text-[#1e1e1e]">
                    ${c.monto_total.toLocaleString("es-MX")}
                    <DeliveryDateTrafficLight deliveryDate={c.fecha_estimada || null} />
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">Fecha</p>
                    <p className="text-[11px] font-medium text-[#575757]">
                      {c.fecha_creacion ? formatDate(c.fecha_creacion) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">Entrega</p>
                    <p className="text-[11px] font-medium text-[#575757]">
                      {c.fecha_estimada ? formatDate(c.fecha_estimada) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <DesignFileLink
                    archivos={c.archivos}
                    className="h-10 w-10 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
