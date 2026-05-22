import { View } from "@react-pdf/renderer";
import React from "react";

import { styles } from "../styles";

export function TableRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.tableRow}>{children}</View>;
}
