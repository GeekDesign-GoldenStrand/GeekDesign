"use client";

import Image from "next/image";

import { EditorialHeading } from "../atoms/EditorialHeading";
import { PromoButton } from "../atoms/PromoButton";

export function PromoHeroSection() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/storefront/editorial_hero.png"
          alt="Hero Editorial Promocionales"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25"></div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center px-4">
        <p className="text-white/90 text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4">
          Curaduría Premium · 2026
        </p>

        <EditorialHeading mainText="Explora nuestros" italicText="productos" className="mb-8" />

        <PromoButton text="de catálogo" />
      </div>
    </section>
  );
}
