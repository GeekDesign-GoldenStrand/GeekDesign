import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { getSession } from "@/lib/auth/session";

import { CambiarContrasenaForm } from "./cambiar-form";

export const metadata: Metadata = { title: "Mi perfil — Geek Design" };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <AdminHeader title="Mi perfil" />
      <div className="flex flex-col items-center px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-ibm-plex font-semibold text-[48px] tracking-[2.4px] bg-gradient-to-l from-[#eb696b] to-[#ff6388] to-[93%] bg-clip-text text-transparent">
            Cambiar contraseña
          </h2>
          <p className="mt-4 font-normal text-[18px] tracking-[0.9px] text-[#5b5b5b]">
            Introduce tu contraseña actual y la nueva contraseña
          </p>
        </div>

        <div className="mt-10 w-full max-w-[519px]">
          <CambiarContrasenaForm />
        </div>
      </div>
    </>
  );
}
