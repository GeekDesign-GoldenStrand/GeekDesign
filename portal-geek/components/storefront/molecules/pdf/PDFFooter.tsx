import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingTop: 20,
  },
  legalTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e1e1e",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  terms: {
    fontSize: 8,
    color: "#575757",
    textAlign: "justify",
    lineHeight: 1.4,
    marginBottom: 20,
  },
  acceptanceBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 4,
    marginBottom: 30,
  },
  acceptanceText: {
    fontSize: 9,
    color: "#1e1e1e",
    fontWeight: "bold",
    textAlign: "center",
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  signatureLine: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
    paddingTop: 5,
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 9,
    color: "#575757",
  },
});

interface PDFFooterProps {
  terminos: string;
}

export function PDFFooter({ terminos }: PDFFooterProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.acceptanceBox}>
        <Text style={styles.acceptanceText}>
          AL APROBAR ESTA COTIZACIÓN, EL CLIENTE ACEPTA LOS TÉRMINOS Y CONDICIONES AQUÍ DESCRITOS
          PARA LA EJECUCIÓN DEL SERVICIO.
        </Text>
      </View>

      <Text style={styles.legalTitle}>Términos y Condiciones</Text>
      <Text style={styles.terms}>{terminos}</Text>

      <View style={styles.signatureContainer}>
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLabel}>Firma de Conformidad Cliente</Text>
        </View>
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLabel}>Geek Design - Dirección</Text>
        </View>
      </View>
    </View>
  );
}
