import type { Metadata } from "next";
import Image from "next/image";

import { RecuperarForm } from "./recuperar-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Geek Design",
};

export default function RecuperarContrasenaPage() {
  return (
    <div className="flex w-full max-w-[519px] flex-col items-center">
      <div className="flex items-center gap-3">
        <Image src="/images/login/logo.png" alt="Geek Design" width={46} height={46} priority />
        <span className="font-semibold text-[20px] tracking-[1px] text-[#df2646]">GEEK DESIGN</span>
      </div>

      <div className="mt-20 flex flex-col items-center text-center">
        <h1 className="bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93.269%] bg-clip-text font-semibold text-[40px] tracking-[2px] text-transparent">
          Recuperar contraseña
        </h1>
        <p className="mt-3 font-light text-[16px] tracking-[0.5px] text-[#888]">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <div className="mt-14 w-full">
        <RecuperarForm />
      </div>
    </div>
  );
}
