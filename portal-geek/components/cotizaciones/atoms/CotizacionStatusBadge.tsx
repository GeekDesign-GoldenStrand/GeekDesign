export default function CotizacionStatusBadge({ status }: { status: string }) {
    const statusColors: Record<string, string> = {
        "Pendiente": "border-[#ec94ff] bg-[#f7b9ff]/[0.66] text-[#d012ff]",
        "Validada": "border-[#22BDFF] bg-[#B9EAFF]/[0.66] text-[#0D7794]",
        "Rechazada": "border-[#FF3030] bg-[#FFA5A5]/[0.66] text-[#C90000]",
        "Aprobada": "border-[#85FF6D] bg-[#CCFFA5]/[0.66] text-[#26AF00]",
        "Cancelada": "border-gray-500 bg-[#B1B1B1]/[0.66] text-black",
    };

    const badgeColor = statusColors[status] || "bg-gray-100 text-gray-800";

    return (
        <span
        className={` ${badgeColor}
        inline-flex items-center justify-center
        h-[33px] w-[96px] rounded-[10px]
        border font-['IBM_Plex_Sans_JP',sans-serif]
        font-sans font-medium text-[16px]
        whitespace-nowrap`}
        >
        {status}
        </span>
    );
}