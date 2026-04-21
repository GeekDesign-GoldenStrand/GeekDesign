"use client";

import { useState } from "react";

import TercerosGrid from "@/components/ui/terceros/TercerosGrid";
import TercerosHeader from "@/components/ui/terceros/TercerosHeader";
import TercerosToolbar from "@/components/ui/terceros/TercerosToolbar";
import type { TerceroCardProps, TercerosTab as Tab } from "@/types";

const MOCK_DATA: TerceroCardProps[] = [
  {
    companyName: "Espejo Precioso SA. de CV.",
    contactName: "Paola Hernández",
    location: "Querétaro",
    role: "Instalador",
    status: "Activo",
    email: "anapao126@hotmail.com",
    phone: "771 234 9389",
  },
  {
    companyName: "Espejo Precioso SA. de CV.",
    contactName: "Paola Hernández",
    location: "Querétaro",
    role: "Instalador",
    status: "Activo",
    email: "anapao126@hotmail.com",
    phone: "771 234 9389",
  },
  {
    companyName: "Espejo Precioso SA. de CV.",
    contactName: "Paola Hernández",
    location: "Querétaro",
    role: "Instalador",
    status: "Inactivo",
    email: "anapao126@hotmail.com",
    phone: "771 234 9389",
  },
  {
    companyName: "Espejo Precioso SA. de CV.",
    contactName: "Paola Hernández",
    location: "Querétaro",
    role: "Instalador",
    status: "Activo",
    email: "anapao126@hotmail.com",
    phone: "771 234 9389",
  },
];

const TABS: Tab[] = ["Todos", "Proveedores", "Instaladores"];

export default function TercerosPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Instaladores");
  const [search, setSearch] = useState("");

  const filtered = MOCK_DATA.filter((item) => {
    const matchesTab =
      activeTab === "Todos" ||
      (activeTab === "Instaladores" && item.role === "Instalador") ||
      (activeTab === "Proveedores" && item.role === "Proveedor");

    const matchesSearch =
      !search ||
      item.companyName.toLowerCase().includes(search.toLowerCase()) ||
      item.contactName.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-white">
      <TercerosHeader />
      <main className="p-8">
        <TercerosToolbar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
        />
        <TercerosGrid items={filtered} />
      </main>
    </div>
  );
}
