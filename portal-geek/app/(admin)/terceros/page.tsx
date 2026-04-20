"use client";

import { useState } from "react";

import type { TerceroCardProps } from "@/components/admin/terceroCard";
import TerceroCard from "@/components/admin/terceroCard";

type Tab = "Todos" | "Proovedores" | "Instaladores";

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

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export default function TercerosPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Instaladores");
  const [search, setSearch] = useState("");

  const tabs: Tab[] = ["Todos", "Proovedores", "Instaladores"];

  const filtered = MOCK_DATA.filter((item) => {
    const matchesTab =
      activeTab === "Todos" ||
      (activeTab === "Instaladores" && item.role === "Instalador") ||
      (activeTab === "Proovedores" && item.role === "Proveedor");

    const matchesSearch =
      !search ||
      item.companyName.toLowerCase().includes(search.toLowerCase()) ||
      item.contactName.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="font-['IBM_Plex_Sans_JP',sans-serif] min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 h-29.5 bg-white shadow-[0px_4px_7px_0px_rgba(0,0,0,0.25)] flex items-center px-8">
        <h1 className="text-[40px] font-semibold text-[#1e1e1e]">Terceros</h1>
      </header>

      {/* Content */}
      <main className="p-8">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[18px] font-medium transition-all px-4 py-1.5 rounded-[20px] ${
                  activeTab === tab
                    ? "bg-[rgba(0,106,255,0.65)] text-white"
                    : "text-[#1e1e1e] hover:opacity-70"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 border border-[#b9b8b8] rounded-sm px-3 py-2 bg-white w-109.75">
            <input
              type="text"
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[14px] font-medium text-[#1e1e1e] placeholder:text-[#8e908f] outline-none"
            />
            <span className="text-[#8e908f]">
              <SearchIcon />
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Agregar button */}
            <button className="flex items-center gap-1.5 bg-[#e8e8e8] border border-[#575757] text-[#575757] text-[20px] font-medium rounded-[7px] px-4 h-10.25 hover:bg-[#d8d8d8]">
              <PlusIcon />
              Agregar
            </button>

            {/* Filtrar button */}
            <button className="flex items-center gap-1.5 bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[20px] font-medium rounded-[7px] px-4 h-10.25 hover:bg-[#ffe0dc]">
              <FilterIcon />
              Filtrar
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-4 gap-5 xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">
          {filtered.map((item, i) => (
            <TerceroCard key={i} {...item} />
          ))}
        </div>
      </main>
    </div>
  );
}
