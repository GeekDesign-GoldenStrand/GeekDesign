export type MaquinaVinculada = {
    id_maquina: number;
    nombre_maquina: string;
    apodo_maquina: string;
}

export type ServicioListadoItem = {
    id_servicio: number;
    nombre_servicio: string;
    descripcion_servicio: string | null;
    estatus_servicio: boolean;
    fecha_modificacion: string;
    maquinas: Array<{Maquina:MaquinaVinculada}>;
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};