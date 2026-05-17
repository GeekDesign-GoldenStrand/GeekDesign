import React from 'react';
import { View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SectionTitle } from '../atoms/SectionTitle';
import { FieldRow } from '../molecules/FieldRow';

export const ClientDetailsSection = ({ client }: { client: any }) => (
  <View style={styles.section}>
    <SectionTitle>Datos del Cliente</SectionTitle>
    <FieldRow label="Nombre:" value={client.nombre_cliente} />
    <FieldRow label="Empresa:" value={client.empresa} />
    <FieldRow label="Email:" value={client.correo_electronico} />
    <FieldRow label="Teléfono:" value={client.numero_telefono} />
  </View>
);
