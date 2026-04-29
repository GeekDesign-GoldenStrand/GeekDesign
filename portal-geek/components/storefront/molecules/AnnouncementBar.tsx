import Link from "next/link";

interface AnnouncementBarProps {
  mensaje?: string;
  linkTexto?: string;
  linkHref?: string;
}

export function AnnouncementBar({
  mensaje = "Noticias importantes de ofertas, por ejemplo: 30% de descuento en carteles 3D | Termina el 10 de abril |",
  linkTexto = "Comprar ahora",
  linkHref = "/storefront",
}: AnnouncementBarProps) {
  return (
    <div className="w-full min-h-[48px] md:h-[67px] bg-black flex items-center justify-center gap-1 px-4 py-2 md:py-0">
      <p className="text-[#fffcfc] text-[13px] md:text-[16.742px] font-medium leading-normal text-center line-clamp-2 md:whitespace-nowrap md:line-clamp-none">
        {mensaje}
      </p>
      <Link
        href={linkHref}
        className="text-[#fffcfc] text-[13px] md:text-[16.742px] font-medium underline [text-decoration-skip-ink:none] decoration-solid whitespace-nowrap shrink-0"
      >
        {linkTexto}
      </Link>
    </div>
  );
}
