export const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

export const calculateDelta = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ── Shared chart styling constants ──────────────────────────────────────────
export const TOOLTIP_ITEM_STYLE = { color: "#111827" };
export const TOOLTIP_LABEL_STYLE = { color: "#111827", fontWeight: 600 };

export const TOOLTIP_CONTENT_STYLE = {
  borderRadius: "12px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export const AXIS_TICK = { fill: "#4b5563", fontSize: 13, fontWeight: 600 };
export const AXIS_TICK_LARGE = { fill: "#4b5563", fontSize: 14, fontWeight: 600 };

export const DASHBOARD_SELECT_CLASS =
  "bg-gray-50 border border-gray-200 text-gray-700 font-bold text-base rounded-lg focus:ring-red-500 focus:border-red-500 block p-2 cursor-pointer hover:bg-gray-100 transition-colors";

export const CUSTOM_SELECT_CLASS =
  "appearance-none bg-white border border-gray-200 text-gray-800 font-bold text-base rounded-lg focus:ring-purple-500 focus:border-purple-500 px-3 py-2 cursor-pointer shadow-sm pr-8";
