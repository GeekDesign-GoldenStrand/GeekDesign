"use client";

import { ArrowLeft, ArrowClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";

export default function PromocionalesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-white">
      <div className="space-y-6 max-w-md">
        <h2 className="font-alexandria text-4xl md:text-6xl font-bold text-black tracking-tighter">
          Algo no salió <br />
          <span className="italic font-serif">como esperábamos</span>
        </h2>

        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Lo sentimos, ha ocurrido un error al cargar la experiencia promocional. Estamos trabajando
          para solucionarlo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[#df2646] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
          >
            <ArrowClockwise size={20} />
            Reintentar
          </button>

          <Link
            href="/storefront"
            className="flex items-center gap-2 text-black font-bold text-sm hover:underline"
          >
            <ArrowLeft size={20} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
