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

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type TerceroRole = "Instalador" | "Proveedor";

export type TerceroStatus = "Activo" | "Inactivo" | "Baneado";

export type TercerosTab = "Todos" | "Proveedores" | "Instaladores";

export interface TerceroCardProps {
  id: number;
  companyName: string;
  contactName: string;
  location: string;
  role: TerceroRole;
  status: TerceroStatus;
  email: string;
  phone: string;
  tipo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: TerceroStatus) => void;
}

export interface MaterialCardProps {
  id: number;
  name: string;
  unit: string;
  color: string;
  width: string;
  height: string;
  thickness: string;
  description: string;
  imageUrl: string;
}

export type MaterialSortOrder = "az" | "za";

export interface MaterialesVisibleColumns {
  name: boolean;
  description: boolean;
  unit: boolean;
  width: boolean;
  height: boolean;
  thickness: boolean;
  color: boolean;
  image: boolean;
}
export interface QuotationItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  precio_anterior: number;
  precio_nuevo: number | null;
  motivo: string | null;
  detalles_cliente: string;
  cambio?: string;
}
export interface SucursalInfo {
  nombre: string;
  direccion: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
}

export interface DirectionContact {
  nombre: string;
  email: string;
  telefono: string;
}

export interface QuotationFullContext {
  id: string;
  fecha_validacion: string;
  currency: string;
  sucursal: SucursalInfo;
  contacto_direccion: DirectionContact;
  servicios: QuotationItem[];
  resumen: {
    subtotal: number;
    iva: number;
    total: number;
  };
  terminos: string;
}
