import { View, Text, Image } from "@react-pdf/renderer";
import React from "react";

import { SectionTitle } from "../atoms/SectionTitle";
import { TableCell } from "../atoms/TableCell";
import { formatCurrency } from "../constants";
import { TableRow } from "../molecules/TableRow";
import { styles } from "../styles";

interface ServiceSpec {
  servicio?: {
    nombre_servicio: string;
  } | null;
  archivo?: {
    url_archivo?: string | null;
  } | null;
  material?: {
    nombre_material: string;
  } | null;
  notas?: string | null;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

export function SpecsTableSection({ specs }: { specs: ServiceSpec[] }) {
  return (
    <View style={styles.section}>
      <SectionTitle>Detalles del Servicio</SectionTitle>
      <View style={styles.table}>
        {/* Table Header */}
        <TableRow>
          <TableCell isHeader width="25%">
            Producto
          </TableCell>
          <TableCell isHeader width="15%">
            Imagen
          </TableCell>
          <TableCell isHeader width="22%">
            Descripción
          </TableCell>
          <TableCell isHeader width="10%">
            Cantidad
          </TableCell>
          <TableCell isHeader width="13%">
            Precio U.
          </TableCell>
          <TableCell isHeader width="15%">
            Total
          </TableCell>
        </TableRow>

        {/* Table Body */}
        {specs.map((spec: ServiceSpec, index: number) => (
          <TableRow key={index}>
            <TableCell width="25%">
              <Text style={styles.tableCell}>{spec.servicio?.nombre_servicio}</Text>
            </TableCell>
            <TableCell width="15%">
              {spec.archivo?.url_archivo ? (
                /* eslint-disable-next-line jsx-a11y/alt-text */
                <Image
                  src={spec.archivo.url_archivo}
                  style={{ width: 40, height: 40, objectFit: "cover" }}
                />
              ) : (
                <Text style={{ fontSize: 8, color: "#9CA3AF" }}>N/A</Text>
              )}
            </TableCell>
            <TableCell width="22%">
              {spec.material?.nombre_material && (
                <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 2 }}>
                  {spec.material.nombre_material}
                </Text>
              )}
              {spec.notas && <Text style={{ fontSize: 8, color: "#9CA3AF" }}>{spec.notas}</Text>}
            </TableCell>
            <TableCell width="10%">
              <Text style={[styles.tableCell, { textAlign: "center" }]}>{spec.cantidad}</Text>
            </TableCell>
            <TableCell width="13%">
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                {formatCurrency(Number(spec.precio_unitario))}
              </Text>
            </TableCell>
            <TableCell width="15%">
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                {formatCurrency(Number(spec.subtotal))}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </View>
    </View>
  );
}
