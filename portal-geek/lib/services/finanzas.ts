import { prisma } from "@/lib/db/client";

export type PedidoParaFacturar = {
  id_pedido: number;
  fecha_creacion: Date;
  facturado: boolean;
  numero_factura: string | null;
  estado_factura: { descripcion: string } | null;
  cliente: {
    nombre_cliente: string;
    empresa: string | null;
  };
  cotizaciones: { folio: string | null; estatus: { descripcion: string } | null }[];
  datos_facturacion: {
    rfc: string;
    razon_social: string;
    tipo_persona: string;
    regimen_fiscal: string;
    uso_cfdi: string;
    codigo_postal_fiscal: string;
    correo_facturacion: string | null;
  } | null;
};

export type PedidoFacturacionDetalle = PedidoParaFacturar;

export async function getPedidoFacturacion(id: number): Promise<PedidoFacturacionDetalle | null> {
  return prisma.pedidos.findUnique({
    where: { id_pedido: id, factura: true },
    select: {
      id_pedido: true,
      fecha_creacion: true,
      facturado: true,
      numero_factura: true,
      estado_factura: { select: { descripcion: true } },
      cliente: {
        select: { nombre_cliente: true, empresa: true },
      },
      cotizaciones: {
        select: {
          folio: true,
          estatus: { select: { descripcion: true } },
        },
        orderBy: { id_cotizacion: "desc" },
        take: 1,
      },
      datos_facturacion: {
        select: {
          rfc: true,
          razon_social: true,
          tipo_persona: true,
          regimen_fiscal: true,
          uso_cfdi: true,
          codigo_postal_fiscal: true,
          correo_facturacion: true,
        },
      },
    },
  });
}

export async function getPedidosParaFacturar(): Promise<PedidoParaFacturar[]> {
  return prisma.pedidos.findMany({
    where: { factura: true },
    orderBy: { fecha_creacion: "desc" },
    select: {
      id_pedido: true,
      fecha_creacion: true,
      facturado: true,
      numero_factura: true,
      estado_factura: { select: { descripcion: true } },
      cliente: {
        select: { nombre_cliente: true, empresa: true },
      },
      cotizaciones: {
        select: {
          folio: true,
          estatus: { select: { descripcion: true } },
        },
        orderBy: { id_cotizacion: "desc" },
        take: 1,
      },
      datos_facturacion: {
        select: {
          rfc: true,
          razon_social: true,
          tipo_persona: true,
          regimen_fiscal: true,
          uso_cfdi: true,
          codigo_postal_fiscal: true,
          correo_facturacion: true,
        },
      },
    },
  });
}
