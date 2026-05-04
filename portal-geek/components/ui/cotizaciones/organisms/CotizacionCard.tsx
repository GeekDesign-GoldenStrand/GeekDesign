import { NotePencilIcon } from "@phosphor-icons/react";

import { CircleDaysUntilDeliveryDate } from "@/components/admin/atoms/CircleDaysUntilDeliveryDate";
import { TotalAmountFormatter } from "@/components/admin/atoms/TotalAmountFormatter";
import { DateText } from "@/components/ui/atoms/DateText";
import CotizacionStatusBadge from "@/components/ui/cotizaciones/atoms/CotizacionStatusBadge";

function editPencilIcon() {
  return <NotePencilIcon size={32} className=" hover:text-[#e42200] transition-colors" />;
}

interface CotizacionCardProps {
  id_cotizacion: number;
  id_pedido: number;
  client_name: string;
  total: number;
  client_company: string;
  creation_date: string;
  estimated_delivery_date: string;
  estatus_description: string;
}

export default function CotizacionCard({
  id_cotizacion,
  id_pedido,
  client_name,
  total,
  client_company,
  creation_date,
  estimated_delivery_date,
  estatus_description,
}: CotizacionCardProps) {
  return (
    <tr className="bg-white outline outline-1 outline-gray-200 [border-radius:3px] shadow-md text-[16px] text-black font-ibm-plex rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-lg">
      <td className="px-4 py-3 rounded-tl-lg rounded-bl-lg">{DateText(creation_date)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <TotalAmountFormatter total_amount={total} />
          {CircleDaysUntilDeliveryDate(estimated_delivery_date)}
        </div>
      </td>
      <td className="px-4 py-3">{DateText(estimated_delivery_date)}</td>
      <td className="px-4 py-3">{client_company || "N/A"}</td>
      <td className="px-4 py-3">{client_name}</td>
      <td className="px-4 py-3">
        LASER-{id_pedido}
        {id_cotizacion}
      </td>
      <td className="px-4 py-3">
        <CotizacionStatusBadge status={estatus_description} />
      </td>
      <td className="px-4 py-3 rounded-tr-lg rounded-br-lg">{editPencilIcon()}</td>
    </tr>
  );
}
