import path from "path";

import { View, Image } from "@react-pdf/renderer";
import React from "react";

export function SignatureSection() {
  const signaturePath = path.join(process.cwd(), "public", "firma_cropped.png");

  return (
    <View style={{ alignItems: "center", marginTop: 30, marginBottom: 20 }} wrap={false}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={signaturePath} style={{ width: 180, height: "auto" }} />
    </View>
  );
}
