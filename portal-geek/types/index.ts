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

export type QuotationStatus = "Pendiente" | "Validada" | "Aprobada" | "Rechazada";

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

export type MachineStatus = "Activa" | "Inactiva" | "En mantenimiento";

export interface MaquinaCardProps {
  id: number;
  model: string;
  nickname: string;
  type: string;
  store: string;
  description?: string;
  services?: string[];
  creation_date: string;
  status: string;
  onDelete: () => void;
  onEdit: () => void;
  onAssignStore: () => void;
  onAssignServices: () => void;
  onChangeStatus?: (newStatus: string) => void;
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
  personas: boolean;
}
