import type { Metadata } from "next";
import { Suspense } from "react";

import { BrandLogo } from "@/components/ui/atoms/BrandLogo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Geek Design",
};

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-[519px] flex-col items-center">
      <BrandLogo />

      <div className="mt-16 flex flex-col items-center text-center">
        <h1 className="font-ibm-plex font-semibold text-[48px] tracking-[2.4px] bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93%] bg-clip-text text-transparent">
          Bienvenid@
        </h1>
        <p className="font-ibm-plex font-normal text-[18px] tracking-[0.9px] text-[#5b5b5b]">
          al portal administrativo
        </p>
      </div>

      <div className="mt-12 w-full">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
