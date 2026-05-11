// Client-side shapes for the pedido detail payload returned by
// GET /api/pedidos/[id]. Decimals and Dates from Prisma are serialized to
// strings over JSON, which is why these differ from PedidoDetail in
// lib/services/pedidos.ts.

export type DetallePedido = {
  id_detalle: number;
  cantidad: number;
  ancho_cm: string | null;
  alto_cm: string | null;
  grosor_cm: string | null;
  color: string | null;
  precio_unitario: string;
  subtotal: string;
  opciones_seleccionadas: unknown;
  notas: string | null;
  responsable_recoleccion: string;
  servicio: { nombre_servicio: string };
  material: { nombre_material: string };
  archivo: { url_archivo: string; nombre_archivo: string };
};

export type Pago = {
  id_pago: number;
  fecha: string;
  monto_pago: string;
  metodo_pago: string;
  estatus_pago: string;
  referencia_mercadopago: string | null;
};

export type HistorialEntry = {
  id_historial: number;
  fecha_cambio: string;
  id_estatus_pedido: string | null;
  estadoAnterior: { descripcion: string } | null;
  estadoNuevo: { descripcion: string };
  usuario: { nombre_completo: string };
};

export type PedidoDetailData = {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada: string | null;
  fecha_fin: string | null;
  factura: boolean;
  facturado: boolean;
  numero_factura: string | null;
  notas: string | null;
  cliente: {
    nombre_cliente: string;
    correo_electronico: string;
    numero_telefono: string;
    empresa: string | null;
    rfc: string | null;
  };
  estatus: { descripcion: string };
  sucursal: { nombre_sucursal: string } | null;
  detalles: DetallePedido[];
  pagos: Pago[];
  historial: HistorialEntry[];
};
