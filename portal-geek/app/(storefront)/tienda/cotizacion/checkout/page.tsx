import { CheckoutForm } from "@/components/storefront/organisms/CheckoutForm";
import { prisma } from "@/lib/db/client";

// Server-side reads from Prisma; skip static prerender so the build doesn't try
// to hit the DB with dummy credentials.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const sucursales = await prisma.sucursales.findMany({
    where: { estatus: "Activo" },
    orderBy: { nombre_sucursal: "asc" },
    select: { id_sucursal: true, nombre_sucursal: true },
  });

  return (
    <div className="bg-[#fff8f9] min-h-[calc(100vh-106px)]">
      <div className="max-w-[800px] mx-auto px-[42px] py-[40px]">
        <h1 className="font-bold text-[36px] text-[#1e1e1e] mb-[8px]">Solicitar cotización</h1>
        <p className="text-[16px] text-[#666] mb-[32px]">
          Compártenos tus datos y enviaremos tu solicitud al equipo de Dirección para que la revise.
        </p>
        <CheckoutForm sucursales={sucursales} />
      </div>
    </div>
  );
}
