import Link from "next/link";

import { Button } from "@/components/ui/atoms/Button";

export interface CotizacionTipoOptionProps {
  /** Bold heading, e.g. "No sé lo que quiero". */
  titulo: string;
  /** Secondary copy under the heading. */
  descripcion?: string;
  /** Primary button label, e.g. "Aquí te guiamos". */
  ctaLabel: string;
  /** Route the button redirects to (the corresponding solicitud form). */
  href: string;
  /**
   * Image cell on the left (default) or right. Drives the zig-zag layout.
   * On mobile the image always renders first regardless of this prop.
   */
  imageSide?: "left" | "right";
}

/**
 * One option block in the "¿No sabes qué quieres?" hub (ST-10/11/12).
 *
 * A two-column band: an image placeholder beside a centered text + CTA.
 * `imageSide` flips the desktop order to produce the alternating zig-zag;
 * on mobile the cells stack image-first for a consistent vertical rhythm.
 */
export function CotizacionTipoOption({
  titulo,
  descripcion = "Descripción",
  ctaLabel,
  href,
  imageSide = "left",
}: CotizacionTipoOptionProps) {
  const imageRight = imageSide === "right";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
      {/* Image placeholder — #ffd9e2 is the storefront's image-pending tint. */}
      <div
        aria-hidden
        className={`bg-[#ffd9e2] aspect-square md:aspect-auto md:min-h-[340px] w-full ${
          imageRight ? "md:order-2" : ""
        }`}
      />

      <div
        className={`flex flex-col items-center justify-center text-center gap-4 md:gap-5 px-6 py-10 md:py-8 ${
          imageRight ? "md:order-1" : ""
        }`}
      >
        <h3 className="font-bold text-[26px] md:text-[30px] text-[#1e1e1e] leading-tight">
          {titulo}
        </h3>
        <p className="text-[15px] md:text-[17px] text-[#575757]">{descripcion}</p>
        <Button
          asChild
          variant="primary"
          section="storefront"
          size="lg"
          className="w-full max-w-[260px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
        >
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
