"use client";

type Sucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: string;
};

type Props = {
  sucursales: Sucursal[];
  onDelete: (id: number) => void;
};

export function SucursalesTable({ sucursales, onDelete }: Props) {
  if (sucursales.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron sucursales.</div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
        style={{
          gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr",
        }}
      >
        <span>Nombre</span>
        <span>Dirección</span>
        <span>Apertura</span>
        <span>Salida</span>
        <span>Estatus</span>
        <span>Acciones</span>
      </div>

      {sucursales.map((s) => (
        <div
          key={s.id_sucursal}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{
            gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr",
          }}
        >
          <span>{s.nombre_sucursal}</span>
          <span>{s.direccion}</span>

          <span>
            {s.horario_apertura ? new Date(s.horario_apertura).toLocaleTimeString("es-MX") : "—"}
          </span>

          <span>
            {s.horario_salida ? new Date(s.horario_salida).toLocaleTimeString("es-MX") : "—"}
          </span>

          {/* Estatus */}
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              s.estatus === "Activo" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
            }`}
          >
            {s.estatus}
          </span>

          {/* Acciones */}
          <div className="flex justify-center gap-2">
            <a href={`/admin/sucursales/${s.id_sucursal}`} className="text-blue-600">
              Editar
            </a>
            <button onClick={() => onDelete(s.id_sucursal)} className="text-red-600">
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
