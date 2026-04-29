import Link from "next/link";

interface ServiceCatalogCardProps {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export function ServiceCatalogCard({ id, nombre, descripcion }: ServiceCatalogCardProps) {
  return (
    <Link href={`/servicios/${id}`} className="block group">
      <div className="relative rounded-[10px] overflow-hidden">
        {/* Image */}
        <div className="w-full aspect-[368/176] bg-[#ffd9e2] overflow-hidden rounded-t-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]">
          <div className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
        </div>

        {/* Info bar — overlaps bottom of image */}
        <div className="-mt-[20px] relative z-10 bg-[#8b434a] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] px-[17px] py-3 h-[85px] flex flex-col justify-center group-hover:bg-[#7a3a41] transition-colors duration-200">
          <p className="font-bold text-[18px] md:text-[25px] text-[#fffcfc] leading-tight truncate">
            {nombre}
          </p>
          <p className="text-[13px] md:text-[15px] text-[#fffcfc] leading-snug line-clamp-2">
            {descripcion || "Descripción"}
          </p>
        </div>
      </div>
    </Link>
  );
}
