"use client";

import { CurrencyCircleDollar } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import { isValidMoneyInput } from "@/lib/utils/money";

interface Props {
  idPedido: number;
  /** Anticipo actual (Decimal serializado) o null si aún no se define. */
  montoAnticipo: string | null;
  /** Refresca el detalle del pedido tras guardar. */
  onSaved: () => Promise<void>;
}

function money(value: string | number) {
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

// ST-17 §0 — Dirección fija el anticipo del pedido. Al guardar, el backend
// envía al cliente el correo con el enlace de pago de Mercado Pago.
export function PedidoAnticipoCard({ idPedido, montoAnticipo, onSaved }: Props) {
  const [value, setValue] = useState(montoAnticipo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSave() {
    const monto = parseFloat(value);
    if (isNaN(monto) || monto < 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch(`/api/pedidos/${idPedido}/anticipo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto_anticipo: monto }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar el anticipo");
      setOk(true);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el anticipo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Anticipo" icon={<CurrencyCircleDollar size={15} />}>
      <p className="text-[14px] text-gray-600 mb-3">
        Anticipo actual:{" "}
        <span className="font-medium text-gray-900">
          {montoAnticipo != null ? money(montoAnticipo) : "Sin definir"}
        </span>
      </p>
      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="block text-[12px] font-medium text-gray-500 mb-1">
            Monto del anticipo (MXN)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              if (isValidMoneyInput(e.target.value)) setValue(e.target.value);
            }}
            placeholder="0.00"
            className="w-full h-10 rounded-[8px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#df2646]"
          />
        </label>
        <Button size="sm" loading={saving} onClick={handleSave}>
          Guardar y notificar
        </Button>
      </div>
      {error && <p className="text-[13px] text-red-600 font-medium mt-2">{error}</p>}
      {ok && !error && (
        <p className="text-[13px] text-green-700 font-medium mt-2">
          Anticipo guardado. Se envió el enlace de pago al cliente.
        </p>
      )}
    </SectionCard>
  );
}
