import DetailPage from "./cotizacion-detail";

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <DetailPage id={id} />
    </div>
  );
}
