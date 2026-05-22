import { View, Text } from "@react-pdf/renderer";
import React from "react";

import { styles } from "../styles";

interface TableCellProps {
  children: React.ReactNode;
  width?: string;
  isHeader?: boolean;
}

export function TableCell({ children, width, isHeader = false }: TableCellProps) {
  const baseStyle = isHeader ? styles.tableColHeader : styles.tableCol;
  const viewStyle = width ? { ...baseStyle, width } : baseStyle;
  const textStyle = isHeader ? styles.tableCellHeader : styles.tableCell;

  return (
    <View style={viewStyle}>
      {typeof children === "string" || typeof children === "number" ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
