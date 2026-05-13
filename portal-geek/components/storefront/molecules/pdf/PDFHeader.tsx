import { Text, View, StyleSheet } from "@react-pdf/renderer";

import type { SucursalInfo, DirectionContact } from "@/types";

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#df2646",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoContainer: {
    width: "30%",
  },
  infoContainer: {
    width: "65%",
    textAlign: "right",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#df2646",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  sucursalName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e1e1e",
    marginBottom: 2,
  },
  address: {
    fontSize: 9,
    color: "#575757",
    lineHeight: 1.2,
  },
  contactInfo: {
    fontSize: 9,
    color: "#1e1e1e",
    fontWeight: "bold",
    marginTop: 5,
  },
});

interface PDFHeaderProps {
  sucursal: SucursalInfo;
  contacto: DirectionContact;
}

export function PDFHeader({ sucursal, contacto }: PDFHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        {/* We use a text placeholder since we don't have a stable external URL for the physical logo at this moment */}
        <Text style={styles.title}>Geek Design</Text>
        <Text style={styles.address}>Creatividad sin límites</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.sucursalName}>Sucursal {sucursal.nombre}</Text>
        <Text style={styles.address}>
          {sucursal.direccion}, {sucursal.colonia}
        </Text>
        <Text style={styles.address}>
          {sucursal.municipio}, {sucursal.estado}, CP {sucursal.cp}
        </Text>
        <View style={styles.contactInfo}>
          <Text>Atención: {contacto.nombre}</Text>
          <Text>
            {contacto.email} | {contacto.telefono}
          </Text>
        </View>
      </View>
    </View>
  );
}
