import { View, Text } from "@react-pdf/renderer";
import React from "react";

import { termsAndConditions } from "../constants";
import { styles } from "../styles";

export function TermsSection() {
  return (
    <View style={styles.footer} wrap={true}>
      <Text style={styles.termsTitle}>Términos y Condiciones</Text>
      {termsAndConditions.map((term, index) => (
        <View style={styles.termItem} key={index}>
          <Text style={styles.termItemText}>
            <Text style={styles.termItemTitle}>{term.title}</Text> — {term.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
