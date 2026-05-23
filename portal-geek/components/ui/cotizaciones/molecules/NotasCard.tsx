import { NotePencil } from "@phosphor-icons/react";
import React from "react";

import { SectionCard } from "../atoms/SectionCard";

interface NotasCardProps {
  notas: string;
}

export function NotasCard({ notas }: NotasCardProps) {
  return (
    <SectionCard title="Notas" icon={<NotePencil size={15} />}>
      <div
        className="bg-gray-50 rounded-r-lg text-[14px] text-gray-500 leading-relaxed italic p-3"
        style={{ borderLeft: "3px solid #9FE1CB", borderRadius: "0 8px 8px 0" }}
      >
        {notas}
      </div>
    </SectionCard>
  );
}
