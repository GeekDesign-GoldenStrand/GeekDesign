import React from 'react';
import { View } from '@react-pdf/renderer';
import { styles } from '../styles';

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.tableRow}>{children}</View>
);
