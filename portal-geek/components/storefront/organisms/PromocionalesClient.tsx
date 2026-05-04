"use client";

import { motion } from "framer-motion";
import { PromoHeroSection } from "./PromoHeroSection";
import { PromoLogoMarquee } from "./PromoLogoMarquee";
import { PromoBentoGrid } from "./PromoBentoGrid";

export function PromocionalesClient() {
  return (
    <div className="w-full bg-white flex flex-col font-sans grainy-texture overflow-x-hidden">
      
      {/* 1. Hero Section */}
      <PromoHeroSection />

      {/* 2. Logo Strip */}
      <PromoLogoMarquee />

      {/* 3. Asymmetric Bento Grid */}
      <PromoBentoGrid />

      {/* Footer Accentuator */}
      <section className="w-full py-32 flex flex-col items-center justify-center border-t border-gray-100">
        <motion.p 
          whileInView={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 4 }}
          className="text-black text-6xl md:text-[12rem] font-bold tracking-tighter opacity-20 select-none"
          style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
        >
          GEEKDESIGN
        </motion.p>
      </section>
    </div>
  );
}
