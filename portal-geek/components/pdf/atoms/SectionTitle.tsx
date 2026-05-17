import React from 'react';
import { Text } from '@react-pdf/renderer';
import { styles } from '../styles';

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);
