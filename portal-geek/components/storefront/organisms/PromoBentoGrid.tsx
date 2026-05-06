"use client";

import { PromoGridItem } from "../molecules/PromoGridItem";

export function PromoBentoGrid() {
  return (
    <section id="catalogo-links" className="max-w-[1500px] mx-auto w-full px-4 md:px-12 py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 auto-rows-auto">
        {/* Top Left: Wide Block - PromoGeek Express */}
        <PromoGridItem
          title={"PromoGeek\nEntrega Express"}
          description="Soluciones rápidas para tus necesidades inmediatas. Calidad y velocidad en cada pedido."
          imageUrl="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2370&auto=format&fit=crop"
          href="https://promogeek.mx/"
          ctaText="Ver Entrega Express"
          className="md:col-span-8 h-[450px]"
          priority={true}
        />

        {/* Top Right: Square Text Block - Promocionales en Línea */}
        <PromoGridItem
          title={
            <>
              Catálogo <span className="italic">Extenso</span>
            </>
          }
          description="Explora miles de opciones personalizables en nuestra plataforma aliada de promocionales."
          href="https://www.promocionalesenlinea.com/geek"
          ctaText="Explorar Catálogo"
          type="text"
          bgClassName="bg-[#fcf8f2]"
          className="md:col-span-4 h-[450px]"
          delay={0.2}
        />

        {/* Bottom: Wide Block - Tienda Promocionales Web */}
        <PromoGridItem
          title={
            <>
              Tienda <br />
              <span className="italic">Exclusiva</span> GeekDesign
            </>
          }
          description="Una experiencia de compra premium diseñada para encontrar el promocional perfecto para tu marca."
          imageUrl="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2370&auto=format&fit=crop"
          href="https://tienda.promocionalesweb.com/geekdesign"
          ctaText="Visitar Tienda Web"
          className="md:col-span-12 h-[450px] md:h-[500px]"
          delay={0.4}
        />
      </div>
    </section>
  );
}
