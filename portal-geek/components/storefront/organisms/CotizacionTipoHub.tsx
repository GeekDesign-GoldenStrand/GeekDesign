import { CotizacionTipoOption } from "@/components/storefront/molecules/CotizacionTipoOption";

interface HubOption {
  titulo: string;
  descripcion: string;
  ctaLabel: string;
  href: string;
  imageSide: "left" | "right";
}

// The three solicitud entry points (ST-10/11/12). Each redirects to its
// guided solicitud form.
const OPTIONS: HubOption[] = [
  {
    titulo: "No sé lo que quiero",
    descripcion: "Te guiamos desde cero hasta tu cotización.",
    ctaLabel: "Aquí te guiamos",
    href: "/tienda/cotizacion/idea-nula", // ST-10
    imageSide: "left",
  },
  {
    titulo: "Tengo una idea",
    descripcion: "Cuéntanos tu idea y la hacemos realidad.",
    ctaLabel: "Aquí lo hacemos realidad",
    href: "/tienda/cotizacion/idea-vaga", // ST-11
    imageSide: "right",
  },
  {
    titulo: "Quiero algo específico",
    descripcion: "Tú defines cada detalle; nosotros lo creamos.",
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
      <h2 className="font-bold text-[22px] md:text-[30px] text-[#1e1e1e] text-center py-8 md:py-10 px-4">
        ¿No sabes qué quieres?
      </h2>

      <div className="flex flex-col">
        {OPTIONS.map((option) => (
          <CotizacionTipoOption key={option.href} {...option} />
        ))}
      </div>
    </section>
  );
}
