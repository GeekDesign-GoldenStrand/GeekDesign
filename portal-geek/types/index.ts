// Shared TypeScript types across the application

export type UserRole = "Direccion" | "Administrador" | "Colaborador" | "Finanzas";

export type OrderStatus =
  | "Cotizacion"
  | "Pagado"
  | "En_cola"
  | "Aprobacion_diseno"
  | "En_produccion"
  | "Entregado"
  | "Facturado";

export type QuotationStatus = "En_revision" | "Validada" | "Aprobada" | "Rechazada";

export type PaymentMethod = "efectivo" | "transferencia" | "mercadopago";
