import type { Metadata } from "next";
import Image from "next/image";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Geek Design",
};

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-[519px] flex-col items-center">
      <div className="flex items-center gap-3">
        <Image src="/images/login/logo.png" alt="Geek Design" width={46} height={46} priority />
        <span className="font-semibold text-[20px] tracking-[1px] text-[#df2646]">GEEK DESIGN</span>
      </div>

      <div className="mt-20 flex flex-col items-center text-center">
        <h1 className="bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93.269%] bg-clip-text font-semibold text-[48px] tracking-[2.4px] text-transparent">
          Bienvenid@
        </h1>
        <p className="bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93.269%] bg-clip-text font-light text-[32px] tracking-[1.6px] text-transparent">
          al portal administrativo
        </p>
      </div>

      <div className="mt-14 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
