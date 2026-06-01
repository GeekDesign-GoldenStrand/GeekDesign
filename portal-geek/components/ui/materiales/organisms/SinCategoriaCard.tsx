"use client";

import { useState } from "react";

import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import { MaterialGroupCard } from "@/components/ui/materiales/organisms/MaterialGroupCard";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface SinCategoriaCardProps {
  grupos: MaterialCardProps[];
  individuales: MaterialCardProps[];
  visibleColumns: MaterialesVisibleColumns;
  gridTemplateColumns: string;
  onEdit: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
  onAddSubMaterial: (groupId: number) => void;
}

// Presentational-only bucket for grupos/individuales with id_material_padre = NULL.
// "Sin categoría" is NOT a real row — it's the absence of a categoría. This card
// groups orphan roots under a header so the UI reads like a categoría without the
// data foot-guns of a real default row (it can't be edited, renamed, or deleted).
export function SinCategoriaCard({
  grupos,
  individuales,
  visibleColumns,
  gridTemplateColumns,
  onEdit,
  onViewProveedores,
  onAddSubMaterial,
}: SinCategoriaCardProps) {
  const [expanded, setExpanded] = useState(true);
  const childCount = grupos.length + individuales.length;

  return (
    <div className="rounded-[7px] shadow-[0_2px_7px_rgba(0,0,0,0.14)] overflow-hidden">
      {/* Header — neutral styling to read as "no category", distinct from real ones. */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#ededed] border-l-[3px] border-l-[#8e908f]">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Contraer" : "Expandir"} sin categoría`}
        >
          <svg
            className={`w-4 h-4 shrink-0 text-[#575757] transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="min-w-0 max-w-[40%] text-[15px] font-semibold uppercase tracking-wide text-[#575757] italic truncate">
            Sin categoría
          </span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-[#8e908f] text-white text-[11px] font-medium">
            {childCount} elemento{childCount !== 1 ? "s" : ""}
          </span>
        </button>
      </div>

      {/* Children */}
      {expanded && (
        <div className="bg-white">
          <div className="space-y-2 px-2 py-2">
            {grupos.map((group) => (
              <MaterialGroupCard
                key={group.id}
                group={group}
                visibleColumns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                onEdit={onEdit}
                onViewProveedores={onViewProveedores}
                onAddSubMaterial={onAddSubMaterial}
              />
            ))}
            {individuales.map((item) => (
              <MaterialCard
                key={item.id}
                {...item}
                visibleColumns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                onEdit={onEdit}
                onViewProveedores={onViewProveedores}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
