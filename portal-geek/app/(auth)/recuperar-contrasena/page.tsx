import type { Metadata } from "next";

import { BrandLogo } from "@/components/ui/brand-logo";

import { RecuperarForm } from "./recuperar-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Geek Design",
};

export default function RecuperarContrasenaPage() {
  return (
    <div className="flex w-full max-w-[519px] flex-col items-center">
      <BrandLogo />

      <div className="mt-16 flex flex-col items-center text-center">
        <h1 className="font-semibold text-[48px] tracking-[2.4px] bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93%] bg-clip-text text-transparent">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-4 font-normal text-[18px] tracking-[0.9px] text-[#5b5b5b] max-w-[480px]">
          Introduce tu dirección de correo electrónico para que se te envíe un link con el que
          podrás restablecer tu contraseña
        </p>
      </div>

      <div className="mt-10 w-full">
        <RecuperarForm />
      </div>
    </div>
  );
}
