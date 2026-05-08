"use client";

import Image from "next/image";

import { EditorialHeading } from "../atoms/EditorialHeading";
import { PromoButton } from "../atoms/PromoButton";

export function PromoHeroSection() {
  const scrollToSection = () => {
    const element = document.getElementById("catalogo-links");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?q=80&w=2370&auto=format&fit=crop"
          alt="Hero Editorial Promocionales"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center px-4">
        <p className="text-white/90 text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4">
          Selección Curada · 2026
        </p>

        <EditorialHeading mainText="Catálogo de" italicText="promocionales" className="mb-8" />

        <PromoButton text="Explorar Selección" onClick={scrollToSection} />
      </div>
    </section>
  );
}
