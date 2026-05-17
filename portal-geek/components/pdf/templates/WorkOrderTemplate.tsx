import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { HeaderSection } from '../organisms/HeaderSection';
import { ClientDetailsSection } from '../organisms/ClientDetailsSection';
import { SpecsTableSection } from '../organisms/SpecsTableSection';
import { TotalsSection } from '../organisms/TotalsSection';
import { SignatureSection } from '../organisms/SignatureSection';
import { TermsSection } from '../organisms/TermsSection';
import { BankInfoSection } from '../organisms/BankInfoSection';

export const WorkOrderTemplate = ({ context }: { context: any }) => {
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
          render={({ pageNumber, totalPages }) => (
            `GEEK DESIGN - Av. Mediterráneo 236 B Fracc. Pirámides. Villa corregidora Querétaro  |  Página ${pageNumber} de ${totalPages}`
          )} 
          fixed 
        />
      </Page>
    </Document>
  );
};
