import { Document, Page, Text } from "@react-pdf/renderer";
import React from "react";

import { BankInfoSection } from "../organisms/BankInfoSection";
import { ClientDetailsSection } from "../organisms/ClientDetailsSection";
import { HeaderSection } from "../organisms/HeaderSection";
import { SignatureSection } from "../organisms/SignatureSection";
import { SpecsTableSection } from "../organisms/SpecsTableSection";
import { TermsSection } from "../organisms/TermsSection";
import { TotalsSection } from "../organisms/TotalsSection";
import { styles } from "../styles";

interface WorkOrderContext {
  quotation: {
    fecha_aprobacion?: string | Date | null;
    fecha_validacion?: string | Date | null;
    fecha_creacion: string | Date;
    folio?: string | null;
    id_cotizacion: number;
    monto_total: number | string;
  };
  client: {
    nombre_cliente: string;
    empresa?: string | null;
    correo_electronico: string;
    numero_telefono: string;
  };
  specs: {
    servicio?: {
      nombre_servicio: string;
    } | null;
    archivo?: {
      url_archivo?: string | null;
    } | null;
    material?: {
      nombre_material: string;
    } | null;
    notas?: string | null;
    cantidad: number;
    precio_unitario: number | string;
    subtotal: number | string;
  }[];
  branch: {
    nombre_sucursal: string;
    direccion: string;
  };
}

export function WorkOrderTemplate({ context }: { context: WorkOrderContext }) {
  const { quotation, client, specs, branch } = context;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderSection branch={branch} quotation={quotation} />
        <ClientDetailsSection client={client} />
        <SpecsTableSection specs={specs} />
        <TotalsSection quotation={quotation} />
        <SignatureSection />
        <TermsSection />
        <BankInfoSection />

        <Text
          style={styles.pageFooter}
          render={({ pageNumber, totalPages }) =>
            `GEEK DESIGN - Av. Mediterráneo 236 B Fracc. Pirámides. Villa corregidora Querétaro  |  Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
