"use client";

import { ChatTeardropText } from "@phosphor-icons/react";
import React from "react";

interface QuoteServiceDetailsProps {
  detalles: string;
  isMobile?: boolean;
}

export function QuoteServiceDetails({ detalles, isMobile = false }: QuoteServiceDetailsProps) {
  return (
    <div
      className={`bg-[#f9f9f9] ${isMobile ? "p-4 rounded-[12px] border-l-[4px]" : "px-6 py-8 border-l-[6px]"} border-[#df2646] ${isMobile ? "mt-2" : ""}`}
    >
      <div className={`${isMobile ? "" : "max-w-[1000px]"} space-y-3`}>
        <h4
          className={`${isMobile ? "text-[12px]" : "text-[14px]"} font-bold text-[#1e1e1e] uppercase tracking-widest flex items-center gap-2`}
        >
          <ChatTeardropText size={isMobile ? 16 : 20} className="text-[#df2646]" />
          Detalles del servicio
        </h4>
        <p
          className={`${isMobile ? "text-[14px]" : "text-[16px]"} text-[#575757] leading-relaxed italic bg-white p-5 rounded-[12px] border border-[#e8e8e8]`}
        >
          &quot;{detalles}&quot;
        </p>
      </div>
    </div>
  );
}
