import { Text } from "@react-pdf/renderer";
import React from "react";

import { styles } from "../styles";

export function CompanySlogan() {
  return (
    <Text style={styles.companySlogan}>
      IMAGINA <Text style={{ color: "#E11D48" }}>•</Text> DISEÑA{" "}
      <Text style={{ color: "#E11D48" }}>•</Text> CORTA <Text style={{ color: "#E11D48" }}>•</Text>{" "}
      CREA
    </Text>
  );
}
