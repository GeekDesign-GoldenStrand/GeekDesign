import { Wrench, Storefront } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface EnConstruccionProps {
  /** Bold heading. Defaults to "En construcción". */
  title?: string;
  /** Secondary copy below the heading. */
  message?: string;
  /**
   * Primary CTA. Pass `null` to hide it. Defaults to a "Volver a la tienda"
   * button styled like CTABanner / HeroBanner so it reads as part of the
   * storefront family.
   */
  cta?: { href: string; label: string } | null;
}

/**
 * Storefront placeholder for `/tienda/*` routes that aren't built yet.
 *
 * Designed to match the storefront's visual language — same `#fff8f9`
 * background as the confirmation page, `viewport - 106px Navbar` height,
 * bold #1e1e1e headings, and the red `#e42200` CTA button shared with
 * CTABanner / HeroBanner.
 *
 * Usage:
 * ```tsx
 * export default function CatalogoPage() {
 *   return <EnConstruccion />;
 * }
 * ```
 */
export function EnConstruccion({
  title = "En construcción",
  message = "Esta sección estará disponible pronto. Estamos trabajando para traerte la mejor experiencia.",
  cta = { href: "/tienda", label: "Volver a la tienda" },
}: EnConstruccionProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      // Match the storefront page chrome — same background tint and the
      // viewport-minus-navbar minimum height used by /tienda/cotizacion and
      // /tienda/cotizacion/confirmacion, so the placeholder always fills the
      // visible area without a scrollbar.
      className="bg-[#fff8f9] min-h-[calc(100vh-106px)] flex items-center justify-center px-4 py-16"
    >
      <div className="bg-white w-full max-w-[857px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex flex-col items-center text-center px-6 md:px-12 py-12 md:py-16 gap-6">
        <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-[#ffecec] text-[#e42200]">
          <Wrench size={44} weight="duotone" aria-hidden />
        </div>

        <h1
          className="font-bold text-[28px] sm:text-[36px] md:text-[45px] text-[#1e1e1e] leading-tight"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          {title}
        </h1>

        <p className="text-[15px] md:text-[17px] text-[#666] max-w-[520px] leading-relaxed">
          {message}
        </p>

        {cta && (
          <Link
            href={cta.href}
            className="bg-[#e42200] w-full max-w-[241px] h-[46px] md:h-[53px] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center text-[#fffcfc] text-[15px] md:text-[16.742px] font-semibold hover:brightness-95 transition mt-2"
          >
            <Storefront size={23} weight="duotone" aria-hidden className="mr-2" />
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
