import { CotizacionTipoOption } from "@/components/storefront/molecules/CotizacionTipoOption";

interface HubOption {
  titulo: string;
  ctaLabel: string;
  href: string;
  imageSide: "left" | "right";
}

// The three solicitud entry points (ST-10/11/12). Each redirects to its
// solicitud form — filling those forms is ST-13/14/15 (not built yet).
const OPTIONS: HubOption[] = [
  {
    titulo: "No sé lo que quiero",
    ctaLabel: "Aquí te guiamos",
    href: "/tienda/cotizacion/idea-nula", // ST-10
    imageSide: "left",
  },
  {
    titulo: "Tengo una idea",
    ctaLabel: "Aquí lo hacemos realidad",
    href: "/tienda/cotizacion/idea-vaga", // ST-11
    imageSide: "right",
  },
  {
    titulo: "Quiero algo específico",
    ctaLabel: "Aquí lo creamos",
    href: "/tienda/cotizacion/personalizada", // ST-12
    imageSide: "left",
  },
];

/**
 * "¿No sabes qué quieres?" section — the ST-10/11/12 selection options,
 * rendered inline on the storefront home (/tienda). Composes the option
 * molecules into the alternating zig-zag layout from the storefront design.
 */
export function CotizacionTipoHub() {
  return (
    <section className="bg-[#fff8f9] pb-10 md:pb-16">
      <h1 className="font-bold text-[22px] md:text-[30px] text-[#1e1e1e] text-center py-8 md:py-10 px-4">
        ¿No sabes qué quieres?
      </h1>

      <div className="flex flex-col">
        {OPTIONS.map((option) => (
          <CotizacionTipoOption key={option.href} {...option} />
        ))}
      </div>
    </section>
  );
}
