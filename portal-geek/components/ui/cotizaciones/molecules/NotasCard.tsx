import { NotePencil } from "@phosphor-icons/react";

import { SectionCard } from "../atoms/SectionCard";

interface NotasCardProps {
  notas: string;
}

export function NotasCard({ notas }: NotasCardProps) {
  return (
    <SectionCard title="Notas" icon={<NotePencil size={15} />}>
      <div
        className="bg-gray-50 rounded-r-lg text-[15px] text-gray-700 leading-relaxed italic p-3"
        style={{ borderLeft: "3px solid #9FE1CB", borderRadius: "0 8px 8px 0" }}
      >
        {notas}
      </div>
    </SectionCard>
  );
}
