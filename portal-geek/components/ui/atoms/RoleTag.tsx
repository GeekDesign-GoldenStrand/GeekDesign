"use client";

import { useEffect, useRef, useState } from "react";

import { CaretRight } from "@phosphor-icons/react";

export type RoleName = "Administrador" | "Colaborador" | "Finanzas" | "Direccion" | (string & {});

interface RoleConfig {
  color: string;
  bg: string;
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  Administrador: { color: "#006aff", bg: "rgba(0,106,255,0.07)" },
  Colaborador: { color: "#ff9500", bg: "rgba(255,149,0,0.07)" },
  Finanzas: { color: "#28b12d", bg: "rgba(40,177,45,0.07)" },
  Direccion: { color: "#df2646", bg: "rgba(223,38,70,0.07)" },
};

const DEFAULT_CONFIG: RoleConfig = {
  color: "#8e908f",
  bg: "rgba(142,144,143,0.07)",
};


interface RoleTagProps {
  role: string;
  roles?: { id_rol: number; nombre_rol: string }[];
  currentRolId?: number;
  onRolChange?: (newRolId: number) => void;
  saving?: boolean;
}

export function RoleTag({ role, roles, currentRolId, onRolChange, saving }: RoleTagProps) {
  const cfg = ROLE_CONFIGS[role] ?? DEFAULT_CONFIG;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const interactive = !!roles && !!onRolChange && !saving;

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar rol"
        className="flex h-[24px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default"
        style={{ minWidth: "96px", border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
      >
        <span
          className="font-ibm-plex font-medium leading-none text-[12px]"
          style={{ color: cfg.color }}
        >
          {saving ? "..." : role}
        </span>
        {interactive && <CaretRight size={8} color={cfg.color} weight="bold" aria-hidden />}
      </button>

      {open && roles && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 flex flex-col gap-2 rounded-[7px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
          style={{ minWidth: "130px" }}
        >
          {roles.map((r) => {
            const rcfg = ROLE_CONFIGS[r.nombre_rol] ?? DEFAULT_CONFIG;
            const selected = r.id_rol === currentRolId;
            return (
              <li key={r.id_rol} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onRolChange!(r.id_rol);
                    setOpen(false);
                  }}
                  className="w-full flex h-[28px] items-center justify-center rounded-[7px] px-3 font-ibm-plex font-medium text-[12px] transition-opacity hover:opacity-80"
                  style={{
                    border: `1px solid ${rcfg.color}`,
                    backgroundColor: selected ? rcfg.bg : "transparent",
                    color: rcfg.color,
                  }}
                >
                  {r.nombre_rol}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
