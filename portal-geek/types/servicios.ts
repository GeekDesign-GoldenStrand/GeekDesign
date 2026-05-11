import type { ConstanteDraft } from "@/components/admin/servicios/molecules/ConstantesSection";
import type { VariableDraft } from "@/components/admin/servicios/molecules/VariablesSection";

export const AUTO_INSTALADOR_NAME = "costo_instalador";
export const AUTO_PROVEEDOR_NAME = "costo_proveedor";

export type MaquinaVinculada = {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
};

export type ServicioListadoItem = {
  id_servicio: number;
  nombre_servicio: string;
  descripcion_servicio: string | null;
  estatus_servicio: boolean;
  fecha_modificacion: string;
  maquinas: Array<{ maquina: MaquinaVinculada }>;
  sucursal: {
    id_sucursal: number;
    nombre_sucursal: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

// ─── Types for the service creation page ───────────────

// "Sucursal" availability for linking to the service.
export type SucursalOption = {
  id_sucursal: number;
  nombre_sucursal: string;
};

// "Máquina" availability for linking to the service.
export type MaquinaOption = {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
  tipo: string;
};

// "Instalador" availability for linking to the service.
export type InstaladorOption = {
  id_instalador: number;
  nombre_proveedor: string;
  apodo: string | null;
  costo_instalacion: string;
};

// "Proveedor" availability for linking to the service.
export type ProveedorOption = {
  id_proveedor: number;
  nombre_proveedor: string;
  costo: string | null;
};

// "Tipo de variable" availability for linking to the service.
export type TipoVariableOption = {
  id_tipo_variable: number;
  nombre_tipo: string;
  unidad_default: string | null;
};

// ─── Form state types for service creation ────────────

export type NuevoServicioFormState = {
  nombre_servicio: string;
  descripcion_servicio: string;
  id_sucursal: number | null;
  id_maquinas: number[];
  id_instalador: number | null;
  costo_instalador_override: number | null;
  id_proveedor: number | null;
  costo_proveedor_override: number | null;
  formulaEnabled: boolean;
  expresion: string;
  variables: VariableDraft[];
  constantes: ConstanteDraft[];
};

export const initialNuevoServicioState: NuevoServicioFormState = {
  nombre_servicio: "",
  descripcion_servicio: "",
  id_sucursal: null,
  id_maquinas: [],
  id_instalador: null,
  costo_instalador_override: null,
  id_proveedor: null,
  costo_proveedor_override: null,
  formulaEnabled: false,
  expresion: "",
  variables: [],
  constantes: [],
};
