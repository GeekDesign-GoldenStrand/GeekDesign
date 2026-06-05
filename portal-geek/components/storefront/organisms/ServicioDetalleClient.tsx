"use client";

import Link from "next/link";
import { useState } from "react";

import type { UploadedFile } from "@/components/storefront/molecules/DesignUploadZone";
import { DesignUploadZone } from "@/components/storefront/molecules/DesignUploadZone";
import { FormulaVariablesForm } from "@/components/storefront/organisms/FormulaVariablesForm";
import type { Material, Variable } from "@/components/storefront/organisms/FormulaVariablesForm";
import { Button } from "@/components/ui/atoms/Button";

interface Props {
  servicioId: number;
  nombreServicio: string;
  descripcionServicio?: string | null;
  materialesText: string;
  materiales: Material[];
  variables: Variable[];
  puedeCotizarEnLinea: boolean;
  imagenUrls?: string[];
}

export function ServicioDetalleClient({
  servicioId,
  nombreServicio,
  descripcionServicio,
  materialesText,
  materiales,
  variables,
  puedeCotizarEnLinea,
  imagenUrls = [],
}: Props) {
  const [disenioFile, setDisenioFile] = useState<UploadedFile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(imagenUrls[0] || null);
  const urlsKey = imagenUrls.join("|");
  const [prevKey, setPrevKey] = useState(urlsKey);

  if (urlsKey !== prevKey) {
    setPrevKey(urlsKey);
    setSelectedImage(imagenUrls[0] || null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px]">
      {/* ── Izquierda: galería + (upload, solo cuando se cotiza en línea) ── */}
      <div className="flex flex-col gap-[16px]">
        <div className="bg-[#ffd9e2] rounded-[14px] aspect-square overflow-hidden flex items-center justify-center border border-gray-200">
          {selectedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImage} alt={nombreServicio} className="w-full h-full object-cover" />
          ) : (
            <span className="font-medium text-[16px] text-[#1e1e1e]">
              Imagen principal del producto
            </span>
          )}
        </div>

        {imagenUrls.length > 1 && (
          <div className="grid grid-cols-4 gap-[12px]">
            {imagenUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(url)}
                className={`bg-white rounded-[10px] aspect-square overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                  selectedImage === url ? "border-[#df2646]" : "border-gray-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Upload only matters for the configurable flow; the personalizada
            placeholder doesn't consume the file so we omit it there. */}
        {puedeCotizarEnLinea && (
          <DesignUploadZone
            maxFiles={1}
            maxBytes={10 * 1024 * 1024}
            onKeysChange={(files) => setDisenioFile(files[0] ?? null)}
          />
        )}
      </div>

      {/* ── Derecha: info + form ── */}
      <div className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <h1 className="font-bold text-[32px] leading-tight text-[#1e1e1e]">{nombreServicio}</h1>
          {descripcionServicio && (
            <p className="text-[14px] text-[#1e1e1e] leading-normal">{descripcionServicio}</p>
          )}
          {materialesText && (
            <p className="text-[14px] text-[#1e1e1e] mt-[4px]">
              <span className="font-semibold">Materiales disponibles:</span> {materialesText}.
            </p>
          )}
        </div>

        {puedeCotizarEnLinea ? (
          <FormulaVariablesForm
            servicioId={servicioId}
            nombreServicio={nombreServicio}
            materiales={materiales}
            variables={variables}
            disenioFile={disenioFile}
            imagenUrls={imagenUrls}
          />
        ) : (
          <div className="bg-white border border-[#c2c0c0] rounded-[10px] p-[24px] flex flex-col gap-[12px]">
            <h2 className="font-bold text-[18px] text-[#1e1e1e]">
              Cotización en línea no disponible
            </h2>
            <p className="text-[14px] text-[#1e1e1e] leading-relaxed">
              Este servicio requiere una cotización personalizada. Contáctanos y un asesor preparará
              una propuesta para tu proyecto.
            </p>
            <Button asChild variant="primary" section="storefront" size="md" className="self-start">
              <Link href={`/tienda/cotizacion/personalizada?servicio=${servicioId}`}>
                Solicitar cotización personalizada
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
