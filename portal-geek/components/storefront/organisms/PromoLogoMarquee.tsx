"use client";

import { PromoLogoItem } from "../molecules/PromoLogoItem";

const LOGOS = [
  "Productos",
  "Diseño",
  "Personalizado",
  "Llaveros",
  "Gorras",
  "Playeras",
  "Cajas",
  "Regalos",
];

export function PromoLogoMarquee() {
  return (
    <section className="w-full border-y border-gray-100 bg-white py-16 overflow-hidden">
      <div className="animate-marquee gap-16 md:gap-32">
        {[...LOGOS, ...LOGOS].map((logo, index) => (
          <PromoLogoItem key={index} name={logo} />
        ))}
      </div>
    </section>
  );
}
