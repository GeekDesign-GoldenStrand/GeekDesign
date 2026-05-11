const ESTATUS_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Cotizacion: { text: "#8e908f", bg: "rgba(142,144,143,0.1)", border: "#8e908f" },
  Pagado: { text: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "#16a34a" },
  En_cola: { text: "#006aff", bg: "rgba(0,106,255,0.08)", border: "#006aff" },
  Aprobacion_diseno: { text: "#d97706", bg: "rgba(217,119,6,0.08)", border: "#d97706" },
  En_produccion: { text: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "#7c3aed" },
  Entregado: { text: "#065f46", bg: "rgba(6,95,70,0.08)", border: "#065f46" },
  Facturado: { text: "#1e40af", bg: "rgba(30,64,175,0.08)", border: "#1e40af" },
};
const DEFAULT_STYLE = { text: "#8e908f", bg: "rgba(142,144,143,0.1)", border: "#8e908f" };

export function EstatusBadge({ estatus }: { estatus: string }) {
  const cfg = ESTATUS_STYLES[estatus] ?? DEFAULT_STYLE;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-[7px] text-[12px] font-medium border font-ibm-plex"
      style={{ color: cfg.text, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      {estatus.replace("_", " ")}
    </span>
  );
}
