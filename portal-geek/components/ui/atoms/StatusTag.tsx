import { CaretRight } from "@phosphor-icons/react/dist/ssr";

export type StatusValue = "Activo" | "Inactivo" | "Activa" | "Inactiva" | (string & {});

const STATUS_CONFIGS: Record<string, { color: string; bg: string; border: string }> = {
  Activo: { color: "#00c853", bg: "rgba(0,200,83,0.07)", border: "#00c853" },
  Inactivo: { color: "#ffb300", bg: "rgba(255,179,0,0.07)", border: "#ffb300" },
  Activa: { color: "#00c853", bg: "rgba(0,200,83,0.07)", border: "#00c853" },
  Inactiva: { color: "#ffb300", bg: "rgba(255,179,0,0.07)", border: "#ffb300" },
};

const DEFAULT = { color: "#8e908f", bg: "rgba(142,144,143,0.07)", border: "#8e908f" };

interface StatusTagProps {
  status: string;
}

export function StatusTag({ status }: StatusTagProps) {
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT;

  return (
    <div
      className="inline-flex min-h-[24px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
      style={{ minWidth: "98px", border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
    >
      <span
        className="font-ibm-plex text-[14px] font-medium leading-none"
        style={{ color: cfg.color }}
      >
        {status}
      </span>
      <CaretRight size={8} color={cfg.color} weight="bold" aria-hidden />
    </div>
  );
}
