import { ClipboardText, Image as ImageIcon } from "@phosphor-icons/react";

import type { FormulaVariable, LineItem } from "@/types/cotizacion";

import { SectionCard } from "../atoms/SectionCard";

function formatAmount(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// ── Variables pill list ───────────────────────────────────────────────────────

function VariablesList({ variables }: { variables: FormulaVariable[] }) {
  if (variables.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {variables.map((v) => (
        <span
          key={v.id_variable}
          className="inline-flex items-center gap-1 text-[12px] bg-gray-50 border border-gray-100 text-gray-700 rounded-md px-2 py-0.5"
        >
          <span className="text-gray-600">{v.etiqueta}:</span>
          <span className="font-medium text-gray-700">
            {v.valor}
            {v.unidad ? ` ${v.unidad}` : ""}
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Totals block ──────────────────────────────────────────────────────────────

interface TotalsProps {
  subtotal: number;
  discountAmount?: number;
  discountLabel?: string;
  iva?: number;
}

function TotalsBlock({ subtotal, discountAmount, discountLabel, iva }: TotalsProps) {
  const discount = discountAmount ?? 0;
  const ivaAmount = iva ?? 0;
  // Positive discount → green; negative interest → red
  const isDiscount = discount > 0;
  const displayLabel = discountLabel ?? (isDiscount ? "Descuento" : "Interés");
  const displayAmount = Math.abs(discount);
  const total = subtotal - discount + ivaAmount; // subtracting a negative adds interest
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-end gap-1.5">
      <div className="flex gap-8 text-[15px] text-gray-700">
        <span>Subtotal</span>
        <span className="min-w-[100px] text-right text-gray-800">{formatAmount(subtotal)}</span>
      </div>

      {discount !== 0 && (
        <div className="flex gap-8 text-[15px] text-gray-700">
          <span>{displayLabel}</span>
          <span
            className={`min-w-[100px] text-right ${isDiscount ? "text-red-600" : "text-green-600"}`}
          >
            {isDiscount ? "−" : "+"} {formatAmount(displayAmount)}
          </span>
        </div>
      )}

      {ivaAmount > 0 && (
        <div className="flex gap-8 text-[15px] text-gray-700">
          <span>IVA (16%)</span>
          <span className="min-w-[100px] text-right text-gray-800">{formatAmount(ivaAmount)}</span>
        </div>
      )}

      <div className="flex gap-8 text-lg font-medium mt-1">
        <span className="text-gray-900">Total</span>
        <span className="min-w-[100px] text-right text-black">{formatAmount(total)}</span>
      </div>
    </div>
  );
}

// ── LineItemsTable ────────────────────────────────────────────────────────────

interface LineItemsTableProps {
  servicios: LineItem[];
  discountAmount?: number;
  discountLabel?: string;
}

export function LineItemsTable({ servicios, discountAmount, discountLabel }: LineItemsTableProps) {
  const subtotal = servicios.reduce((acc, p) => acc + p.subtotal, 0);

  return (
    <SectionCard title="Servicio(s)" icon={<ClipboardText size={15} />}>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr>
              {["Servicio / Material", "Diseño", "Cant.", "P. Unitario", "Subtotal"].map((h) => (
                <th
                  key={h}
                  className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider pb-2.5 text-left border-b border-gray-100 px-2 last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servicios.map((item) => (
              <tr key={item.id_detalle} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-2 align-top">
                  <p className="font-medium text-gray-900">{item.nombre_servicio}</p>
                  <p className="text-[13px] text-gray-600">{item.nombre_material}</p>
                  {item.notas && (
                    <p className="text-[12px] text-gray-600 mt-1 italic">{item.notas}</p>
                  )}
                  <VariablesList variables={item.variables} />
                </td>
                <td className="py-3 px-2 align-top">
                  {item.archivo_nombre != "__PLACEHOLDER__" ? (
                    <a
                      href={`/api/admin/archivos/${item.archivo_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.archivo_nombre ?? "Ver diseño"}
                      aria-label={
                        item.archivo_nombre ? `Ver diseño: ${item.archivo_nombre}` : "Ver diseño"
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <ImageIcon size={14} />
                      Descargar
                    </a>
                  ) : (
                    <span className="text-gray-300 text-[12px]">—</span>
                  )}
                </td>
                <td className="py-3 px-2 align-top text-gray-700">{item.cantidad}</td>
                <td className="py-3 px-2 align-top text-gray-700">
                  {formatAmount(item.precio_unitario)}
                </td>
                <td className="py-3 px-2 align-top text-right font-medium text-gray-900">
                  {formatAmount(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TotalsBlock
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountLabel={discountLabel}
      />
    </SectionCard>
  );
}
