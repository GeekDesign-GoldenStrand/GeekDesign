export default function CotizacionStatusBadge({ status }: { status: string }) {
  let badgeColor: string;

  switch (status) {
    case "En_revision":
      badgeColor = "border-[#ec94ff] bg-[#f7b9ff]/[0.66] text-[#d012ff]";
      break;
    case "Validada":
      badgeColor = "border-[#22BDFF] bg-[#B9EAFF]/[0.66] text-[#0D7794]";
      break;
    case "Rechazada":
      badgeColor = "border-[#FF3030] bg-[#FFA5A5]/[0.66] text-[#C90000]";
      break;
    case "Aprobada":
      badgeColor = "border-[#85FF6D] bg-[#CCFFA5]/[0.66] text-[#26AF00]";
      break;
    case "Cancelada":
      badgeColor = "border-gray-500 bg-[#B1B1B1]/[0.66] text-black";
      break;
    default:
      badgeColor = "border-gray-300 bg-gray-100 text-gray-500";
      break;
  }

  const statusNames: Record<string, string> = {
    En_revision: "En revisión",
    Validada: "Validada",
    Rechazada: "Rechazada",
    Aprobada: "Aprobada",
    Cancelada: "Cancelada",
  };

  const statusText = statusNames[status] || "Desconocido";

  return (
    <span
      className={` ${badgeColor}
        inline-flex items-center justify-center
        h-[33px] w-[96px] rounded-[10px]
        border font-['IBM_Plex_Sans_JP',sans-serif]
        font-sans font-medium text-[16px]
        whitespace-nowrap`}
    >
      {statusText}
    </span>
  );
}
