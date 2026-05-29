"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { UploadedFile } from "@/components/storefront/molecules/DesignUploadZone";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
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
  disenioFile?: UploadedFile | null;
  imagenUrls?: string[];
}

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function stripZodPathPrefix(msg: string): string {
  return msg.replace(/^[a-zA-Z0-9_.]+: /, "");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FormulaVariablesForm({
  servicioId,
  nombreServicio,
  materiales,
  variables,
  disenioFile,
  imagenUrls,
}: Props) {
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
  const router = useRouter();
  const lastRequestId = useRef(0);

  useEffect(() => {
    if (idMaterial === null) return;
    // reAchi301 review: skip the price call while any variable is empty —
    // an empty field is NaN (see handleVarChange), not a usable 0.
    const hasEmpty = editables.some((v) => !Number.isFinite(values[v.nombre_variable]));
    if (hasEmpty) {
      setPrecioUnitario(null);
      setCalcError("Completa todos los campos para ver el precio");
      setCalculating(false);
      return;
    }
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
          setCalcError(stripZodPathPrefix(json.error ?? "Error al calcular el precio"));
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
    }, 400);
    return () => clearTimeout(timer);
  }, [idMaterial, values, servicioId, editables]);

  // Mirror server schema: variable values are strictly positive with a
  // safety-net upper bound (catches typo overflows like 999999999).
  const VAR_MIN = 0; // exclusive — final check is `> 0` on submit
  const VAR_MAX = 100000;

  function handleVarChange(nombre: string, raw: string) {
    // reAchi301 review: an empty input must NOT collapse to 0 — a 0 silently
    // poisons the formula (divide-by-zero, or a 0× that zeroes the price with
    // no error). Store NaN as the "empty" sentinel; calc + submit guard on it.
    if (raw.trim() === "") {
      setValues((prev) => ({ ...prev, [nombre]: NaN }));
      return;
    }
    const num = Number(raw);
    // Reject negatives at the keystroke layer so the field can't visually hold
    // a `-5`. The corresponding server schema rejects anything <= 0.
    if (!Number.isFinite(num) || num < VAR_MIN) return;
    if (num > VAR_MAX) return;
    setValues((prev) => ({ ...prev, [nombre]: num }));
  }

  function handleReset() {
    setIdMaterial(materiales[0]?.id_material ?? null);
    setValues({ ...defaultValues });
    setCantidad(1);
    setNotas("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idMaterial === null) {
      setCalcError("Selecciona un material");
      return;
    }
    if (editables.some((v) => !Number.isFinite(values[v.nombre_variable]))) {
      setCalcError("Completa todos los campos antes de agregar al carrito");
      return;
    }
    if (editables.some((v) => values[v.nombre_variable] <= 0)) {
      setCalcError("Los valores deben ser mayores que 0");
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
      imagenUrls,
      ...(disenioFile ? { disenioKey: disenioFile.key, disenioNombre: disenioFile.filename } : {}),
    });
    window.dispatchEvent(new CustomEvent("carrito:updated"));
    router.push("/tienda/carrito");
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
            <Select
              id="material"
              size="sm"
              value={idMaterial === null ? "" : String(idMaterial)}
              onChange={(v) => setIdMaterial(v ? Number(v) : null)}
            >
              {materiales.map((m) => (
                <SelectOption key={m.id_material} value={String(m.id_material)}>
                  {m.nombre_material}
                </SelectOption>
              ))}
            </Select>
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
                  min={VAR_MIN}
                  max={VAR_MAX}
                  value={
                    Number.isFinite(values[v.nombre_variable]) ? values[v.nombre_variable] : ""
                  }
                  onChange={(e) => handleVarChange(v.nombre_variable, e.target.value)}
                  onKeyDown={(e) => {
                    // Block the minus key outright so the input visually can't
                    // hold a negative; handleVarChange also rejects programmatically.
                    if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                  }}
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

        <div className="flex gap-[12px]">
          <Button
            type="submit"
            variant="primary"
            section="storefront"
            size="md"
            disabled={precioUnitario === null || calculating}
            className="flex-1"
          >
            Agregar al carrito
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleReset}
            className="flex-1"
          >
            Restablecer
          </Button>
        </div>
      </form>
    </div>
  );
}
