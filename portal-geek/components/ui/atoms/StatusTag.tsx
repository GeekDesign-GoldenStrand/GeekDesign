export type StatusValue = "Activo" | "Inactivo" | (string & {});

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activo: { color: "#ff0000", bg: "rgba(255,0,0,0.07)" },
  Inactivo: { color: "#090909", bg: "rgba(0,0,0,0.07)" },
};

const DEFAULT = { color: "#8e908f", bg: "rgba(142,144,143,0.07)" };

function ChevronRight({ color }: { color: string }) {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
      <path
        d="M1 1l4 4-4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StatusTagProps {
  status: string;
}

export function StatusTag({ status }: StatusTagProps) {
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT;

  return (
    <div
      className="inline-flex h-[24px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
      style={{ minWidth: "98px", border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
    >
      <span
        className="font-ibm-plex text-[14px] font-medium leading-none"
        style={{ color: cfg.color }}
      >
        {status}
      </span>
      <ChevronRight color={cfg.color} />
    </div>
  );
}
