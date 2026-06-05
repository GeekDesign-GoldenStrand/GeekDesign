import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { requireSection } from "@/lib/auth/page-guard";

import MaquinasGrid from "./maquinas-grid";

export const metadata: Metadata = { title: "Máquinas" };

export default async function MaquinasPage() {
  await requireSection("maquinas");

  return (
    <div>
      <AdminHeader title="Máquinas" />
      <MaquinasGrid />
    </div>
  );
}
