"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { addItem } from "@/lib/cart/storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Material {
  id_material: number;
  nombre_material: string;
}

export interface Variable {
  id_variable: number;
  nombre_variable: string;
  etiqueta: string;
  unidad: string | null;
  valor_default: number;
  editable_por_cliente: boolean;
}

interface Props {
  servicioId: number;
  nombreServicio: string;
  materiales: Material[];
  variables: Variable[];
}

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

// ─── Component ───────────────────────────────────────────────────────────────

export function FormulaVariablesForm({ servicioId, nombreServicio, materiales, variables }: Props) {
  const editables = useMemo(() => variables.filter((v) => v.editable_por_cliente), [variables]);
  const defaultValues = useMemo(
    () => Object.fromEntries(editables.map((v) => [v.nombre_variable, v.valor_default])),
    [editables]
  );

  const [idMaterial, setIdMaterial] = useState<number | null>(materiales[0]?.id_material ?? null);
  const [values, setValues] = useState<Record<string, number>>(() => ({ ...defaultValues }));
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState<number | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastRequestId = useRef(0);

  useEffect(() => {
    if (idMaterial === null) return;
    const timer = setTimeout(async () => {
      const reqId = ++lastRequestId.current;
      setCalculating(true);
      setCalcError(null);
      try {
        const res = await fetch(`/api/servicios/${servicioId}/calcular-precio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_material: idMaterial,
            variables: editables.map((v) => ({
              nombre_variable: v.nombre_variable,
              valor: values[v.nombre_variable] ?? v.valor_default,
            })),
          }),
        });
        const json = await res.json();
        if (reqId !== lastRequestId.current) return;
        if (!res.ok) {
          setCalcError(json.error ?? "Error al calcular el precio");
          setPrecioUnitario(null);
          return;
        }
        setPrecioUnitario(Number(json.data.precioUnitario));
      } catch (err) {
        if (reqId !== lastRequestId.current) return;
        setCalcError(err instanceof Error ? err.message : "Error de red");
        setPrecioUnitario(null);
      } finally {
        if (reqId === lastRequestId.current) setCalculating(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [idMaterial, values, servicioId, editables]);

  function handleVarChange(nombre: string, raw: string) {
    const num = Number(raw);
    setValues((prev) => ({ ...prev, [nombre]: Number.isFinite(num) ? num : 0 }));
  }

  function handleReset() {
    setIdMaterial(materiales[0]?.id_material ?? null);
    setValues({ ...defaultValues });
    setCantidad(1);
    setNotas("");
    setFeedback(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idMaterial === null) {
      setCalcError("Selecciona un material");
      return;
    }
    if (precioUnitario === null) {
      setCalcError("El precio aún no se ha calculado");
      return;
    }
    const material = materiales.find((m) => m.id_material === idMaterial);
    if (!material) return;

    addItem({
      servicioId,
      nombreServicio,
      id_material: idMaterial,
      nombreMaterial: material.nombre_material,
      configuracion: {
        variables: editables.map((v) => ({
          id_variable: v.id_variable,
          nombre_variable: v.nombre_variable,
          etiqueta: v.etiqueta,
          unidad: v.unidad,
          valor: values[v.nombre_variable] ?? v.valor_default,
        })),
        notas: notas.trim() || undefined,
      },
      cantidad,
      precioCalculado: precioUnitario,
    });
    window.dispatchEvent(new CustomEvent("carrito:updated"));
    setFeedback(`${nombreServicio} agregado al carrito`);
    setTimeout(() => setFeedback(null), 2500);
  }

  if (materiales.length === 0) {
    return (
      <p className="text-[14px] text-[#8b434a]">
        Este servicio no tiene materiales configurados. Contacta a soporte.
      </p>
    );
  }

  const subtotal = precioUnitario !== null ? precioUnitario * cantidad : null;

  return (
    <div className="flex flex-col gap-[20px]">
      {/* ── Precio estimado callout ── */}
      <div className="bg-[#ffd9e2] rounded-[14px] p-[24px] flex flex-col gap-[4px]">
        <p className="text-[14px] text-[#1e1e1e]">Precio estimado</p>
        <p className="font-bold text-[40px] leading-none text-[#1e1e1e]">
          {subtotal !== null ? formatPeso(subtotal) : "—"}
        </p>
        <p className="text-[12px] text-[#1e1e1e]/70 mt-[4px]">
          El precio puede cambiar según configuración, material y cantidad.
        </p>
      </div>

      {/* ── Configura tu producto card ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#ffd9e2] rounded-[14px] p-[24px] flex flex-col gap-[16px]"
      >
        <h2 className="font-bold text-[18px] text-[#1e1e1e]">Configura tu producto</h2>

        <div className="grid grid-cols-2 gap-x-[16px] gap-y-[12px]">
          {/* Material */}
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="material" className="text-[13px] font-medium text-[#1e1e1e]">
              Material
            </label>
            <select
              id="material"
              value={idMaterial ?? ""}
              onChange={(e) => setIdMaterial(Number(e.target.value))}
              className="h-[40px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[13px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a]"
            >
              {materiales.map((m) => (
                <option key={m.id_material} value={m.id_material}>
                  {m.nombre_material}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="cantidad" className="text-[13px] font-medium text-[#1e1e1e]">
              Cantidad
            </label>
            <input
              id="cantidad"
              type="number"
              min={1}
              max={9999}
              value={cantidad}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCantidad(Number.isFinite(val) ? Math.max(1, Math.floor(val)) : 1);
              }}
              className="h-[40px] rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] text-[13px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a]"
            />
          </div>

          {/* Editable variables */}
          {editables.map((v) => (
            <div key={v.id_variable} className="flex flex-col gap-[4px]">
              <label
                htmlFor={`var-${v.id_variable}`}
                className="text-[13px] font-medium text-[#1e1e1e]"
              >
                {v.etiqueta}
              </label>
              <div className="relative">
                <input
                  id={`var-${v.id_variable}`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={values[v.nombre_variable] ?? ""}
                  onChange={(e) => handleVarChange(v.nombre_variable, e.target.value)}
                  className="h-[40px] w-full rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] pr-[44px] text-[13px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a]"
                />
                {v.unidad && (
                  <span className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[12px] text-[#666] pointer-events-none">
                    {v.unidad}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notas de diseño */}
        <div className="flex flex-col gap-[4px]">
          <label htmlFor="notas" className="text-[13px] font-medium text-[#1e1e1e]">
            Notas de diseño
          </label>
          <textarea
            id="notas"
            rows={3}
            placeholder="Escribe instrucciones o comentarios sobre tu diseño"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={500}
            className="rounded-[8px] border border-[#c2c0c0] bg-white px-[12px] py-[8px] text-[13px] text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#8b434a] resize-none"
          />
        </div>

        {/* Summary box */}
        <div className="bg-white rounded-[10px] px-[16px] py-[12px] flex flex-col gap-[6px]">
          <div className="flex justify-between text-[13px] text-[#1e1e1e]">
            <span>Precio unitario</span>
            <span className="font-medium">
              {precioUnitario !== null ? formatPeso(precioUnitario) : "—"}
            </span>
          </div>
          <div className="flex justify-between text-[13px] text-[#1e1e1e]">
            <span>Subtotal</span>
            <span className="font-medium">{subtotal !== null ? formatPeso(subtotal) : "—"}</span>
          </div>
          <div className="flex justify-between text-[13px] text-[#1e1e1e]">
            <span>Tiempo estimado</span>
            <span className="font-medium text-[#666]">—</span>
          </div>
        </div>

        {calculating && precioUnitario === null && (
          <p className="text-[12px] text-[#666]">Calculando…</p>
        )}
        {calcError && <p className="text-[13px] font-medium text-[#c14a4a]">{calcError}</p>}
        {feedback && <p className="text-[13px] font-medium text-[#2e7d32]">{feedback}</p>}

        <div className="flex gap-[12px]">
          <button
            type="submit"
            disabled={precioUnitario === null || calculating}
            className="flex-1 bg-[#8b434a] rounded-[10px] h-[48px] text-white font-semibold text-[15px] hover:bg-[#7a3a41] active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar al carrito
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-white border border-[#8b434a] rounded-[10px] h-[48px] text-[#8b434a] font-semibold text-[15px] hover:bg-[#fff0f3] active:scale-[0.99] transition-all duration-150"
          >
            Restablecer
          </button>
        </div>
      </form>
    </div>
  );
}
