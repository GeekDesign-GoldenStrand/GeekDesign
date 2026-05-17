import { View, Text } from "@react-pdf/renderer";
import React from "react";

import { formatCurrency } from "../constants";
import { styles } from "../styles";

export function TotalsSection({ quotation }: { quotation: any }) {
  const montoTotal = Number(quotation.monto_total);
  const subtotal = montoTotal / 1.16;
  const iva = montoTotal - subtotal;

  return (
    <View style={styles.totalsContainer}>
      <View style={styles.totalsBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA (16%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(iva)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(montoTotal)}</Text>
        </View>
      </View>
    </View>
  );
}
