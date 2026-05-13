"use client";

import dynamic from "next/dynamic";
import { WorkOrderDocument } from "@/components/storefront/organisms/WorkOrderDocument";
import { QuotationFullContext } from "@/types";

// We import PDFViewer dynamically to avoid SSR issues with the browser-only PDF engine
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

const MOCK_PDF_DATA: QuotationFullContext = {
  id: "203-TEST",
  fecha_validacion: "12 de mayo de 2026",
  currency: "MXN",
  sucursal: {
    nombre: "GeekDesign Principal",
    direccion: "Av. de la Tecnología 404",
    colonia: "Parque Industrial",
    municipio: "Querétaro",
    estado: "Querétaro",
    cp: "76000",
  },
  contacto_direccion: {
    nombre: "Andrea Hernández",
    email: "direccion@geekdesign.mx",
    telefono: "+52 442 123 4567",
  },
  servicios: [
    {
      id: 1,
      nombre: "Corte Láser - Acrílico 3mm",
      descripcion: "Corte de precisión en acrílico",
      precio_anterior: 1200,
      precio_nuevo: 1100,
      estado: "modificado",
      detalles_cliente: "Acrílico cristal, 60x40cm, diseño adjunto.",
      motivo: "Ajuste de dimensiones solicitado por el cliente.",
    },
    {
      id: 2,
      nombre: "Grabado Láser - Madera",
      descripcion: "Grabado personalizado en madera",
      precio_anterior: 800,
      precio_nuevo: 800,
      estado: "sin_cambios",
      detalles_cliente: "Madera de pino, grabado profundo de logo.",
      motivo: "",
    },
  ],
  resumen: {
    subtotal: 1900,
    iva: 304,
    total: 2204,
  },
  terminos: "Esta cotización tiene una vigencia de 15 días naturales. El tiempo de entrega comienza a contar a partir de la recepción del anticipo del 50% y la aprobación final del diseño. No se aceptan cancelaciones una vez iniciado el proceso de producción. Los precios incluyen IVA.",
};

export default function TestPDFPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", background: "#1e1e1e", color: "white", textAlign: "center" }}>
        <p>Vista Previa de Orden de Trabajo (PE-02) - Solo Desarrollo</p>
      </div>
      <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
        <WorkOrderDocument data={MOCK_PDF_DATA} />
      </PDFViewer>
    </div>
  );
}
