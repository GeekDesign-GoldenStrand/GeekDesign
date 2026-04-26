"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Servicios } from "@prisma/client";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ServiceCard } from "../atoms/ServiceCard";

interface ServiceCarouselProps {
  services: Servicios[];
}

export function ServiceCarousel({ services }: ServiceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tripled = [...services, ...services, ...services];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || services.length === 0) return;

    // rAF ensures the browser has computed layout before we read scrollWidth
    const raf = requestAnimationFrame(() => {
      el.scrollLeft = Math.floor(el.scrollWidth / 3);
    });

    function onScroll() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!el) return;
        const oneSet = Math.floor(el.scrollWidth / 3);
        if (el.scrollLeft < oneSet) {
          el.scrollLeft += oneSet;
        } else if (el.scrollLeft >= oneSet * 2) {
          el.scrollLeft -= oneSet;
        }
      }, 80);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [services.length]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by the full visible width → advances exactly one page of cards
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  }

  return (
    // Flex row: [←] [scroll track] [→]
    <div className="flex items-center gap-3">
      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="shrink-0 w-[36px] h-[36px] md:w-[44px] md:h-[44px] bg-[#fffcfc] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:shadow-[0px_6px_16px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-150"
      >
        <CaretLeft size={16} weight="light" className="text-[#1e1e1e]" />
      </button>

      <div ref={scrollRef} className="flex flex-1 overflow-x-auto scrollbar-hide gap-3 md:gap-5 py-2 px-1">
        {tripled.map((s, i) => (
          <Link
            key={`${s.id_servicio}-${i}`}
            href={`/servicios/${s.id_servicio}`}
            className="shrink-0 block w-[calc((100%_-_24px)_/_3_-_0.5px)] md:w-[calc((100%_-_100px)_/_6_-_0.5px)]"
          >
            <ServiceCard nombre_servicio={s.nombre_servicio} />
          </Link>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className="shrink-0 w-[36px] h-[36px] md:w-[44px] md:h-[44px] bg-[#fffcfc] rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:shadow-[0px_6px_16px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-150"
      >
        <CaretRight size={16} weight="light" className="text-[#1e1e1e]" />
      </button>
    </div>
  );
}
