import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';
import { termsAndConditions } from '../constants';

export const TermsSection = () => (
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
