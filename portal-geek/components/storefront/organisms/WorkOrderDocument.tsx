import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer";

import type { QuotationFullContext } from "@/types";

import { PDFFooter } from "../molecules/pdf/PDFFooter";
import { PDFHeader } from "../molecules/pdf/PDFHeader";
import { PDFServiceTable } from "../molecules/pdf/PDFServiceTable";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 5,
  },
  metaItem: {
    fontSize: 9,
    color: "#575757",
  },
  metaValue: {
    fontWeight: "bold",
    color: "#1e1e1e",
  },
  footerPageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#bdc3c7",
  },
});

interface WorkOrderDocumentProps {
  data: QuotationFullContext;
}

// This is the main PDF orchestrator. Here we configure the A5 page size and global margins.
export function WorkOrderDocument({ data }: WorkOrderDocumentProps) {
  return (
    <Document title={`Orden de Trabajo - ${data.id}`} author="Geek Design System">
      <Page size="A5" style={styles.page}>
        <PDFHeader sucursal={data.sucursal} contacto={data.contacto_direccion} />

        <View style={styles.metaContainer}>
          <Text style={styles.metaItem}>
            FOLIO: <Text style={styles.metaValue}>{data.id}</Text>
          </Text>
          <Text style={styles.metaItem}>
            VALIDACIÓN: <Text style={styles.metaValue}>{data.fecha_validacion}</Text>
          </Text>
        </View>

        <PDFServiceTable
          servicios={data.servicios}
          resumen={data.resumen}
          currency={data.currency}
        />

        <PDFFooter terminos={data.terminos} />

        <Text
          style={styles.footerPageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
