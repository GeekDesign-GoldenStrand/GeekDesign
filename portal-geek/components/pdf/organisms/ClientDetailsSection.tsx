import { View } from "@react-pdf/renderer";
import React from "react";

import { SectionTitle } from "../atoms/SectionTitle";
import { FieldRow } from "../molecules/FieldRow";
import { styles } from "../styles";

interface Client {
  nombre_cliente: string;
  empresa?: string | null;
  correo_electronico: string;
  numero_telefono: string;
}

export function ClientDetailsSection({ client }: { client: Client }) {
  return (
    <View style={styles.section}>
      <SectionTitle>Datos del Cliente</SectionTitle>
      <FieldRow label="Nombre:" value={client.nombre_cliente} />
      <FieldRow label="Empresa:" value={client.empresa} />
      <FieldRow label="Email:" value={client.correo_electronico} />
      <FieldRow label="Teléfono:" value={client.numero_telefono} />
    </View>
  );
}
