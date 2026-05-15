"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Organism: FolioSearch
 * Allows clients to search for a quotation by its folio number.
 */
export function FolioSearch() {
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio.trim() || !email.trim()) return;
    router.push(`/cotizacion/${folio.trim()}?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="max-w-[1240px] mx-auto py-12 px-4">
      <div className="bg-white rounded-[24px] border border-[#E8E8E8] shadow-[0_12px_60px_rgba(0,0,0,0.03)] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left Side: Text */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <h2 className="text-[36px] md:text-[42px] font-black text-[#1e1e1e] leading-tight">
            Consulta tu cotización
          </h2>
          <p className="text-[#8e908f] text-[18px] md:text-[20px] font-medium max-w-[450px]">
            Ingresa tus datos para ver el estado y detalles de tu proyecto
          </p>
        </div>

        {/* Divider (Desktop) */}
        <div className="hidden lg:block w-[1.5px] h-[120px] bg-[#F0F0F0]" />

        {/* Right Side: Form */}
        <div className="w-full lg:w-auto md:min-w-[500px] space-y-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-[1.5px]">
                  Folio de cotización
                </label>
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="# 203"
                  required
                  className="w-full h-[64px] bg-white border border-[#E8E8E8] rounded-[12px] px-6 text-[18px] font-bold text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#DF2646] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-[1.5px]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full h-[64px] bg-white border border-[#E8E8E8] rounded-[12px] px-6 text-[18px] font-bold text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#DF2646] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[64px] bg-[#DF2646] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#C41E3A] transition-all shadow-lg shadow-[#DF2646]/20 active:scale-95 whitespace-nowrap"
            >
              <MagnifyingGlass size={22} weight="bold" />
              Buscar cotización
            </button>
          </form>
          <p className="text-[13px] text-[#B9B8B8] font-medium text-center lg:text-left">
            Puedes encontrar el folio en el correo de confirmación de tu solicitud
          </p>
        </div>
      </div>
    </div>
  );
}
