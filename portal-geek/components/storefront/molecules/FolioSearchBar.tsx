"use client";

import { Hash, MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FolioSearchBarProps {
  initialValue?: string;
  className?: string;
}

export function FolioSearchBar({ initialValue = "", className = "" }: FolioSearchBarProps) {
  const [folio, setFolio] = useState(initialValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (folio.trim()) {
      router.push(`/cotizacion/${folio.trim()}`);
    }
  };

  return (
    <div
      className={`w-full max-w-[1240px] bg-white rounded-[24px] border border-[#d1d1d1] shadow-[0_12px_50px_rgba(0,0,0,0.06)] overflow-hidden ${className}`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center p-6 md:p-10 lg:p-12 gap-8 lg:gap-16">
        {/* Left Side: Information */}
        <div className="flex-1 lg:max-w-[480px]">
          <h1 className="text-[32px] md:text-[38px] font-extrabold text-[#1e1e1e] mb-3 leading-tight">
            Consulta tu cotización
          </h1>
          <p className="text-[17px] md:text-[20px] text-[#575757] font-medium leading-relaxed">
            Ingresa el folio de tu cotización para ver su estado y detalles
          </p>
        </div>

        {/* Divider (Visible only in desktop) */}
        <div className="hidden lg:block w-[1.5px] h-24 bg-[#e8e8e8]"></div>

        {/* Right Side: Search Form */}
        <div className="flex-[1.2] flex flex-col space-y-5">
          <label className="text-[16px] font-bold text-[#1e1e1e] uppercase tracking-widest">
            Folio de cotización
          </label>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#575757]">
                <Hash size={22} weight="bold" />
              </div>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ej. 58479, 28393, etc."
                className="w-full h-[60px] pl-11 pr-4 rounded-[12px] border border-[#d1d1d1] text-[18px] text-[#1e1e1e] font-semibold focus:outline-none focus:border-[#df2646] focus:ring-4 focus:ring-[#df2646]/5 transition-all placeholder:text-[#b9b8b8] placeholder:font-normal not-italic"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto h-[60px] px-10 bg-[#df2646] hover:bg-[#c41e3a] text-white text-[17px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(223,38,70,0.25)]"
            >
              <MagnifyingGlass size={22} weight="bold" />
              Buscar cotización
            </button>
          </form>

          <p className="text-[#8e908f] text-[14px] font-medium">
            Puedes encontrar el folio en el correo de confirmación de tu solicitud
          </p>
        </div>
      </div>
    </div>
  );
}
