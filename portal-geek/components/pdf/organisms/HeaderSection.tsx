import path from "path";

import { View, Text, Image } from "@react-pdf/renderer";
import React from "react";

import { CompanySlogan } from "../molecules/CompanySlogan";
import { styles } from "../styles";

interface Branch {
  nombre_sucursal: string;
  direccion: string;
}

interface Quotation {
  fecha_aprobacion?: string | Date | null;
  fecha_validacion?: string | Date | null;
  fecha_creacion: string | Date;
  folio?: string | null;
  id_cotizacion: number;
}

interface HeaderProps {
  branch: Branch;
  quotation: Quotation;
}

export function HeaderSection({ branch, quotation }: HeaderProps) {
  const logoPath = path.join(process.cwd(), "public", "geekdesign.png");

  return (
    <View style={styles.header}>
      <View style={styles.companyInfo}>
        <View style={styles.logoContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.logo} src={logoPath} />
          <View style={styles.companyTextContainer}>
            <Text style={styles.companyName}>GEEK DESIGN</Text>
            <CompanySlogan />
          </View>
        </View>
        <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>
          {branch?.nombre_sucursal || "Sucursal Principal"}
        </Text>
        <Text style={styles.companyDetail}>{branch?.direccion || "Querétaro, Querétaro"}</Text>
        <Text style={styles.companyDetail}>Administración General</Text>
      </View>

      <View style={[styles.headerInfo, { alignItems: "flex-end" }]}>
        <Text style={styles.title}>ORDEN DE TRABAJO</Text>
        <View style={{ marginTop: 8, width: 140, textAlign: "left" }}>
          <Text style={[styles.branchText, { textAlign: "left" }]}>
            Fecha:{" "}
            {new Date(
              quotation.fecha_aprobacion || quotation.fecha_validacion || quotation.fecha_creacion
            ).toLocaleDateString("es-MX")}
          </Text>
          <Text style={[styles.branchText, { textAlign: "left" }]}>
            Orden: {quotation.folio || `OT-${quotation.id_cotizacion}`}
          </Text>
          <Text style={[styles.branchText, { textAlign: "left" }]}>Responsable: Andrea Díaz</Text>
          <Text style={[styles.branchText, { textAlign: "left" }]}>Teléfono: 442 254 6700</Text>
          <Text style={[styles.branchText, { textAlign: "left" }]}>
            E-mail: laser@geekdesign.mx
          </Text>
        </View>
      </View>
    </View>
  );
}
