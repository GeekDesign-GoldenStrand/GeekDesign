// Frontend type for a quotation entry
interface Cotizacion {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  estatus: string;
  fecha_estimada: string | null;
}

// Props define the data and callbacks passed into the table
interface Props {
  cotizaciones: Cotizacion[]; // list of quotations to display
  onDelete: (id: number) => void; // callback to delete a quotation, not implemented yet
  onStatusChange: (id: number, status: string) => void; // callback to update status, not implemented yet
}

export function CotizacionesTable({ cotizaciones, onDelete, onStatusChange }: Props) {
  // Empty state: show message if there are no quotations
  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">
        No se encontraron cotizaciones.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table header row */}
      <div
        className="grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
        style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
      >
        <span>Fecha</span>
        <span>Monto</span>
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Acciones</span>
      </div>

      {/* Table rows: render one per quotation */}
      {cotizaciones.map((c) => (
        <div
          key={c.id_cotizacion}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Basic fields */}
          <span>{new Date(c.fecha_creacion).toLocaleDateString()}</span>
          <span>${c.monto_total} MXN</span>
          <span>{c.fecha_estimada ?? "—"}</span>
          <span>{c.empresa ?? "—"}</span>
          <span>{c.cliente}</span>

          {/* Status dropdown: allows updating quotation status */}
          <select
            value={c.estatus}
            onChange={(e) => onStatusChange(c.id_cotizacion, e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="En_revision">En revisión</option>
            <option value="Validada">Validada</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </select>

          {/* Action buttons: edit and delete */}
          <div className="flex justify-center gap-2">
            <a href={`/admin/cotizaciones/${c.id_cotizacion}`} className="text-blue-600">
              Editar
            </a>
            <button onClick={() => onDelete(c.id_cotizacion)} className="text-red-600">
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
