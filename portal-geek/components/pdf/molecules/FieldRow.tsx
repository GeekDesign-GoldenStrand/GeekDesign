import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

export const FieldRow = ({ label, value }: { label: string; value: string | undefined | null }) => {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};
