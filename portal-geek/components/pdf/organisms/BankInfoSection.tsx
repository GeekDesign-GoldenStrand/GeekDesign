import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import path from 'path';
import { styles } from '../styles';
import { CompanySlogan } from '../molecules/CompanySlogan';

export const BankInfoSection = () => {
  const banbajioLogoPath = path.join(process.cwd(), 'public', 'banbajio_oficial.png');

  return (
    <View style={styles.bankInfoContainer} wrap={false}>
      <View style={styles.bankInfoHeader}>
        <Text style={styles.bankInfoHeaderText}>Transferencias y Trámites en Banco</Text>
      </View>
      <View style={styles.bankInfoBody}>
        <View style={styles.bankInfoLeft}>
          <View style={[styles.companyTextContainer, { alignItems: 'center' }]}>
            <Text style={[styles.companyName, { fontSize: 24 }]}>GEEK DESIGN</Text>
            <CompanySlogan />
          </View>
        </View>
        <View style={styles.bankInfoRight}>
          <Text style={styles.bankInfoText}>Número de cuenta Banco del Bajío: 21 757 380 202 1</Text>
          <Text style={styles.bankInfoText}>CLABE interbancaria: 030 68090001426699 3</Text>
          <View style={styles.bankInfoFooter}>
            <Image src={banbajioLogoPath} style={styles.bankInfoLogoImage} />
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={[styles.bankInfoText, { marginBottom: 1 }]}>Geek Design S. de R.L.</Text>
              <Text style={[styles.bankInfoText, { marginBottom: 1 }]}>RFC: GDE 120131 IV9</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
