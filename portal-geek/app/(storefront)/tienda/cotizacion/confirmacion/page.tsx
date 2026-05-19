import Link from "next/link";

interface Props {
  searchParams: Promise<{ folio?: string }>;
}

// KIKW12 review #2: confirmation no longer carries the email in the URL.
// The submit handler already emailed a magic link; this page just tells the
// cliente to check their inbox and points them at the lookup page in case
// the email never arrived or the token expires.
export default async function ConfirmacionPage({ searchParams }: Props) {
  const { folio } = await searchParams;

  return (
    <div className="bg-[#fff8f9] min-h-[calc(100vh-106px)]">
      <div className="max-w-[640px] mx-auto px-[42px] py-[80px] text-center">
        <h1 className="font-bold text-[32px] text-[#1e1e1e] mb-[16px]">¡Solicitud recibida!</h1>
        <p className="text-[16px] text-[#1e1e1e] mb-[24px]">
          Tu cotización fue enviada al equipo de Dirección. Te enviamos un correo con un enlace para
          ver el detalle, aprobarla o cancelarla.
        </p>
        {folio && (
          <div className="bg-white border border-[#c2c0c0] rounded-[10px] px-[24px] py-[20px] inline-flex flex-col items-center gap-[4px] mb-[32px]">
            <p className="text-[12px] uppercase tracking-[1px] text-[#666]">Folio</p>
            <p className="font-bold text-[24px] text-[#8b434a]">{folio}</p>
          </div>
        )}
        <div className="flex flex-col gap-[12px] items-center">
          <p className="text-[13px] text-[#666]">
            ¿No recibiste el correo? Puedes pedir un nuevo enlace en{" "}
            <Link href="/tienda/cotizacion" className="underline">
              /tienda/cotizacion
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
