import type { ActorTipo, CategoriaCliente, EstatusCotizacion } from "@/types/cotizacion";

export const STATUS_COLORS: Record<EstatusCotizacion, string> = {
  Pendiente: "bg-[#F7B9FF]/70 text-[#D83CFF]",
  Validada: "bg-[#B9EAFF] text-[#0D7794]",
  Rechazada: "bg-[#FFA5A5]/60 text-[#FF3030]",
  Aprobada: "bg-[#CCFFA5]/60 text-[#26AF00]",
  Cancelada: "bg-[#B1B1B1] text-black",
};

export const CLIENT_CATEGORY_COLORS: Record<NonNullable<CategoriaCliente>, string> = {
  Black: "bg-black text-white",
  Silver: "text-[#1e1e1e] bg-[#e0e0e0]/60",
  Gold: "text-yellow-700 bg-[#f4d966]/60",
  Emprendedor: "text-lime-700 bg-[#acf466]/60",
  Baneado: "text-[#ffffff] bg-[#ff0000]/60",
};

export const USERS: Record<ActorTipo, string> = {
  Cliente: "bg-blue-50 text-blue-700",
  Direccion: "bg-amber-50 text-amber-700",
};
