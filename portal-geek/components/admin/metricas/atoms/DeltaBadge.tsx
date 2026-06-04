import { calculateDelta } from "../utils";

export function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const percentage = calculateDelta(current, previous);
  const isPositive = diff >= 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
        isPositive
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {isPositive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 15l7-7 7 7"
          ></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      )}
      <span>{isPositive ? "+" : ""}</span>
      <span>{percentage.toFixed(1)}%</span>
    </div>
  );
}
