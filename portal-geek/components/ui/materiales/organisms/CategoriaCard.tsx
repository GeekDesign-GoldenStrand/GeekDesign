"use client";

import Image from "next/image";
import { useState } from "react";

import { EditIcon } from "@/components/ui/atoms/icons";
import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import { MaterialGroupCard } from "@/components/ui/materiales/organisms/MaterialGroupCard";
import type { MaterialCardProps, MaterialesVisibleColumns } from "@/types";

interface CategoriaCardProps {
  categoria: MaterialCardProps;
  visibleColumns: MaterialesVisibleColumns;
  gridTemplateColumns: string;
  onEdit: (material: MaterialCardProps) => void;
  onViewProveedores: (materialId: number, materialName: string) => void;
  onAddSubMaterial: (groupId: number) => void;
  onAddGrupo: (categoriaId: number) => void;
}

export function CategoriaCard({
  categoria,
  visibleColumns,
  gridTemplateColumns,
  onEdit,
  onViewProveedores,
  onAddSubMaterial,
  onAddGrupo,
}: CategoriaCardProps) {
  const [expanded, setExpanded] = useState(true);
  const children = categoria.subMateriales ?? [];
  const grupos = children.filter((c) => c.tipo === "grupo");
  const individuales = children.filter((c) => c.tipo === "individual");
  const childCount = children.length;

  return (
    <div className="rounded-[7px] shadow-[0_2px_7px_rgba(0,0,0,0.14)] overflow-hidden">
      {/* Categoría header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#fdecec] border-l-[3px] border-l-[#1e1e1e]">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Contraer" : "Expandir"} categoría ${categoria.name}`}
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
          <span className="text-[15px] font-semibold uppercase tracking-wide text-[#1e1e1e] truncate">
            {categoria.name}
          </span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-[#1e1e1e] text-white text-[11px] font-medium">
            {childCount} elemento{childCount !== 1 ? "s" : ""}
          </span>
          {categoria.description && (
            <span className="hidden md:block text-[12px] text-[#575757] truncate">
              {categoria.description}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {visibleColumns.image && (
            <div className="relative h-[3.75rem] w-[3.75rem] rounded-[4px] overflow-hidden bg-[#d9d9d9] shrink-0">
              {categoria.imageUrl ? (
                <Image
                  src={categoria.imageUrl}
                  alt={categoria.name}
                  fill
                  sizes="3.75rem"
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              ) : null}
            </div>
          )}
          <button
            type="button"
            onClick={() => onAddGrupo(categoria.id)}
            className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#1e1e1e] rounded-[6px] hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
          >
            + Agregar grupo
          </button>
          <button
            type="button"
            onClick={() => onEdit(categoria)}
            aria-label={`Editar categoría ${categoria.name}`}
            className="p-2 text-[#1e1e1e] hover:opacity-70 transition-opacity"
          >
            <EditIcon size={18} />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && (
        <div className="bg-white">
          {childCount === 0 ? (
            <p className="px-8 py-4 text-[13px] text-[#8e908f] italic">
              Sin elementos aún. Crea un grupo o material individual y asígnalo a esta categoría.
            </p>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
