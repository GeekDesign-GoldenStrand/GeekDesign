import { Wrench } from "@phosphor-icons/react/dist/ssr";

interface EnConstruccionProps {
  /** Heading shown below the icon. Defaults to "En construcción". */
  title?: string;
  /** Secondary copy below the heading. */
  message?: string;
  /** Extra content slot (e.g. a "Volver al dashboard" link). */
  children?: React.ReactNode;
}

/**
 * Full-region placeholder for admin sections that aren't built yet. Designed
 * to sit directly inside a route page below the fixed AdminHeader — the
 * `(admin)/layout.tsx` already pads the top of `<main>` for the header, so
 * this just needs to fill the remaining viewport height.
 *
 * Usage:
 * ```tsx
 * <>
 *   <AdminHeader title="Métricas" />
 *   <EnConstruccion />
 * </>
 * ```
 */
export function EnConstruccion({
  title = "En construcción",
  message = "Esta sección estará disponible pronto. Estamos trabajando para traerte la mejor experiencia.",
  children,
}: EnConstruccionProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      // Subtract the fixed AdminHeader height so the placeholder fills the
      // remaining visible area without forcing a scrollbar.
      className="flex min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-118px)] flex-col items-center justify-center px-8 py-16 text-center"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#ffecec] text-[#e42200]">
        <Wrench size={48} weight="duotone" aria-hidden />
      </div>

      <h2 className="font-ibm-plex mt-6 text-[28px] font-semibold text-[#1e1e1e]">{title}</h2>

      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#575757]">{message}</p>

      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
