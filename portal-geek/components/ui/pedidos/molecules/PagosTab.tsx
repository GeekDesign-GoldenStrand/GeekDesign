import { fmtDate, fmtMoney } from "@/components/ui/pedidos/format";
import type { Pago } from "@/components/ui/pedidos/types";

export function PagosTab({ pagos }: { pagos: Pago[] }) {
  if (pagos.length === 0) {
    return (
      <p className="py-12 text-center font-ibm-plex text-[14px] text-[#8e908f]">
        Sin pagos registrados.
      </p>
    );
  }
  const total = pagos.reduce((sum, p) => sum + parseFloat(p.monto_pago), 0);
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#e8e8e8]">
          {["Fecha", "Método", "Monto", "Estatus", "Referencia"].map((h) => (
            <th
              key={h}
              className={`pb-2 font-ibm-plex text-[12px] font-semibold text-[#8e908f] ${h === "Monto" ? "text-right" : "text-left"}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pagos.map((p) => (
          <tr key={p.id_pago} className="border-b border-[#f0f0f0]">
            <td className="py-2.5 font-ibm-plex text-[13px] text-[#555]">{fmtDate(p.fecha)}</td>
            <td className="py-2.5 font-ibm-plex text-[13px] text-[#1e1e1e]">{p.metodo_pago}</td>
            <td className="py-2.5 text-right font-ibm-plex text-[13px] font-medium text-[#1e1e1e]">
              {fmtMoney(p.monto_pago)}
            </td>
            <td className="py-2.5">
              <span
                className={`font-ibm-plex text-[12px] font-medium ${
                  p.estatus_pago === "Pagado"
                    ? "text-[#16a34a]"
                    : p.estatus_pago === "Reembolsado"
                      ? "text-[#e42200]"
                      : "text-[#d97706]"
                }`}
              >
                {p.estatus_pago}
              </span>
            </td>
            <td className="py-2.5 font-ibm-plex text-[12px] text-[#8e908f]">
              {p.referencia_mercadopago ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2} className="pt-4 font-ibm-plex text-[13px] font-semibold text-[#1e1e1e]">
            Total
          </td>
          <td className="pt-4 text-right font-ibm-plex text-[14px] font-semibold text-[#1e1e1e]">
            {fmtMoney(total)}
          </td>
          <td colSpan={2} />
        </tr>
      </tfoot>
    </table>
  );
}
