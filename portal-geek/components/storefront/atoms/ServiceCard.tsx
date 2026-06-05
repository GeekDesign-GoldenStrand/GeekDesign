interface ServiceCardProps {
  nombre_servicio: string;
  imagenUrl?: string | null;
}

export function ServiceCard({ nombre_servicio, imagenUrl }: ServiceCardProps) {
  return (
    <div className="w-full flex flex-col items-center cursor-pointer group">
      {/* Card image — fills container width, square via aspect-ratio */}
      <div className="w-full aspect-square rounded-[10px] overflow-hidden group-hover:scale-[1.03] active:scale-[0.99] transition-all duration-200">
        {imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenUrl} alt={nombre_servicio} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#ffd9e2]" />
        )}
      </div>

      {/* Name below card */}
      <p className="mt-[8px] w-full text-[12px] md:text-[14px] font-medium text-[#1e1e1e] text-center leading-tight line-clamp-2 group-hover:text-[#df2646] transition-colors duration-200">
        {nombre_servicio}
      </p>
    </div>
  );
}
