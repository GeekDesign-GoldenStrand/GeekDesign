import Link from "next/link";

export function CTABanner() {
  return (
    <section className="bg-[#fff8f9] flex flex-col items-center justify-center py-10 md:py-[60px] gap-5 md:gap-[26px]">
      <h2 className="font-bold text-[22px] md:text-[30px] text-[#1e1e1e] text-center leading-normal px-4">
        ¿No sabes qué quieres?
      </h2>
      <Link
        href="/cotizacion"
        className="bg-[#e42200] w-[241px] h-[53px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center text-[#fffcfc] text-[16.742px] font-medium hover:brightness-95 transition"
      >
        Solicitar cotización
      </Link>
    </section>
  );
}
