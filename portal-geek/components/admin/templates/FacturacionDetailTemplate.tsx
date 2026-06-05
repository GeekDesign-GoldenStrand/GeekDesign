"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import type { PedidoFacturacionDetalle } from "@/lib/services/finanzas";

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(d));

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
    case "Facturado":
      return "bg-[#CCFFA5]/60 text-[#26AF00]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-[#8e908f] uppercase tracking-wide">{label}</span>
      <span className="text-[14px] text-[#1e1e1e]">{value || "—"}</span>
    </div>
  );
}

interface Props {
  pedido: PedidoFacturacionDetalle;
}

export function FacturacionDetailTemplate({ pedido }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cot = pedido.cotizaciones[0];
  const folio = cot?.folio ?? `#${pedido.id_pedido}`;
  const estatusCot = cot?.estatus?.descripcion ?? "—";
  const estadoFactura = pedido.estado_factura?.descripcion ?? "—";
  const df = pedido.datos_facturacion;
  const yaFacturado = pedido.facturado;

  async function handleMarcarFacturado() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/finanzas/pedidos/${pedido.id_pedido}/facturar`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("No se pudo actualizar el estatus");
      router.refresh();
    } catch {
      setError("Ocurrió un error al marcar como facturado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-200 mx-auto px-6 py-6 flex flex-col gap-6">
      <Link
        href="/finanzas"
        className="flex items-center gap-2 text-[13px] font-medium text-[#8e908f] hover:text-[#1e1e1e] transition-colors w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
          <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
        </svg>
        Volver a Finanzas
      </Link>

      {/* Pedido info */}
      <div className="bg-white rounded-[10px] border border-[#c2c0c0] p-6 flex flex-col gap-4">
        <h2 className="font-bold text-[16px] text-[#1e1e1e]">Información del pedido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Folio" value={folio} />
          <Field label="Fecha" value={fmt(pedido.fecha_creacion)} />
          <Field label="Cliente" value={pedido.cliente.nombre_cliente} />
          <Field label="Empresa" value={pedido.cliente.empresa} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8e908f] uppercase tracking-wide">
              Estatus cotización
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${getStatusStyle(estatusCot)}`}
            >
              {estatusCot}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8e908f] uppercase tracking-wide">
              Estatus factura
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${getStatusStyle(estadoFactura)}`}
            >
              {estadoFactura}
            </span>
          </div>
        </div>
      </div>

      {/* Datos fiscales */}
      <div className="bg-white rounded-[10px] border border-[#c2c0c0] p-6 flex flex-col gap-4">
        <h2 className="font-bold text-[16px] text-[#1e1e1e]">Datos de facturación</h2>
        {df ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Tipo de persona"
              value={df.tipo_persona === "Fisica" ? "Persona Física" : "Persona Moral"}
            />
            <Field label="RFC" value={df.rfc} />
            <Field label="Razón social" value={df.razon_social} />
            <Field label="Régimen fiscal" value={df.regimen_fiscal} />
            <Field label="Uso de CFDI" value={df.uso_cfdi} />
            <Field label="Código postal fiscal" value={df.codigo_postal_fiscal} />
            <Field label="Correo de facturación" value={df.correo_facturacion} />
          </div>
        ) : (
          <p className="text-[14px] text-[#8e908f]">
            Este pedido no tiene datos de facturación registrados.
          </p>
        )}
      </div>

      {/* Acción */}
      {!yaFacturado && (
        <div className="flex flex-col gap-2">
          {error && <p className="text-[13px] font-medium text-[#c14a4a]">{error}</p>}
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleMarcarFacturado}
            className="self-start"
          >
            Marcar como facturado
          </Button>
        </div>
      )}

      {yaFacturado && (
        <p className="text-[13px] font-semibold text-[#26AF00]">
          Este pedido ya fue marcado como facturado.
        </p>
      )}
    </div>
  );
}
