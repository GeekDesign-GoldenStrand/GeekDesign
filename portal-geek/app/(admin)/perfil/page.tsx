import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CambiarContrasenaForm } from "./cambiar-form";

export const metadata: Metadata = { title: "Mi perfil — Geek Design" };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#fff8f9] px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <h1 className="mb-8 text-center text-[22px] font-semibold tracking-[0.5px] text-[#333]">
          Cambiar contraseña
        </h1>
        <CambiarContrasenaForm />
      </div>
    </main>
  );
}
