"use client";

import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";

interface QuoteStatusBannerProps {
  status: string;
}

export function QuoteStatusBanner({ status }: QuoteStatusBannerProps) {
  // Configuración según el estado
  const config = {
    modificada: {
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      icon: <WarningCircle size={32} weight="bold" />,
      title: "Tu cotización fue modificada",
      desc: "Algunos servicios cambiaron de precio. Revisa los cambios antes de confirmar.",
      nextStep: "Revisa los cambios y confirma para comenzar.",
      btnText: "Revisar y confirmar cambios",
      btnColor: "bg-[#df2646] hover:bg-[#c41e3a]"
    },
    aceptada_sin_cambios: {
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      icon: <CheckCircle size={32} weight="bold" />,
      title: "Tu cotización está lista",
      desc: "Todos los servicios han sido validados y están listos para ser procesados.",
      nextStep: "Confirma tu pedido para iniciar con el proyecto.",
      btnText: "Aceptar cotización y continuar",
      btnColor: "bg-[#df2646] hover:bg-[#c41e3a]"
    },
    rechazada: {
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      icon: <XCircle size={32} weight="bold" />,
      title: "Tu cotización no pudo ser procesada",
      desc: "Lo sentimos, algunos servicios no están disponibles por el momento.",
      nextStep: "Solicita una aclaración para buscar una alternativa.",
      btnText: "Finalizar y seguir comprando",
      btnColor: "bg-[#df2646] hover:bg-[#c41e3a]"
    }
  }[status] || null;

  if (!config) return null;

  return (
    <div className={`mb-10 bg-white rounded-[16px] border border-[#d1d1d1] shadow-[0_8px_30px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row`}>
      <div className="flex-1 p-6 md:p-8 flex items-center gap-6">
        <div className={`w-14 h-14 rounded-full ${config.bgColor} flex items-center justify-center shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-[#1e1e1e] mb-1">{config.title}</h2>
          <p className="text-[17px] text-[#575757] font-medium">
            {config.desc}
          </p>
        </div>
      </div>
      <div className="bg-[#f9f9f9] p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#e8e8e8] min-w-[320px]">
         <p className="text-[14px] font-bold text-[#1e1e1e] mb-2 uppercase tracking-widest">Paso siguiente:</p>
         <p className="text-[16px] text-[#575757] mb-5 font-medium">{config.nextStep}</p>
         <button className={`w-full h-[52px] ${config.btnColor} text-white font-bold rounded-[10px] transition-all shadow-sm`}>
            {config.btnText}
         </button>
      </div>
    </div>
  );
}
