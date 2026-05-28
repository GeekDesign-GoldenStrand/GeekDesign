import Link from "next/link";

import { Button } from "@/components/ui/atoms/Button";

export function CTABanner() {
  return (
    <section className="bg-[#fff8f9] flex flex-col items-center justify-center py-10 md:py-[60px] gap-5 md:gap-[26px]">
      <h2 className="font-bold text-[22px] md:text-[30px] text-[#1e1e1e] text-center leading-normal px-4">
        ¿No sabes qué quieres?
      </h2>
      <Button
        asChild
        variant="primary"
        section="storefront"
        size="lg"
        className="w-[241px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
      >
        <Link href="/tienda/cotizacion">Solicitar cotización</Link>
      </Button>
    </section>
  );
}
