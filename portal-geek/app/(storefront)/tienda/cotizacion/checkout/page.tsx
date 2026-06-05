import { cookies } from "next/headers";

import { CheckoutForm, type InitialContact } from "@/components/storefront/organisms/CheckoutForm";
import { prisma } from "@/lib/db/client";
import { CLIENTE_COOKIE_NAME, readClienteId } from "@/lib/services/cotizacion-access";

// Server-side reads from Prisma; skip static prerender so the build doesn't try
// to hit the DB with dummy credentials.
export const dynamic = "force-dynamic";

// Resolve the recognized client (if any) so we can prefill the form. Returns
// null unless a valid, signed recognized-client cookie is present — so prefill
// only ever happens for a client who previously proved email control via the
// magic link.
async function getRecognizedContact(): Promise<InitialContact | null> {
  const jwt = (await cookies()).get(CLIENTE_COOKIE_NAME)?.value;
  if (!jwt) return null;
  const id_cliente = await readClienteId(jwt);
  if (id_cliente === null) return null;

  const cliente = await prisma.clientes.findUnique({
    where: { id_cliente },
    select: {
      nombre_cliente: true,
      empresa: true,
      correo_electronico: true,
      numero_telefono: true,
    },
  });
  if (!cliente) return null;

  return {
    nombre: cliente.nombre_cliente,
    empresa: cliente.empresa ?? "",
    correo: cliente.correo_electronico,
    telefono: cliente.numero_telefono,
  };
}

export default async function CheckoutPage() {
  const [sucursales, initialContact] = await Promise.all([
    prisma.sucursales.findMany({
      where: { estatus: "Activo" },
      orderBy: { nombre_sucursal: "asc" },
      select: { id_sucursal: true, nombre_sucursal: true },
    }),
    getRecognizedContact(),
  ]);

  return (
    <div className="bg-[#fff8f9] min-h-[calc(100vh-106px)]">
      <div className="max-w-[800px] mx-auto px-[42px] py-[40px]">
        <h1 className="font-bold text-[36px] text-[#1e1e1e] mb-[8px]">Solicitar cotización</h1>
        <p className="text-[16px] text-[#666] mb-[32px]">
          Compártenos tus datos y enviaremos tu solicitud al equipo de Dirección para que la revise.
        </p>
        <CheckoutForm sucursales={sucursales} initialContact={initialContact} />
      </div>
    </div>
  );
}
