"use client";

import { PromoBentoGrid } from "./PromoBentoGrid";
import { PromoHeroSection } from "./PromoHeroSection";
import { PromoLogoMarquee } from "./PromoLogoMarquee";

export function PromocionalesClient() {
  return (
    <div className="w-full bg-white flex flex-col font-sans grainy-texture overflow-x-hidden">
      {/* 1. Hero Section */}
      <PromoHeroSection />

      {/* 2. Logo Strip */}
      <PromoLogoMarquee />

      {/* 3. Asymmetric Bento Grid */}
      <PromoBentoGrid />
    </div>
  );
}
