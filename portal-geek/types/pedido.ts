// Mirrors PedidoDetalleResponse from lib/services/pedidos.ts.
// All Date/Decimal values arrive serialized as strings over JSON.

export interface PedidoLineItem {
  id_detalle: number;
  id_servicio: number;
  cantidad: number;
  ancho_cm: string | null;
  alto_cm: string | null;
  grosor_cm: string | null;
  color: string | null;
  precio_unitario: string;
  subtotal: string;
  responsable_recoleccion: string;
  notas: string | null;
  servicio: { nombre_servicio: string };
  material: { nombre_material: string };
  archivo: { nombre_archivo: string; url_archivo: string; formato: string };
}

export interface PedidoPago {
  id_pago: number;
  fecha: string;
  monto_pago: string;
  metodo_pago: string;
  estatus_pago: string;
  referencia_mercadopago: string | null;
}

export interface PedidoHistorialEntry {
  fecha_cambio: string;
  estatus_anterior: string | null;
  estatus_nuevo: string;
  cambiado_por: string;
}

export interface PedidoInfo {
  id_pedido: number;
  id_sucursal: number | null;
  fecha_creacion: string;
  fecha_estimada: string | null;
  fecha_fin: string | null;
  factura: boolean;
  facturado: boolean;
  numero_factura: string | null;
  notas: string | null;
  nombre_oportunidad?: string | null;
  estatus: { descripcion: string };
  estado_factura: { descripcion: string } | null;
  sucursal: { nombre_sucursal: string | null } | null;
  cotizaciones?: { folio: string | null }[];
  cliente: {
    nombre_cliente: string;
    empresa: string | null;
    correo_electronico: string;
    numero_telefono: string;
    rfc: string | null;
  };
}

export interface Pedido {
  pedido: PedidoInfo;
  detalle: PedidoLineItem[];
  pagos: PedidoPago[];
  historial: PedidoHistorialEntry[];
  hasTerceros: boolean;
}

export interface OrdenGenerada {
  nombre: string;
  tipo: "proveedor" | "instalador";
  total: number;
  pdf_base64: string;
}
