import Link from "next/link";

interface HeroBannerProps {
  titulo?: string;
  botonTexto?: string;
  botonHref?: string;
}

export function HeroBanner({
  titulo = "Noticia o información de algo\n(Producto, Oferta, etc.)",
  botonTexto = "Botón a la noticia/producto",
  botonHref = "/storefront",
}: HeroBannerProps) {
  return (
    <section className="relative w-full h-[240px] sm:h-[300px] md:h-[373px] overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/storefront/hero-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Centred card */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="bg-[#fffcfc] w-full max-w-[857px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center gap-4 md:gap-[26px] px-6 md:px-8 py-6 md:py-0 md:h-[321px]">
          <p
            className="font-bold text-[22px] sm:text-[30px] md:text-[45px] text-[#1e1e1e] text-center leading-tight whitespace-pre-line"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {titulo}
          </p>
          <Link
            href={botonHref}
            className="bg-[#e42200] w-full max-w-[241px] h-[46px] md:h-[53px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center text-[#fffcfc] text-[15px] md:text-[16.742px] font-medium hover:brightness-95 transition"
          >
            {botonTexto}
          </Link>
        </div>
      </div>
    </section>
  );
}
