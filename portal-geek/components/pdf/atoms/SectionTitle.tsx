import { Text } from "@react-pdf/renderer";
import React from "react";

import { styles } from "../styles";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}
