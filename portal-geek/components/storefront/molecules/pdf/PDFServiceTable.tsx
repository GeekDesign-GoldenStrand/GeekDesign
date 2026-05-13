import { Text, View, StyleSheet } from "@react-pdf/renderer";

import type { QuotationItem } from "@/types";

const styles = StyleSheet.create({
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f9f9f9",
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColDesc: {
    width: "40%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColQty: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    textAlign: "center",
  },
  tableColPrice: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    textAlign: "right",
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: "bold",
    color: "#df2646",
    textTransform: "uppercase",
  },
  tableCell: {
    margin: 5,
    fontSize: 9,
    color: "#1e1e1e",
  },
  tableCellDesc: {
    margin: 5,
    fontSize: 8,
    color: "#575757",
  },
  summaryContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryBox: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#575757",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e1e1e",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#df2646",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#df2646",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#df2646",
  },
});

interface PDFServiceTableProps {
  servicios: QuotationItem[];
  resumen: {
    subtotal: number;
    iva: number;
    total: number;
  };
  currency: string;
}

export function PDFServiceTable({ servicios, resumen, currency }: PDFServiceTableProps) {
  return (
    <View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColDesc}>
            <Text style={styles.tableCellHeader}>Servicio / Especificaciones</Text>
          </View>
          <View style={styles.tableColQty}>
            <Text style={styles.tableCellHeader}>Cant</Text>
          </View>
          <View style={styles.tableColPrice}>
            <Text style={styles.tableCellHeader}>Unitario</Text>
          </View>
          <View style={styles.tableColPrice}>
            <Text style={styles.tableCellHeader}>Total</Text>
          </View>
        </View>

        {servicios.map((servicio) => (
          <View style={styles.tableRow} key={servicio.id}>
            <View style={styles.tableColDesc}>
              <Text style={styles.tableCell}>{servicio.nombre}</Text>
              <Text style={styles.tableCellDesc}>{servicio.detalles_cliente}</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={styles.tableCell}>1</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCell}>
                ${(servicio.precio_nuevo || servicio.precio_anterior).toLocaleString()}
              </Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCell}>
                ${(servicio.precio_nuevo || servicio.precio_anterior).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${resumen.subtotal.toLocaleString()} {currency}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>IVA (16%)</Text>
            <Text style={styles.summaryValue}>
              ${resumen.iva.toLocaleString()} {currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              ${resumen.total.toLocaleString()} {currency}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
