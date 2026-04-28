import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/ui/atoms/BrandLogo";

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
      <div className="flex w-full max-w-[519px] flex-col items-center gap-6 text-center">
        <BrandLogo />
        <p className="font-ibm-plex mt-10 text-[16px] text-[#555] tracking-[0.5px]">
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
      <BrandLogo />

      <div className="mt-16 flex flex-col items-center text-center">
        <h1 className="font-ibm-plex font-semibold text-[48px] tracking-[2.4px] bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93%] bg-clip-text text-transparent">
          Restablecer contraseña
        </h1>
        <p className="font-ibm-plex mt-4 font-normal text-[18px] tracking-[0.9px] text-[#5b5b5b]">
          Elige una nueva contraseña segura para tu cuenta
        </p>
      </div>

      <div className="mt-10 w-full">
        <CambiarForm token={token} />
      </div>
    </div>
  );
}
