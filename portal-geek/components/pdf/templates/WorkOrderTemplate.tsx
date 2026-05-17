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

export function WorkOrderTemplate({ context }: { context: any }) {
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
