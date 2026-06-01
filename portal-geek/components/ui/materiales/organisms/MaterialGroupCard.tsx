"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { EditIcon } from "@/components/ui/atoms/icons";
import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import type { MaterialCardProps } from "@/types";

interface MaterialGroupCardProps {
  group: MaterialCardProps;
  gridTemplateColumns: string;
  canViewProveedores?: boolean;
  onEdit: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
  onAddSubMaterial: (groupId: number) => void;
}

export function MaterialGroupCard({
  group,
  gridTemplateColumns,
  canViewProveedores = false,
  onEdit,
  onViewProveedores,
  onAddSubMaterial,
}: MaterialGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const subCount = group.subMateriales?.length ?? 0;

  return (
    <div className="rounded shadow overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#f0f0f0] border-l-[3px] border-l-[#e42200]">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Contraer" : "Expandir"} grupo ${group.name}`}
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
          <span className="text-sm font-semibold text-[#1e1e1e] truncate">{group.name}</span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-[#e42200] text-white text-[11px] font-medium">
            {subCount} variante{subCount !== 1 ? "s" : ""}
          </span>
          {group.description && (
            <span className="hidden md:block text-sm text-[#575757] truncate">
              {group.description}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {group.imageUrl && (
            <div className="relative h-15 w-15 rounded-sm overflow-hidden bg-[#d9d9d9] shrink-0">
              <Image
                src={group.imageUrl}
                alt={group.name}
                fill
                sizes="3.75rem"
                unoptimized
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onAddSubMaterial(group.id)}
          >
            + Agregar variante
          </Button>
          <button
            type="button"
            onClick={() => onEdit(group)}
            aria-label={`Editar grupo ${group.name}`}
            className="p-2 text-[#1e1e1e] hover:opacity-70 transition-opacity"
          >
            <EditIcon size={18} />
          </button>
        </div>
      </div>

      {/* Sub-materials list */}
      {expanded && (
        <div className="bg-[#fafafa]">
          {subCount === 0 ? (
            <p className="px-8 py-4 text-sm text-[#8e908f] italic">
              Sin variantes aún. Usa &quot;Agregar variante&quot; para crear la primera.
            </p>
          ) : (
            <div className="divide-y divide-[#ebebeb]">
              {group.subMateriales!.map((sub) => (
                <MaterialCard
                  key={sub.id}
                  {...sub}
                  variant="sub"
                  showProveedores={canViewProveedores}
                  gridTemplateColumns={gridTemplateColumns}
                  onEdit={onEdit}
                  onViewProveedores={onViewProveedores}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
