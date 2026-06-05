import { StatusTag } from "@/components/admin/atoms/StatusTag";

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura: string | null;
  horario_salida: string | null;
  estatus: string;
}

interface Props {
  sucursal: Sucursal;
  onEdit: (id: number) => void;
}

export function SucursalRow({ sucursal, onEdit }: Props) {
  return (
    <div
      className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 0.5fr" }}
    >
      <span>{sucursal.nombre_sucursal}</span>
      <span>{sucursal.direccion}</span>
      <span>{sucursal.horario_apertura ?? "—"}</span>
      <span>{sucursal.horario_salida ?? "—"}</span>
      <StatusTag status={sucursal.estatus} />
      <button
        onClick={() => onEdit(sucursal.id_sucursal)}
        className="text-blue-600 hover:text-blue-800"
      >
        ✏️
      </button>
    </div>
  );
}
