import React from 'react';
import { View, Image } from '@react-pdf/renderer';
import path from 'path';

export const SignatureSection = () => {
  const signaturePath = path.join(process.cwd(), 'public', 'firma_cropped.png');
  
  return (
    <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 20 }} wrap={false}>
      <Image src={signaturePath} style={{ width: 180, height: 'auto' }} />
    </View>
  );
};
