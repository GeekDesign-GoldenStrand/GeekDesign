// Frontend type for an order (pedido)
interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };
  estatus: {
    descripcion: string;
  };
  factura: boolean;
}

// Props define the data and callbacks passed into the table
interface Props {
  pedidos: Pedido[]; // list of orders to display
  onDelete: (id: number) => void; // callback to delete an order
  onStatusChange: (id: number, status: string) => void; // callback to update order status
}

export function PedidosTable({ pedidos, onDelete, onStatusChange }: Props) {
  // Empty state: show message if there are no orders
  if (pedidos.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">No se encontraron pedidos.</div>
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
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Factura</span>
        <span>Acciones</span>
      </div>

      {/* Table rows: render one per order */}
      {pedidos.map((p) => (
        <div
          key={p.id_pedido}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Basic fields */}
          <span>{new Date(p.fecha_creacion).toLocaleDateString()}</span>
          <span>{p.fecha_estimada ?? "—"}</span>
          <span>{p.cliente?.empresa ?? "—"}</span>
          <span>{p.cliente?.nombre_cliente}</span>

          {/* Status dropdown: allows updating order status */}
          <select
            value={p.estatus?.descripcion}
            onChange={(e) => onStatusChange(p.id_pedido, e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="Cotizacion">Cotización</option>
            <option value="Pagado">Pagado</option>
            <option value="En_cola">En cola</option>
            <option value="Aprobacion_diseno">Aprobación diseño</option>
            <option value="En_produccion">En producción</option>
            <option value="Entregado">Entregado</option>
            <option value="Facturado">Facturado</option>
          </select>

          {/* Invoice status */}
          <span>{p.factura ? "Sí" : "No"}</span>

          {/* Action buttons: edit and delete */}
          <div className="flex justify-center gap-2">
            <a href={`/admin/pedidos/${p.id_pedido}`} className="text-blue-600 hover:underline">
              Editar
            </a>
            <button onClick={() => onDelete(p.id_pedido)} className="text-red-600 hover:underline">
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
