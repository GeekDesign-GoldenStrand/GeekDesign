import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CambiarForm } from "./cambiar-form";

export const metadata: Metadata = {
  title: "Nueva contraseña | Geek Design",
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CambiarContrasenaPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex w-full max-w-[519px] flex-col items-center text-center gap-6">
        <div className="flex items-center gap-3">
          <Image src="/images/login/logo.png" alt="Geek Design" width={46} height={46} priority />
          <span className="font-semibold text-[20px] tracking-[1px] text-[#df2646]">
            GEEK DESIGN
          </span>
        </div>
        <p className="mt-10 text-[16px] text-[#555] tracking-[0.5px]">
          El enlace de recuperación es inválido o ya expiró.
        </p>
        <Link
          href="/recuperar-contrasena"
          className="font-light text-[13px] tracking-[0.65px] text-[#df2646] hover:underline"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[519px] flex-col items-center">
      <div className="flex items-center gap-3">
        <Image src="/images/login/logo.png" alt="Geek Design" width={46} height={46} priority />
        <span className="font-semibold text-[20px] tracking-[1px] text-[#df2646]">GEEK DESIGN</span>
      </div>

      <div className="mt-20 flex flex-col items-center text-center">
        <h1 className="bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93.269%] bg-clip-text font-semibold text-[40px] tracking-[2px] text-transparent">
          Nueva contraseña
        </h1>
        <p className="mt-3 font-light text-[16px] tracking-[0.5px] text-[#888]">
          Elige una contraseña segura de al menos 8 caracteres.
        </p>
      </div>

      <div className="mt-14 w-full">
        <CambiarForm token={token} />
      </div>
    </div>
  );
}
