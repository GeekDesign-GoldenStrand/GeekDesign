import Link from "next/link";

interface Props {
  searchParams: Promise<{ folio?: string; email?: string }>;
}

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { folio, email } = await searchParams;
  const lookupUrl =
    folio && email
      ? `/tienda/cotizacion/${encodeURIComponent(folio)}?email=${encodeURIComponent(email)}`
      : null;

  return (
    <div className="bg-[#fff8f9] min-h-[calc(100vh-106px)]">
      <div className="max-w-[640px] mx-auto px-[42px] py-[80px] text-center">
        <h1 className="font-bold text-[32px] text-[#1e1e1e] mb-[16px]">¡Solicitud recibida!</h1>
        <p className="text-[16px] text-[#1e1e1e] mb-[24px]">
          Tu cotización fue enviada al equipo de Dirección. La revisarán y te avisarán cuando esté
          validada.
        </p>
        {folio && (
          <div className="bg-white border border-[#c2c0c0] rounded-[10px] px-[24px] py-[20px] inline-flex flex-col items-center gap-[4px] mb-[32px]">
            <p className="text-[12px] uppercase tracking-[1px] text-[#666]">Folio</p>
            <p className="font-bold text-[24px] text-[#8b434a]">{folio}</p>
          </div>
        )}
        {lookupUrl && (
          <div className="flex flex-col gap-[12px] items-center">
            <Link
              href={lookupUrl}
              className="bg-[#8b434a] text-white font-semibold text-[16px] rounded-[10px] px-[24px] h-[48px] flex items-center justify-center hover:bg-[#7a3a41] transition-colors"
            >
              Ver mi cotización
            </Link>
            <p className="text-[13px] text-[#666]">
              Guarda este enlace o búscala más tarde en{" "}
              <Link href="/tienda/cotizacion" className="underline">
                /tienda/cotizacion
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
