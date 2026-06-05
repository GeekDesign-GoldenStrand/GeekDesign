"use client";

import { CaretRightIcon } from "@phosphor-icons/react";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

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
  const interactive = !!roles && !!onRolChange && !saving;

  const triggerButton = (
    <button
      type="button"
      disabled={!interactive}
      aria-label="Cambiar rol"
      className={`flex h-[24px] items-center ${interactive ? "justify-between" : "justify-center"} gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default`}
      style={{ minWidth: "96px", border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
    >
      <span
        className="font-ibm-plex font-medium leading-none text-[14px]"
        style={{ color: cfg.color }}
      >
        {saving ? "..." : role}
      </span>
      {interactive && <CaretRightIcon size={8} color={cfg.color} weight="bold" aria-hidden />}
    </button>
  );

  // Non-interactive mode renders just the static pill (no dropdown).
  if (!interactive || !roles) return triggerButton;

  return (
    <Popover align="start" panelClassName="min-w-[160px]" trigger={triggerButton}>
      <div className="flex flex-col gap-1">
        {roles.map((r) => (
          <PopoverItem
            key={r.id_rol}
            selected={r.id_rol === currentRolId}
            onSelect={() => onRolChange?.(r.id_rol)}
          >
            {r.nombre_rol}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}
