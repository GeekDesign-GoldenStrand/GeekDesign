"use client";

import { Check } from "@phosphor-icons/react";

interface Paso {
  label: string;
  fecha: string;
  completado: boolean;
  actual?: boolean;
}

interface QuoteStepperProps {
  pasos: Paso[];
}

export function QuoteStepper({ pasos }: QuoteStepperProps) {
  return (
    <div className="mb-12 px-2 md:px-12 relative flex justify-between items-start">
      {/* Progress Lines */}
      <div className="absolute top-[12px] md:top-[14px] left-[40px] md:left-[60px] right-[40px] md:right-[60px] h-[2px] bg-[#e8e8e8] -z-10">
        <div className="h-full bg-[#df2646]" style={{ width: '66%' }}></div>
      </div>

      {pasos.map((paso, idx) => (
        <div key={idx} className="flex flex-col items-center text-center max-w-[80px] md:max-w-[150px]">
          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mb-2 md:mb-3 z-10 border-2 text-[10px] md:text-[14px] ${
            paso.completado 
              ? 'bg-[#df2646] border-[#df2646] text-white' 
              : paso.actual 
                ? 'bg-white border-orange-500 text-orange-500'
                : 'bg-white border-[#d1d1d1] text-[#8e908f]'
          }`}>
            {paso.completado ? <Check size={14} weight="bold" className="md:w-[18px] md:h-[18px]" /> : idx + 1}
          </div>
          <p className={`text-[10px] md:text-[14px] font-bold mb-0.5 md:mb-1 leading-tight ${paso.completado || paso.actual ? 'text-[#1e1e1e]' : 'text-[#8e908f]'}`}>
            {paso.label}
          </p>
          <p className="text-[9px] md:text-[12px] text-[#8e908f] leading-none">{paso.fecha}</p>
        </div>
      ))}
    </div>
  );
}
