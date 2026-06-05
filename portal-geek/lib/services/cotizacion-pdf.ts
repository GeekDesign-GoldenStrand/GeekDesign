// Pure mapping from the Prisma payload (cotización + relations) to the
// WorkOrderTemplate context shape used by the storefront PDF route.
// Extracted from app/api/storefront/cotizaciones/[folio]/pdf/route.tsx so
// it can be unit-tested without going through React-PDF rendering.

import type {
  ArchivosDisenio,
  Clientes,
  DetallePedido,
  Materiales,
  Pedidos,
  Servicios,
  Sucursales,
} from "@prisma/client";

import type { WorkOrderTemplate } from "@/components/pdf/templates/WorkOrderTemplate";

// Type the input as the exact shape this function consumes — any compatible
// Prisma payload with this include set is assignable.
// `string | null` for fields that Prisma marks as nullable, and a
// `{ toString(): string } | number` shape for Decimal columns because Prisma
// returns Decimal objects that serialize via .toString() — Number() handles both.
type Decimalish = { toString(): string } | number;

export type QuoteForPdf = {
  id_cotizacion: number;
  folio: string | null;
  monto_total: Decimalish;
  fecha_creacion: Date;
  fecha_validacion: Date | null;
  fecha_aprobacion: Date | null;
  cliente: {
    nombre_cliente: Clientes["nombre_cliente"];
    empresa: Clientes["empresa"];
    correo_electronico: Clientes["correo_electronico"];
    numero_telefono: Clientes["numero_telefono"];
  };
  pedido:
    | (Pick<Pedidos, "id_pedido"> & {
        sucursal: {
          nombre_sucursal: Sucursales["nombre_sucursal"];
          direccion: Sucursales["direccion"];
        } | null;
        detalles: Array<{
          notas: DetallePedido["notas"];
          cantidad: DetallePedido["cantidad"];
          precio_unitario: Decimalish;
          subtotal: Decimalish;
          servicio: { nombre_servicio: Servicios["nombre_servicio"] } | null;
          material: { nombre_material: Materiales["nombre_material"] } | null;
          archivo: { url_archivo: ArchivosDisenio["url_archivo"] } | null;
        }>;
      })
    | null;
};

// Default branch info used when a pedido has no sucursal linked.
export const DEFAULT_BRANCH = {
  nombre_sucursal: "Geek Design",
  direccion: "Av. Mediterráneo 236 B Fracc. Pirámides, Villa Corregidora, Querétaro",
};

// Map a fully-loaded cotización (the include set in the route handler) to the
// WorkOrderTemplate context. The template tolerates missing optional fields,
// but its specs need at least servicio + material.
export function buildWorkOrderContext(
  quote: QuoteForPdf
): Parameters<typeof WorkOrderTemplate>[0]["context"] {
  return {
    quotation: {
      id_cotizacion: quote.id_cotizacion,
      folio: quote.folio,
      monto_total: Number(quote.monto_total),
      fecha_creacion: quote.fecha_creacion,
      fecha_validacion: quote.fecha_validacion,
      fecha_aprobacion: quote.fecha_aprobacion,
    },
    client: {
      nombre_cliente: quote.cliente.nombre_cliente,
      empresa: quote.cliente.empresa,
      correo_electronico: quote.cliente.correo_electronico,
      numero_telefono: quote.cliente.numero_telefono,
    },
    specs: (quote.pedido?.detalles ?? []).map((d) => ({
      servicio: d.servicio ? { nombre_servicio: d.servicio.nombre_servicio } : null,
      material: d.material ? { nombre_material: d.material.nombre_material } : null,
      archivo: d.archivo ? { url_archivo: d.archivo.url_archivo } : null,
      notas: d.notas,
      cantidad: d.cantidad,
      precio_unitario: Number(d.precio_unitario),
      subtotal: Number(d.subtotal),
    })),
    branch: {
      nombre_sucursal: quote.pedido?.sucursal?.nombre_sucursal ?? DEFAULT_BRANCH.nombre_sucursal,
      direccion: quote.pedido?.sucursal?.direccion ?? DEFAULT_BRANCH.direccion,
    },
  };
}
