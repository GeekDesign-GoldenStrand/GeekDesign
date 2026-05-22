import type { Metadata } from "next";

import { FolioSearch } from "@/components/storefront/organisms/FolioSearch";

export const metadata: Metadata = { title: "Solicitar cotización" };

export default function CotizacionPage() {
  return (
    <div className="bg-[#fcfcfc] min-h-[calc(100vh-106px)] flex items-center justify-center">
      <FolioSearch />
    </div>
  );
}
